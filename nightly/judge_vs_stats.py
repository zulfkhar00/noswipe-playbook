"""Does the blind-checker's score predict how a post actually does?

Joins every LEDGER.json post that has `checker` scores with its latest stats snapshot (48h preferred) and prints a
markdown table plus Spearman rank correlations between each score and views / retention. Paste the output into
learn.md. With fewer than MIN_N scored posts that have stats it says so instead of correlating: the numbers would be
noise.

    python3 nightly/judge_vs_stats.py [--stats ~/feedback/stats.db]
"""

from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path

SCORES = ("clarity", "hook", "satisfaction", "want_next")
LABEL_ORDER = ("48h", "24h", "12h", "6h", "3h", "1h")  # prefer the latest, most settled snapshot
MIN_N = 6


def key(caption: str) -> str:
    return caption[:30].strip().lower()  # how the engine matches posts


def latest_snapshots(stats_db: Path) -> dict[str, tuple[str, dict]]:
    out: dict[str, tuple[str, dict]] = {}
    if not stats_db.exists():
        return out
    con = sqlite3.connect(stats_db)
    for caption, label, data in con.execute("select caption, label, data from snapshots where label is not null"):
        if label not in LABEL_ORDER:
            continue
        k = key(caption or "")
        have = out.get(k)
        if have is None or LABEL_ORDER.index(label) < LABEL_ORDER.index(have[0]):
            out[k] = (label, json.loads(data))
    return out


def ranks(xs: list[float]) -> list[float]:
    order = sorted(range(len(xs)), key=lambda i: xs[i])
    r = [0.0] * len(xs)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and xs[order[j + 1]] == xs[order[i]]:
            j += 1
        for k in range(i, j + 1):
            r[order[k]] = (i + j) / 2 + 1  # ties share the average rank
        i = j + 1
    return r


def spearman(xs: list[float], ys: list[float]) -> float | None:
    rx, ry = ranks(xs), ranks(ys)
    n = len(xs)
    mx, my = sum(rx) / n, sum(ry) / n
    sx = sum((a - mx) ** 2 for a in rx) ** 0.5
    sy = sum((b - my) ** 2 for b in ry) ** 0.5
    if sx == 0 or sy == 0:
        return None
    return sum((a - mx) * (b - my) for a, b in zip(rx, ry)) / (sx * sy)


def report(ledger: dict, snaps: dict[str, tuple[str, dict]]) -> str:
    rows = []
    for p in ledger.get("posts", []):
        c = p.get("checker")
        if not isinstance(c, dict):
            continue
        snap = snaps.get(key(p.get("caption") or ""))
        rows.append((p, c, snap))
    lines = ["## Blind-checker vs real stats", ""]
    if not rows:
        return "\n".join(lines + ["No posts with checker scores yet.", ""])
    lines += ["| post | clarity | hook | satisf. | next | snapshot | views | skip % | avg watch s |",
              "|---|---|---|---|---|---|---|---|---|"]
    for p, c, snap in rows:
        label, d = snap if snap else ("-", {})
        lines.append(f"| {p['id']} | " + " | ".join(str(c.get(s, "-")) for s in SCORES)
                     + f" | {label} | {d.get('views', '-')} | {d.get('skip_rate_pct', '-')} | {d.get('average_watch_time_s', '-')} |")
    have = [(c, snap[1]) for _, c, snap in rows if snap and snap[1].get("views") is not None]
    lines.append("")
    if len(have) < MIN_N:
        lines.append(f"Correlation: only {len(have)} scored posts have stats (need {MIN_N}); not meaningful yet.")
        return "\n".join(lines + [""])
    lines += ["Spearman correlation (+1 = the score ranks posts exactly like reality, 0 = no relation):", "",
              "| score | vs views | vs retention (100 - skip %) |", "|---|---|---|"]
    for s in SCORES:
        pts = [(float(c[s]), d) for c, d in have if isinstance(c.get(s), (int, float))]
        if len(pts) < MIN_N:
            lines.append(f"| {s} | n={len(pts)} | n={len(pts)} |")
            continue
        xs = [x for x, _ in pts]
        v = spearman(xs, [float(d["views"]) for _, d in pts])
        kept = [(x, 100 - float(d["skip_rate_pct"])) for x, d in pts if d.get("skip_rate_pct") is not None]
        r = spearman([x for x, _ in kept], [y for _, y in kept]) if len(kept) >= MIN_N else None
        fmt = lambda z: "-" if z is None else f"{z:+.2f}"
        lines.append(f"| {s} | {fmt(v)} (n={len(pts)}) | {fmt(r)} (n={len(kept)}) |")
    lines += ["", "Read it: a score near 0 or negative is not predicting anything; do not gate on it alone."]
    return "\n".join(lines + [""])


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stats", default=str(Path.home() / "feedback" / "stats.db"))
    ap.add_argument("--ledger", default=str(Path(__file__).parent / "LEDGER.json"))
    a = ap.parse_args()
    print(report(json.loads(Path(a.ledger).read_text()), latest_snapshots(Path(a.stats))))


if __name__ == "__main__":
    main()
