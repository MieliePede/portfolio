"""Dog breed health data: daily sync from two public APIs into Postgres, plus the search API.

Breed Health Score (CC-BY-4.0) is the source of truth for breeds, scores and conditions.
dog.ceo only adds photos, and only where a breed name matches confidently.
"""
import asyncio
import json
import logging
import os
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import Any

import asyncpg
from fastapi import APIRouter, HTTPException, Query

log = logging.getLogger("breeds")

BHS = "https://breedhealthscore.com"
DOGCEO = "https://dog.ceo/api"
SYNC_EVERY = timedelta(hours=24)
PHOTOS_PER_BREED = 6

# Breed Health Score slug -> dog.ceo path, for names the rules in match_dogceo can't line up.
# Checked by eye; add to this when the sync log lists an unmatched breed that dog.ceo does have.
ALIASES = {
    "airedale-terrier": "airedale",
    "alaskan-malamute": "malamute",
    "american-eskimo-dog": "eskimo",
    "american-staffordshire-terrier": "terrier/american",
    "australian-cattle-dog": "cattledog/australian",
    "belgian-malinois": "malinois",
    "belgian-tervuren": "tervuren",
    "bernese-mountain-dog": "mountain/bernese",
    "bichon-frise": "frise/bichon",
    "bloodhound": "hound/blood",
    "bouvier-des-flandres": "bouvier",
    "brittany": "spaniel/brittany",
    "brussels-griffon": "brabancon",
    "bulldog": "bulldog/english",
    "cardigan-welsh-corgi": "corgi/cardigan",
    "caucasian-shepherd-dog": "ovcharka/caucasian",
    "cavalier-king-charles-spaniel": "spaniel/blenheim",
    "chesapeake-bay-retriever": "retriever/chesapeake",
    "chinese-shar-pei": "sharpei",
    "chow-chow": "chow",
    "clumber-spaniel": "clumber",
    "collie": "rough/collie",
    "coton-de-tulear": "cotondetulear",
    "curly-coated-retriever": "retriever/curly",
    "dandie-dinmont-terrier": "terrier/dandie",
    "doberman-pinscher": "doberman",
    "english-cocker-spaniel": "spaniel/cocker",
    "english-springer-spaniel": "springer/english",
    "german-shorthaired-pointer": "pointer/german",
    "giant-schnauzer": "schnauzer/giant",
    "great-pyrenees": "pyrenees",
    "irish-water-spaniel": "spaniel/irish",
    "jack-russell-terrier": "terrier/russell",
    "japanese-chin": "spaniel/japanese",
    "labrador-retriever": "labrador",
    "leonberger": "leonberg",
    "lhasa-apso": "lhasa",
    "mastiff": "mastiff/english",
    "miniature-pinscher": "pinscher/miniature",
    "miniature-schnauzer": "schnauzer/miniature",
    "norwegian-elkhound": "elkhound/norwegian",
    "old-english-sheepdog": "sheepdog/english",
    "pekingese": "pekinese",
    "pembroke-welsh-corgi": "pembroke",
    "poodle": "poodle/standard",
    "rhodesian-ridgeback": "ridgeback/rhodesian",
    "shetland-sheepdog": "sheepdog/shetland",
    "shiba-inu": "shiba",
    "shih-tzu": "shihtzu",
    "siberian-husky": "husky",
    "soft-coated-wheaten-terrier": "terrier/wheaten",
    "spanish-water-dog": "waterdog/spanish",
    "st-bernard": "stbernard",
    "toy-manchester-terrier": "terrier/toy",
    "welsh-springer-spaniel": "spaniel/welsh",
    "west-highland-white-terrier": "terrier/westhighland",
    "wire-fox-terrier": "terrier/fox",
}


# ─── Matching and validation (pure, tested in backend/tests/test_breeds.py) ──────────

def _compact(slug: str) -> str:
    if slug.endswith("-dog"):
        slug = slug[: -len("-dog")]
    return slug.replace("-", "")


