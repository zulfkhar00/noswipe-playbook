"""Audio for any "Your Dating App Receipt" episode, driven by its spec in specs/<id>.json.

    python3 generate_elevenlabs_voice.py --project receipt --episode after-midnight
    python3 generate_receipt_audio.py after-midnight

The spec's lines are voiced one by one (with character timestamps), laid end to end with each
line's gapBefore, and every named beat is resolved to the time its anchor word is spoken. The
timeline (lines, exact words, mouth keyframes, beats) goes to src/receipt/<id>.timeline.json,
which the visuals read. Music and Foley are synthesized against the same beats.
"""

from __future__ import annotations

import json
import math
import random
import sys
from pathlib import Path

from audio_kit import RATE, Track, probe, speech_data, trim, write

ROOT = Path(__file__).parent
PUBLIC = ROOT / "public"
VOICE_ID = "R9RZPy40Zzy1wNxrgQpj"  # Witty McGee, the cashier.

# Delivery labels from the scenario writer, mapped to ElevenLabs voice settings.
DELIVERY = {
    "dry": {"stability": 0.5, "style": 0.3, "speed": 1.0},
    "deadpan": {"stability": 0.55, "style": 0.2, "speed": 0.95},
    "punchy": {"stability": 0.4, "style": 0.5, "speed": 1.05},
    "slow reveal": {"stability": 0.5, "style": 0.35, "speed": 0.9},
    "warm": {"stability": 0.45, "style": 0.4, "speed": 1.0},
}

SPEC: dict = {}
LINES: list[tuple[float, str]] = []
RECORDED = PUBLIC / "voice-receipt"
VOICE_OVERRIDES: dict[int, dict] = {}


def configure(episode: str) -> None:
    """Load an episode spec; generate_elevenlabs_voice.py calls this with --episode."""
    global SPEC, LINES, RECORDED, VOICE_OVERRIDES
    SPEC = json.loads((ROOT / "specs" / f"{episode}.json").read_text())
    LINES = [(0.0, ln["text"]) for ln in SPEC["lines"]]
    RECORDED = PUBLIC / f"voice-{SPEC['id']}"
    VOICE_OVERRIDES = {ln["n"]: DELIVERY.get(ln.get("delivery", "dry"), {}) for ln in SPEC["lines"]}


def norm(word: str) -> str:
    return "".join(c for c in word.lower() if c.isalnum() or c == "'")


def timeline() -> dict:
    trimmed = PUBLIC / f"voice-{SPEC['id']}-trimmed"
    trimmed.mkdir(parents=True, exist_ok=True)
    lines, t = [], 0.0
    for ln in SPEC["lines"]:
        name = f"line-{ln['n']:02d}"
        src = next((RECORDED / f"{name}{ext}" for ext in (".wav", ".m4a", ".mp3") if (RECORDED / f"{name}{ext}").exists()), None)
        if not src:
            raise SystemExit(f"missing {name}: run generate_elevenlabs_voice.py --project receipt --episode {SPEC['id']}")
        path = trimmed / f"{name}.wav"
        cut = trim(src, path)
        dur = probe(path)
        start = t + ln["gapBefore"]
        t = start + dur
        line = {"file": str(path.relative_to(PUBLIC)), "start": round(start, 3), "duration": round(dur, 3), "text": ln["text"]}
        align = src.with_suffix(".align.json")
        if align.exists():
            line["words"], line["mouth"] = speech_data(align, cut, start)
        lines.append(line)
        print(f"{name} {dur:5.2f}s  @{start:5.2f}  {ln['text']}")
    beats = {"start": 0.0}
    for b in SPEC["beats"]:
        ln = lines[b["line"] - 1]
        hit = next((w["start"] for w in ln.get("words", []) if norm(w["text"]).startswith(norm(b["word"]))), None)
        if hit is None:
            raise SystemExit(f"beat {b['name']}: word {b['word']!r} not found in line {b['line']}")
        beats[b["name"]] = round(hit + b.get("offset", 0.0), 3)
    beats["end"] = round(t + 1.8, 3)
    data = {"id": SPEC["id"], "lines": lines, "beats": beats, "duration": beats["end"]}
    out = ROOT / "src" / "receipt" / f"{SPEC['id']}.timeline.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
    print(f"total {data['duration']:.2f}s")
    return data


