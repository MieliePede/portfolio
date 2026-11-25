"""Plain-assert checks for breed matching and validation. Run: python backend/tests/test_breeds.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.breeds import ALIASES, match_dogceo, validate_bhs_list  # noqa: E402

TREE = {
    "beagle": [],
    "bullterrier": ["staffordshire"],
    "bulldog": ["boston", "english", "french"],
    "greyhound": ["indian", "italian"],
    "german": ["shepherd"],
    "hound": ["afghan", "blood"],
    "retriever": ["flatcoated", "golden"],
    "terrier": ["kerryblue", "yorkshire"],
    "labrador": [],
}

# exact, sub-breed in both orders, multi-word sub-breed, trailing "-dog"
assert match_dogceo("beagle", TREE) == "beagle"
assert match_dogceo("golden-retriever", TREE) == "retriever/golden"
assert match_dogceo("afghan-hound", TREE) == "hound/afghan"
assert match_dogceo("flat-coated-retriever", TREE) == "retriever/flatcoated"
assert match_dogceo("kerry-blue-terrier", TREE) == "terrier/kerryblue"
assert match_dogceo("german-shepherd-dog", TREE) == "german/shepherd"
assert match_dogceo("staffordshire-bull-terrier", TREE) == "bullterrier/staffordshire"

# aliases, and an alias whose target dog.ceo no longer has
assert match_dogceo("bloodhound", TREE) == "hound/blood"
assert match_dogceo("labrador-retriever", TREE) == "labrador"
assert match_dogceo("bulldog", TREE) == "bulldog/english"
assert match_dogceo("collie", TREE) is None  # alias target rough/collie not in this tree

# never a partial or mixed-breed match
assert match_dogceo("bull-terrier", TREE) is None  # not "terrier", not bullterrier + its sub-breeds
assert match_dogceo("greyhound", TREE) is None  # parent list is mostly Italian greyhounds
assert match_dogceo("cane-corso", TREE) is None

# every alias is written as "parent" or "parent/sub"
assert all(v and v.count("/") <= 1 and v == v.lower() for v in ALIASES.values())

good = {"slug": "beagle", "breed": "Beagle", "conditions": ["Obesity"]}
assert len(validate_bhs_list({"breeds": [good] * 120})) == 120
for bad in (
    None,
    {},
    {"breeds": "nope"},
    {"breeds": [good] * 5},  # too short: a partial response must not wipe the table
    {"breeds": [good] * 119 + [{"slug": "", "breed": "X", "conditions": []}]},
    {"breeds": [good] * 119 + [{"slug": "x", "breed": "X", "conditions": [1]}]},
):
    try:
        validate_bhs_list(bad)
    except ValueError:
        pass
    else:
        raise AssertionError(f"accepted bad payload: {str(bad)[:80]}")

print("test_breeds: all passed")