def match_dogceo(slug: str, tree: dict[str, list[str]]) -> str | None:
    """Map a Breed Health Score slug to a dog.ceo path ("parent" or "parent/sub"), or None.

    Whole-name matches only: "bull-terrier" must never fall back to the generic "terrier".
    A parent with sub-breeds never matches on its own, because dog.ceo's parent image list
    includes every sub-breed (its "greyhound" list is almost all Italian greyhounds).
    """
    if slug in ALIASES:
        path = ALIASES[slug]
        parent, _, sub = path.partition("/")
        return path if parent in tree and (not sub or sub in tree[parent]) else None
    c = _compact(slug)
    if c in tree and not tree[c]:
        return c
    for parent, subs in tree.items():
        for sub in subs:
            if c in (sub + parent, parent + sub):
                return f"{parent}/{sub}"
    return None


def validate_bhs_list(payload: Any) -> list[dict[str, Any]]:
    """Reject anything that doesn't look like a full breed list, so a bad fetch can't wipe the table."""
    breeds = payload.get("breeds") if isinstance(payload, dict) else None
    if not isinstance(breeds, list) or len(breeds) < 100:
        raise ValueError(f"expected 100+ breeds, got {len(breeds) if isinstance(breeds, list) else breeds!r}")
    for b in breeds:
        if not (
            isinstance(b, dict)
            and isinstance(b.get("slug"), str) and b["slug"]
            and isinstance(b.get("breed"), str) and b["breed"]
            and isinstance(b.get("conditions"), list)
            and all(isinstance(c, str) for c in b["conditions"])
        ):
            raise ValueError(f"malformed breed entry: {str(b)[:200]}")
    return breeds


# ─── Fetching ─────────────────────────────────────────────────────────────────

def _get_json(url: str) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "portfolio-breed-sync/1.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8"))


async def get_json(url: str) -> Any:
    return await asyncio.to_thread(_get_json, url)


def _num(v: Any) -> float | None:
    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def _int(v: Any) -> int | None:
    return int(v) if isinstance(v, int) and not isinstance(v, bool) else None


def _str(v: Any) -> str | None:
    return v if isinstance(v, str) and v else None


async def fetch_all() -> tuple[list[dict[str, Any]], list[str]]:
    """Fetch and combine both sources. Returns (rows ready for the DB, unmatched slugs)."""
    breeds = validate_bhs_list(await get_json(f"{BHS}/api/breeds.json"))
    tree_payload = await get_json(f"{DOGCEO}/breeds/list/all")
    tree = tree_payload.get("message") if isinstance(tree_payload, dict) else None
    if not isinstance(tree, dict):
        log.warning("dog.ceo breed list unusable, syncing without extra photos")
        tree = {}

    rows, unmatched = [], []
    for b in breeds:
        detail = b
        try:
            d = (await get_json(f"{BHS}/api/v1/breeds/{b['slug']}.json")).get("breed")
            if isinstance(d, dict) and d.get("slug") == b["slug"]:
                detail = {**b, **d}
        except Exception as exc:  # one bad detail page falls back to the list entry
            log.warning("detail fetch failed for %s: %s", b["slug"], exc)
        await asyncio.sleep(0.2)  # BHS asks clients to be reasonable

        photos: list[str] = []
        path = match_dogceo(b["slug"], tree)
        if path is None:
            unmatched.append(b["slug"])
        else:
            try:
                imgs = (await get_json(f"{DOGCEO}/breed/{path}/images")).get("message")
                photos = [u for u in imgs if isinstance(u, str) and u.startswith("https://")][:PHOTOS_PER_BREED]
            except Exception as exc:
                log.warning("dog.ceo images failed for %s (%s): %s", b["slug"], path, exc)
            await asyncio.sleep(0.2)

        comp = detail.get("components") if isinstance(detail.get("components"), dict) else {}
        image = detail.get("image") if isinstance(detail.get("image"), dict) else {}
        credit = " / ".join(x for x in (_str(image.get("photographer")), _str(image.get("source"))) if x)
        rows.append({
            "slug": b["slug"],
            "name": b["breed"],
            "size": _str(detail.get("size")),
            "weight": _str(detail.get("weight_kg")),
            "median_lifespan_years": _num(detail.get("median_lifespan_years")),
            "brachycephalic": detail.get("brachycephalic") is True,
            "health_score": _int(detail.get("health_score")),
            "grade": _str(detail.get("grade")),
            "longevity": _int(comp.get("longevity")),
            "conformation": _int(comp.get("conformation")),
            "burden": _int(comp.get("burden")),
            "severe_count": _int(detail.get("severe_count")),
            "conditions": list(b["conditions"]),
            "source_url": _str(detail.get("url")) or f"{BHS}/breed/{b['slug']}/",
            "image_url": _str(image.get("url")),
            "image_credit": credit or None,
            "photos": photos,
        })
    return rows, unmatched