rng = random.Random(2026)


def midi(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def score(tr: Track, b: dict, dur: float, mood: str) -> None:
    """'night': sleepy lo-fi; 'commute': a rail-like pulse; 'gym': a four-on-the-floor workout
    beat that cuts out while the printer stalls. All lift into a brighter major
    key at "Or…", when NoSwipe takes over."""
    def keys(t, ms, d, vol=0.02):
        fs = [midi(m) for m in ms]
        tr.mix(t, d, lambda x: vol * sum(math.sin(2 * math.pi * f * x) * (1 + 0.15 * math.sin(2 * math.pi * 5 * x)) for f in fs) * min(1, x * 8) * math.exp(-0.9 * x))

    def bass(t, m, vol=0.13, d=0.45):
        f = midi(m)
        tr.mix(t, d, lambda x: vol * math.sin(2 * math.pi * f * x) * min(1, x * 120) * math.exp(-4.5 * x))

    def kick(t, vol=0.12):
        tr.mix(t, 0.25, lambda x: vol * math.sin(2 * math.pi * (48 * x + 1.3 * (1 - math.exp(-35 * x)))) * math.exp(-12 * x))

    def tick(t, vol=0.014, decay=70):
        tr.mix(t, 0.08, lambda x: vol * rng.uniform(-1, 1) * math.exp(-decay * x))

    def pluck(t, m, vol=0.03):
        f = midi(m)
        tr.mix(t, 0.4, lambda x: vol * (math.sin(2 * math.pi * f * x) + 0.4 * math.sin(4 * math.pi * f * x) * math.exp(-10 * x)) * math.exp(-7 * x))

    dark = [([57, 60, 64, 67], 45), ([53, 57, 60, 64], 41), ([48, 52, 55, 59], 36), ([55, 59, 62, 65], 43)]   # Am7 Fmaj7 Cmaj7 G7
    bright = [([60, 64, 67, 72], 48), ([55, 59, 62, 67], 43), ([57, 60, 64, 69], 45), ([53, 57, 60, 65], 41)]  # C G Am F
    bpm = {"night": 78, "gym": 96}.get(mood, 104)
    beat = 60 / bpm
    turn = b.get("or", dur * 0.6)
    t, step = 0.0, 0
    while t < dur:
        lift = t >= turn
        prog = bright if lift else dark
        chord, root = prog[(step // 4) % 4]
        k = step % 4
        if mood == "night":
            if k == 0:
                keys(t, chord, beat * 4, 0.018 if not lift else 0.022)
                kick(t, 0.1)
            if k == 2:
                kick(t, 0.07)
            bass(t, root if k in (0, 2) else root + 7, 0.11)
            tick(t + beat / 2, 0.01)
            if lift and step % 2 == 0:
                pluck(t, chord[(step // 2) % 4] + 12, 0.028)
        elif mood == "gym":
            kick(t, 0.13)
            tick(t + beat / 2, 0.022, 45)
            bass(t + beat / 2, root, 0.1, 0.25)
            if k == 0:
                keys(t, chord, beat * 4, 0.014 if not lift else 0.022)
            if k in (1, 3):
                tr.mix(t, 0.12, lambda x: 0.05 * rng.uniform(-1, 1) * math.exp(-30 * x))  # clap
            if lift and step % 2 == 0:
                pluck(t + beat / 2, chord[(step // 2) % 4] + 12, 0.026)
        else:
            # Rail clatter: two quick ticks every half bar, a driving octave bass.
            bass(t, root + (12 if k % 2 else 0), 0.12, 0.3)
            if k in (0, 2):
                tick(t, 0.03, 50); tick(t + 0.09, 0.022, 50)
                kick(t, 0.09)
            tick(t + beat / 2, 0.01)
            if k == 0:
                keys(t, chord, beat * 4, 0.015 if not lift else 0.022)
            if lift:
                pluck(t + beat / 2, chord[(step + 1) % 4] + 12, 0.026)
        t += beat
        step += 1
    stall = SPEC.get("stall")
    if stall:  # the beat drops out for the stalled printer and kicks back in on "Fine."
        a, z = b[stall["from"]] - 0.25, b[stall["to"]] - 0.05
        for i in range(int(a * RATE), min(tr.n, int(z * RATE))):
            x = i / RATE
            tr.buf[i] *= max(0.0, 1 - min(x - a, z - x) / 0.12) if min(x - a, z - x) < 0.12 else 0.0
    if mood == "night":  # a faint vinyl crackle for the 1 AM mood, gone after the turn
        for _ in range(int(turn * 14)):
            at = rng.uniform(0, turn)
            tr.mix(at, 0.01, lambda x: 0.03 * rng.uniform(-1, 1) * math.exp(-400 * x))


def foley(tr: Track, b: dict) -> None:
    def printer(at, d=0.45, vol=0.05):
        tr.mix(at, d, lambda x: vol * rng.uniform(-1, 1) * (0.55 + 0.45 * math.sin(2 * math.pi * 55 * x)) * min(1, x * 40) * min(1, (d - x) * 30))

    def kaching(at):
        for i, hz in enumerate((2093.0, 2637.0, 3136.0)):
            tr.mix(at + i * 0.04, 0.9, lambda x, hz=hz: 0.07 * math.sin(2 * math.pi * hz * x) * math.exp(-4 * x))
        tr.mix(at, 0.12, lambda x: 0.18 * math.sin(2 * math.pi * (70 * x + 0.6 * (1 - math.exp(-30 * x)))) * math.exp(-14 * x))

    def tear(at, d=0.35):
        tr.mix(at, d, lambda x: 0.09 * rng.uniform(-1, 1) * (0.4 + 0.6 * abs(math.sin(2 * math.pi * 30 * x))) * math.sin(math.pi * x / d))

    def whoosh(at, d=0.35, vol=0.05):
        tr.mix(at, d, lambda x: vol * rng.uniform(-1, 1) * math.sin(math.pi * x / d) ** 2)

    def pop(at, hz=1200, vol=0.06):
        tr.mix(at, 0.12, lambda x: vol * math.sin(2 * math.pi * hz * (1 + 0.6 * math.exp(-40 * x)) * x) * math.exp(-28 * x))

    def ping(at):
        for i, hz in enumerate((1318.5, 1760.0)):
            tr.mix(at + i * 0.09, 0.5, lambda x, hz=hz: 0.07 * math.sin(2 * math.pi * hz * x) * math.exp(-6 * x))

    for item in SPEC["receipt"]["items"]:
        printer(max(0.0, b.get(item["atBeat"], 0.0) - 0.15))
    for c in SPEC.get("cutaways", []):
        whoosh(b[c["from"]] - 0.15)
        if c["type"] == "hey":
            for i in range(c["total"] - c["alive"]):
                pop(b[c["from"]] + 0.25 + i * 0.12, 500, 0.04)
        if c["type"] == "stops":
            for i in range(5):
                pop(b[c["from"]] + 0.1 + i * 0.22, 900, 0.04)
    stall = SPEC.get("stall")
    if stall:  # the printer stutters, then clunks to a halt
        at = b[stall["from"]] - 0.6
        for i in range(3):
            printer(at + i * 0.13, 0.07, 0.05)
        tr.mix(at + 0.42, 0.15, lambda x: 0.16 * math.sin(2 * math.pi * 90 * x) * math.exp(-25 * x))
        printer(b[stall["to"]] - 0.05, 0.35, 0.05)
    kaching(b["total"])
    tear(b["or"])
    for item in SPEC["noswipeReceipt"]["items"]:
        printer(b[item["atBeat"]] - 0.1, 0.3, 0.04)
    ping(b["booked"] + 0.1)
    whoosh(b["endcard"] - 0.2, 0.3, 0.04)


if __name__ == "__main__":
    configure(sys.argv[1])
    data = timeline()
    b, dur = data["beats"], data["duration"]
    music, sfx = Track(dur), Track(dur)
    score(music, b, dur, SPEC.get("music", "night")); foley(sfx, b)
    (PUBLIC / "audio").mkdir(parents=True, exist_ok=True)
    write(PUBLIC / f"audio/{SPEC['id']}-music.wav", music.buf)
    write(PUBLIC / f"audio/{SPEC['id']}-sfx.wav", sfx.buf)
