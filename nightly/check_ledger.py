"""CI check for nightly/LEDGER.json: the post history the nightly run reads and appends to.

Every entry needs an id, and ids are unique. Posts the engine types (everything not seeded by hand) need a caption
that `adb input text` can type (one line of plain ASCII) and a first-30-character key no other post uses, because
the engine finds a post's stats by those 30 characters.
"""

import json
import re
import sys
from pathlib import Path

ledger = json.loads((Path(__file__).parent / "LEDGER.json").read_text())
problems, ids, keys = [], set(), {}
for i, p in enumerate(ledger.get("posts", [])):
    pid = p.get("id")
    if not pid:
        problems.append(f"post #{i + 1} has no id")
        continue
    if pid in ids:
        problems.append(f"duplicate id {pid}")
    ids.add(pid)
    cap = p.get("caption") or ""
    key = cap[:30].strip().lower()
    if key in keys:
        problems.append(f"{pid}: first 30 characters {key!r} already used by {keys[key]}")
    keys[key] = pid
    if "engine" in str(p.get("posted_by", "")) and not re.fullmatch(r"[\x20-\x7E]{10,2000}", cap):
        problems.append(f"{pid}: caption is not one line of plain ASCII")
print(f"{len(ids)} posts checked")
if problems:
    print("\n".join(problems))
    sys.exit(1)
