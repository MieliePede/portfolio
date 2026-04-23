import asyncio
import os
import re
import urllib.request
from typing import Any

import asyncpg
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/search")

GUTENBERG_URL = "https://www.gutenberg.org/files/2701/2701-0.txt"

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool | None:
    global _pool
    if _pool is not None:
        return _pool
    url = os.getenv("DATABASE_URL")
    if not url:
        return None
    try:
        _pool = await asyncpg.create_pool(url, min_size=1, max_size=5)
        return _pool
    except Exception:
        return None


async def ensure_table(pool: asyncpg.Pool) -> None:
    await pool.execute("""
        CREATE TABLE IF NOT EXISTS book_passages (
            id            SERIAL PRIMARY KEY,
            chapter_num   INT,
            chapter_title TEXT,
            passage_num   INT,
            content       TEXT NOT NULL,
            search_vector tsvector GENERATED ALWAYS AS
                          (to_tsvector('english', content)) STORED
        )
    """)
    await pool.execute("""
        CREATE INDEX IF NOT EXISTS book_passages_fts_idx
        ON book_passages USING GIN(search_vector)
    """)


def _fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "portfolio-demo/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")


def parse_moby_dick(text: str) -> list[dict[str, Any]]:
    start = text.find("CHAPTER 1.")
    end_marker = "*** END OF THE PROJECT GUTENBERG"
    end = text.find(end_marker)
    book = text[start : end if end > 0 else len(text)]

    chapter_re = re.compile(r"^(CHAPTER \d+\.\s+.+)$", re.MULTILINE)
    splits = list(chapter_re.finditer(book))

    passages: list[dict[str, Any]] = []
    for i, match in enumerate(splits):
        header = match.group(1).strip()
        m = re.match(r"CHAPTER (\d+)\.\s+(.+)", header)
        chapter_num = int(m.group(1)) if m else i + 1
        chapter_title = m.group(2).rstrip(".") if m else header

        seg_start = match.end()
        seg_end = splits[i + 1].start() if i + 1 < len(splits) else len(book)
        body = book[seg_start:seg_end]

        for j, raw in enumerate(body.split("\n\n")):
            cleaned = " ".join(raw.split())
            if len(cleaned) >= 120:
                passages.append({
                    "chapter_num": chapter_num,
                    "chapter_title": chapter_title,
                    "passage_num": j + 1,
                    "content": cleaned,
                })
    return passages


@router.get("/status")
async def search_status() -> dict[str, Any]:
    pool = await get_pool()
    if pool is None:
        return {"ready": False, "reason": "no_db"}
    try:
        await ensure_table(pool)
        count = await pool.fetchval("SELECT COUNT(*) FROM book_passages")
        return {"ready": count > 0, "count": int(count), "title": "Moby Dick"}
    except Exception as exc:
        return {"ready": False, "reason": str(exc)}


@router.post("/seed")
async def seed_book() -> dict[str, Any]:
    pool = await get_pool()
    if pool is None:
        raise HTTPException(503, "No database connection")

    await ensure_table(pool)
    existing = await pool.fetchval("SELECT COUNT(*) FROM book_passages")
    if existing > 0:
        return {"seeded": False, "count": int(existing), "message": "Already seeded"}

    raw = await asyncio.to_thread(_fetch_text, GUTENBERG_URL)
    passages = parse_moby_dick(raw)

    batch_size = 100
    for i in range(0, len(passages), batch_size):
        batch = passages[i : i + batch_size]
        await pool.executemany(
            "INSERT INTO book_passages (chapter_num, chapter_title, passage_num, content) "
            "VALUES ($1, $2, $3, $4)",
            [(p["chapter_num"], p["chapter_title"], p["passage_num"], p["content"]) for p in batch],
        )

    return {"seeded": True, "count": len(passages)}


@router.get("")
async def search(q: str = "", limit: int = 10) -> dict[str, Any]:
    if not q.strip():
        return {"results": [], "total": 0, "sql": ""}

    pool = await get_pool()
    if pool is None:
        raise HTTPException(503, "No database connection")

    sql_display = (
        f"SELECT chapter_num, chapter_title,\n"
        f"  ts_headline('english', content, query,\n"
        f"    'StartSel=<mark>, StopSel=</mark>, MaxWords=55, MinWords=25') AS headline,\n"
        f"  ts_rank(search_vector, query) AS rank\n"
        f"FROM book_passages,\n"
        f"     plainto_tsquery('english', '{q}') AS query\n"
        f"WHERE search_vector @@ query\n"
        f"ORDER BY rank DESC LIMIT {limit};"
    )

    try:
        rows = await pool.fetch(
            """
            SELECT
                p.chapter_num,
                p.chapter_title,
                ts_headline(
                    'english', p.content, q.query,
                    'StartSel=<mark>, StopSel=</mark>, MaxWords=55, MinWords=25,
                     ShortWord=3, HighlightAll=false'
                ) AS headline,
                round(ts_rank(p.search_vector, q.query)::numeric, 4) AS rank
            FROM book_passages p,
                 plainto_tsquery('english', $1) AS q(query)
            WHERE p.search_vector @@ q.query
            ORDER BY rank DESC
            LIMIT $2
            """,
            q,
            limit,
        )
        total = await pool.fetchval(
            "SELECT COUNT(*) FROM book_passages "
            "WHERE search_vector @@ plainto_tsquery('english', $1)",
            q,
        )
        return {
            "results": [dict(r) for r in rows],
            "total": int(total),
            "sql": sql_display,
        }
    except asyncpg.InvalidTextRepresentationError:
        return {"results": [], "total": 0, "sql": sql_display, "error": "invalid_query"}
