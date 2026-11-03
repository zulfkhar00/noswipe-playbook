"""Audio for any "Safety Card" episode (Format 3), driven by its spec in specs/<id>.json.

    python3 generate_elevenlabs_voice.py --project safety --episode seat-14b
    python3 generate_safety_audio.py seat-14b

Voice handling is the receipt format's: lines voiced one by one with character timestamps, laid
end to end with each line's gapBefore, beats resolved to their anchor words. The timeline goes to
src/safety/<id>.timeline.json. The sound is a cabin's: engine hum, PA chimes, the seat-belt
ding, a bland boarding loop that droops after one AM, and a smoother, brighter loop once the
autopilot (NoSwipe) takes over.
"""

from __future__ import annotations

import json
import math
import random
import sys

import generate_receipt_audio as R
from audio_kit import RATE, Track, probe, speech_data, trim, write

ROOT, PUBLIC = R.ROOT, R.PUBLIC
SPEC: dict = {}
LINES: list[tuple[float, str]] = []
RECORDED = PUBLIC / "voice-safety"
VOICE_OVERRIDES: dict[int, dict] = {}


def configure(episode: str) -> None:
    """Load an episode spec; generate_elevenlabs_voice.py calls this with --episode."""
    global SPEC, LINES, RECORDED, VOICE_OVERRIDES
    R.configure(episode)
    SPEC, LINES, RECORDED, VOICE_OVERRIDES = R.SPEC, R.LINES, R.RECORDED, R.VOICE_OVERRIDES


def timeline() -> dict:
    trimmed = PUBLIC / f"voice-{SPEC['id']}-trimmed"
    trimmed.mkdir(parents=True, exist_ok=True)
    lines, t = [], 0.0
    for ln in SPEC["lines"]:
        name = f"line-{ln['n']:02d}"
        src = next((RECORDED / f"{name}{ext}" for ext in (".wav", ".m4a", ".mp3") if (RECORDED / f"{name}{ext}").exists()), None)
        if not src:
            raise SystemExit(f"missing {name}: run generate_elevenlabs_voice.py --project safety --episode {SPEC['id']}")
        path = trimmed / f"{name}.wav"
        cut = trim(src, path)
        dur = probe(path)
        start = t + ln["gapBefore"]
        t = start + dur
        line = {"file": str(path.relative_to(PUBLIC)), "start": round(start, 3), "duration": round(dur, 3), "text": ln["text"]}
        line["words"], line["mouth"] = speech_data(src.with_suffix(".align.json"), cut, start)
        lines.append(line)
        print(f"{name} {dur:5.2f}s  @{start:5.2f}  {ln['text']}")
    beats = {"start": 0.0}
    for b in SPEC["beats"]:
        ln = lines[b["line"] - 1]
        hit = next((w["start"] for w in ln["words"] if R.norm(w["text"]).startswith(R.norm(b["word"]))), None)
        if hit is None:
            raise SystemExit(f"beat {b['name']}: word {b['word']!r} not found in line {b['line']}")
        beats[b["name"]] = round(hit + b.get("offset", 0.0), 3)
    for i, l in enumerate(lines, 1):
        beats[f"s{i}"] = l["start"]
        beats[f"e{i}"] = round(l["start"] + l["duration"], 3)
    beats["end"] = round(t + 1.3, 3)
    data = {"id": SPEC["id"], "lines": lines, "beats": beats, "duration": beats["end"]}
    out = ROOT / "src" / "safety" / f"{SPEC['id']}.timeline.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
    print(f"total {data['duration']:.2f}s")
    return data


rng = random.Random(14)