# ─── Database ─────────────────────────────────────────────────────────────────

_pool: asyncpg.Pool | None = None

COLUMNS = [
    "slug", "name", "size", "weight", "median_lifespan_years", "brachycephalic", "health_score",
    "grade", "longevity", "conformation", "burden", "severe_count", "conditions", "source_url",
    "image_url", "image_credit", "photos",
]

# shortcut: no migration tool, add Alembic when the schema changes after launch
SCHEMA = """
CREATE TABLE IF NOT EXISTS breeds (
    slug                  TEXT PRIMARY KEY,
    name                  TEXT NOT NULL,
    size                  TEXT,
    weight                TEXT,
    median_lifespan_years DOUBLE PRECISION,
    brachycephalic        BOOLEAN NOT NULL,
    health_score          INT,
    grade                 TEXT,
    longevity             INT,
    conformation          INT,
    burden                INT,
    severe_count          INT,
    conditions            TEXT[] NOT NULL,
    source_url            TEXT NOT NULL,
    image_url             TEXT,
    image_credit          TEXT,
    photos                TEXT[] NOT NULL DEFAULT '{}',
    synced_at             TIMESTAMPTZ NOT NULL
)
"""

# One-off fix for databases created before lifespan was DOUBLE PRECISION: REAL stored 15.4 as
# 15.399999618530273. Rounds the stored values while converting; does nothing once converted.
MIGRATE_LIFESPAN = """
DO $$ BEGIN
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_name = 'breeds' AND column_name = 'median_lifespan_years') = 'real' THEN
        ALTER TABLE breeds ALTER COLUMN median_lifespan_years TYPE DOUBLE PRECISION
            USING round(median_lifespan_years::numeric, 2)::double precision;
    END IF;
END $$
"""


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        pool = await asyncpg.create_pool(
            host=os.getenv("DB_HOST", "db"),
            user="portfolio",
            database="portfolio",
            # separate arguments, not a URL, so special characters in the password are safe
            password=os.environ.get("POSTGRES_PASSWORD", ""),
            min_size=1,
            max_size=5,
        )
        await pool.execute(SCHEMA)
        try:
            await pool.execute(MIGRATE_LIFESPAN)
        except Exception:  # cosmetic fix only; never let it take the breed API down
            log.exception("lifespan column migration failed")
        _pool = pool  # only cache a pool whose schema step worked, so failures retry cleanly
    return _pool


async def sync_breeds() -> None:
    rows, unmatched = await fetch_all()
    now = datetime.now(timezone.utc)
    pool = await get_pool()
    cols = ", ".join(COLUMNS)
    params = ", ".join(f"${i}" for i in range(1, len(COLUMNS) + 2))
    updates = ", ".join(f"{c} = EXCLUDED.{c}" for c in COLUMNS[1:] + ["synced_at"])
    async with pool.acquire() as conn, conn.transaction():
        await conn.executemany(
            f"INSERT INTO breeds ({cols}, synced_at) VALUES ({params}) "
            f"ON CONFLICT (slug) DO UPDATE SET {updates}",
            [[r[c] for c in COLUMNS] + [now] for r in rows],
        )
        # only reached after validate_bhs_list passed, so this never empties the table
        await conn.execute("DELETE FROM breeds WHERE slug <> ALL($1::text[])", [r["slug"] for r in rows])
    with_photos = sum(1 for r in rows if r["photos"])
    log.info("breed sync done: %d breeds, %d with dog.ceo photos, unmatched: %s",
             len(rows), with_photos, ", ".join(unmatched) or "none")


async def sync_loop() -> None:
    """Sync now if the data is missing or stale, then once a day. Deploys restart the backend,
    so the staleness check keeps redeploys from re-fetching everything."""
    while True:
        try:
            pool = await get_pool()
            last = await pool.fetchval("SELECT max(synced_at) FROM breeds")
            due = last is None or datetime.now(timezone.utc) - last >= SYNC_EVERY
            if due:
                await sync_breeds()
                wait = SYNC_EVERY
            else:
                wait = SYNC_EVERY - (datetime.now(timezone.utc) - last)
        except Exception:
            log.exception("breed sync failed; keeping existing data, retrying in 1 hour")
            wait = timedelta(hours=1)
        await asyncio.sleep(wait.total_seconds())


# ─── API ──────────────────────────────────────────────────────────────────────

router = APIRouter(prefix="/api/breeds")

LIST_FIELDS = ("slug, name, size, median_lifespan_years, brachycephalic, health_score, grade, "
               "conditions, image_url, photos[1] AS photo")
SORTS = {
    "score": "health_score DESC NULLS LAST, name",
    "lifespan": "median_lifespan_years DESC NULLS LAST, name",
    "name": "name",
}


def word_start_pattern(q: str) -> str:
    r"""Postgres regex matching the search text at the start of a word, so "hip" finds
    "Hip dysplasia" but not "Schipperke". \m is Postgres's start-of-word anchor; the text is
    escaped so it can only match literally."""
    return r"\m" + re.escape(q.strip())


async def _pool_or_503() -> asyncpg.Pool:
    try:
        return await get_pool()
    except Exception:
        log.exception("database unavailable")
        raise HTTPException(503, "Breed data is unavailable right now")


@router.get("")
async def search_breeds(
    q: str = Query("", max_length=100),
    size: str | None = Query(None, max_length=20),
    flat_faced: bool | None = None,
    sort: str = Query("score", pattern="^(score|lifespan|name)$"),
) -> dict[str, Any]:
    pool = await _pool_or_503()
    rows = await pool.fetch(
        f"""
        SELECT {LIST_FIELDS} FROM breeds
        WHERE (name ~* $1 OR EXISTS (SELECT 1 FROM unnest(conditions) c WHERE c ~* $1))
          AND ($2::text IS NULL OR size = $2)
          AND ($3::boolean IS NULL OR brachycephalic = $3)
        ORDER BY {SORTS[sort]}
        """,
        word_start_pattern(q), size, flat_faced,
    )
    synced = await pool.fetchval("SELECT max(synced_at) FROM breeds")
    return {"breeds": [dict(r) for r in rows], "total": len(rows), "synced_at": synced}


@router.get("/{slug}")
async def get_breed(slug: str) -> dict[str, Any]:
    pool = await _pool_or_503()
    row = await pool.fetchrow("SELECT * FROM breeds WHERE slug = $1", slug)
    if row is None:
        raise HTTPException(404, "Breed not found")
    return dict(row)


# ─── Dry run: python -m app.breeds --dry-run ─────────────────────────────────

if __name__ == "__main__":
    if "--dry-run" not in sys.argv:
        sys.exit("usage: python -m app.breeds --dry-run")
    logging.basicConfig(level=logging.INFO)
    rows, unmatched = asyncio.run(fetch_all())
    print(f"{len(rows)} breeds, {sum(1 for r in rows if r['photos'])} with dog.ceo photos, "
          f"{sum(1 for r in rows if r['image_url'])} with a BHS photo")
    print("unmatched:", ", ".join(unmatched))