def midi(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def epiano(tr: Track, t: float, ms: list[int], d: float, vol: float) -> None:
    """A soft electric-piano chord: sine plus a bell partial, quick attack, long decay, slight tremolo."""
    fs = [midi(m) for m in ms]
    tr.mix(t, d, lambda x: vol * sum(math.sin(2 * math.pi * f * x) + 0.18 * math.sin(2 * math.pi * f * 3.5 * x) * math.exp(-9 * x) for f in fs)
           * math.exp(-1.4 * x) * min(1, x * 200, (d - x) * 12) * (1 + 0.12 * math.sin(2 * math.pi * 5 * x)))


def score(tr: Track, b: dict, dur: float) -> None:
    """The boarding loop: a bland 84 BPM electric-piano progression with a soft brushed tick. It
    droops (slower, lower, quieter) through the evening, stops at one AM, and comes back brighter
    from the autopilot on."""
    beat = 60 / 84
    bland = [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65]]
    bright = [[62, 66, 69, 73], [59, 62, 66, 69], [64, 67, 71, 74], [57, 61, 64, 69]]
    t, i = 0.0, 0
    while t < b["sir1"] - 0.6:
        droop = max(0.0, (t - b["panel1"]) / max(1, b["sir1"] - b["panel1"]))
        chord = [m - (1 if droop > 0.5 else 0) for m in bland[i % 4]]
        epiano(tr, t, chord, beat * 2, 0.012 * (1 - 0.5 * droop))
        epiano(tr, t + beat * 1.5, [chord[0] - 12], beat * 0.5, 0.03 * (1 - 0.5 * droop))
        t += beat * 2 * (1 + 0.25 * droop)
        i += 1
    t, i = b["autopilot"], 0
    while t < dur - 0.4:
        epiano(tr, t, bright[i % 4], beat * 2, 0.013)
        epiano(tr, t + beat, [bright[i % 4][0] - 12], beat * 0.6, 0.03)
        for k in range(4):
            tr.mix(t + k * beat / 2, 0.05, lambda x: 0.012 * rng.uniform(-1, 1) * math.exp(-60 * x))
        t += beat * 2
        i += 1


def cabin(tr: Track, b: dict, dur: float) -> None:
    """Engine hum: low drone plus low-passed noise. Quieter and duller once the lights dim; smooth
    and a touch brighter on autopilot; gone under the brand turn's chatter, back for the payoff."""
    lp, lp2 = 0.0, 0.0
    for i in range(tr.n):
        t = i / RATE
        if t < b["sir1"] - 0.3:
            level, bright = 0.14, 0.06
        elif t < b["autopilot"]:
            level, bright = 0.09, 0.035
        elif t < b["sub"] - 0.2:
            level, bright = 0.12, 0.07
        elif t < b["stowed"] - 0.3:
            level, bright = 0.05, 0.07
        else:
            level, bright = 0.11, 0.07
        x = rng.uniform(-1, 1)
        lp += bright * (x - lp)
        lp2 += 0.02 * (lp - lp2)
        drone = 0.25 * math.sin(2 * math.pi * 58 * t) + 0.12 * math.sin(2 * math.pi * 116.4 * t)
        wob = 1 + 0.08 * math.sin(2 * math.pi * 0.13 * t)
        tr.buf[i] = level * wob * (0.7 * lp + 1.6 * lp2 + 0.25 * drone)


def foley(tr: Track, b: dict) -> None:
    def chime(at, vol=0.07):        # the PA "ding-dong"
        for k, m in enumerate((76, 72)):
            f = midi(m)
            tr.mix(at + k * 0.42, 1.2, lambda x, f=f: vol * (math.sin(2 * math.pi * f * x) + 0.3 * math.sin(2 * math.pi * 2 * f * x)) * math.exp(-3 * x) * min(1, x * 300))

    def ding(at, vol=0.06):         # seat-belt sign
        f = midi(81)
        tr.mix(at, 1.0, lambda x: vol * math.sin(2 * math.pi * f * x) * math.exp(-4 * x) * min(1, x * 300))

    def tick(at, vol=0.05):
        tr.mix(at, 0.025, lambda x: vol * rng.uniform(-1, 1) * math.exp(-140 * x))

    def pop(at, hz=1200, vol=0.07):
        tr.mix(at, 0.12, lambda x: vol * math.sin(2 * math.pi * hz * (1 + 0.6 * math.exp(-40 * x)) * x) * math.exp(-28 * x))

    def flip(at, vol=0.07):         # card pulled from the seat pocket and flipped
        tr.mix(at - 0.18, 0.36, lambda x: vol * rng.uniform(-1, 1) * math.sin(math.pi * x / 0.36) ** 2)
        tr.mix(at + 0.16, 0.04, lambda x: vol * 1.4 * rng.uniform(-1, 1) * math.exp(-90 * x))

    def ghost(at, d=1.3):           # a wobbling "oooo" sliding down
        tr.mix(at, d, lambda x: 0.035 * math.sin(2 * math.pi * (620 * x - 120 * x * x + 3 * math.sin(2 * math.pi * 5 * x))) * math.sin(math.pi * x / d))

    def splash(at):
        tr.mix(at, 0.6, lambda x: 0.09 * rng.uniform(-1, 1) * math.exp(-7 * x) * min(1, x * 80))
        for k in range(3):
            tr.mix(at + 0.12 + k * 0.09, 0.08, lambda x, k=k: 0.04 * math.sin(2 * math.pi * (900 + 300 * k) * x * (1 + 3 * x)) * math.exp(-30 * x))

    def sigh(at):                   # cabin lights clunk down
        tr.mix(at, 0.3, lambda x: 0.1 * math.sin(2 * math.pi * (90 * x + 0.6 * (1 - math.exp(-30 * x)))) * math.exp(-14 * x))

    def sweep(at, d=1.4):           # engines spool up smooth
        tr.mix(at, d, lambda x: 0.04 * math.sin(2 * math.pi * (180 * x + 260 * x * x / d)) * math.sin(math.pi * x / d))

    def ping(at):
        for k, hz in enumerate((1568, 2093, 2637)):
            tr.mix(at + k * 0.07, 0.6, lambda x, hz=hz: 0.05 * math.sin(2 * math.pi * hz * x) * math.exp(-6 * x))

    chime(0.0)
    ding(b["card"] + 0.1, 0.045)
    pop(b["match"] + 0.05, 1500, 0.07)
    for i in range(3):
        tick(b["types"] + 0.25 + i * 0.11, 0.05)
    pop(b["hey"] + 0.25, 1300, 0.06)
    for k in ("panel1", "panel2", "sir1"):
        flip(b[k] - 0.15)
    ghost(b["panel1"] + 0.3)
    splash(b["float"] + 0.1)
    chime(b["sir1"] - 0.75, 0.05)
    sigh(b["oneam"])
    tick(b["down"] + 0.1, 0.06)
    tr.mix(b["plane"] + 0.25, 1.0, lambda x: 0.02 * math.sin(2 * math.pi * 4200 * x) * (1 if (x * 7) % 1 < 0.15 else 0))   # a cricket in row 14
    chime(b["goodnews"] - 0.85, 0.07)
    sweep(b["autopilot"] - 0.2)
    ding(b["autopilot"] + 0.5, 0.05)
    flip(b["sub"] - 0.15)
    for i, k in enumerate(("swipes", "chats", "books")):
        pop(b[k], 1200 + 200 * i, 0.06)
    ping(b["maya"] - 0.05)
    flip(b["stowed"] - 0.15)
    ding(b["booked"], 0.05)
    tick(b["endcard"] + 0.4, 0.07)


if __name__ == "__main__":
    configure(sys.argv[1] if len(sys.argv) > 1 else "seat-14b")
    data = timeline()
    b, dur = data["beats"], data["duration"]
    music, sfx, amb = Track(dur), Track(dur), Track(dur)
    score(music, b, dur); cabin(amb, b, dur); foley(sfx, b)
    (PUBLIC / "audio").mkdir(parents=True, exist_ok=True)
    write(PUBLIC / f"audio/{SPEC['id']}-music.wav", music.buf)
    write(PUBLIC / f"audio/{SPEC['id']}-sfx.wav", sfx.buf)
    write(PUBLIC / f"audio/{SPEC['id']}-cabin.wav", amb.buf, 0.5)
