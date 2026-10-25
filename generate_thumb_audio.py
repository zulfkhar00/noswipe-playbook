"""Audio for the NoSwipe demand-test ad "I'm his thumb": timeline from the takes, a warm indie-pop
bed and Foley. The narrator is his thumb (a comedy character, not a customer testimonial).

    python3 generate_elevenlabs_voice.py --project thumb
    python3 generate_thumb_audio.py
"""

from __future__ import annotations

import json
import math
import random
from pathlib import Path

from audio_kit import RATE, Track, probe, speech_data, trim, words, write

ROOT = Path(__file__).parent
PUBLIC = ROOT / "public"
RECORDED = PUBLIC / "voice-thumb"
TRIMMED = PUBLIC / "voice-thumb-trimmed"
VOICE_ID = "R9RZPy40Zzy1wNxrgQpj"  # "Witty McGee": snarky, warm. Chosen for the NoSwipe brand.

SCRIPT = [
    (0.25, "I'm his thumb. Eleven thousand swipes this year."),
    (0.35, "I quit."),
    (0.55, "Matches that go nowhere. \"Hey.\" Nothing."),
    (0.35, "One AM. Again."),
    (0.6, "So he stopped swiping. Now NoSwipe does it."),
    (0.5, "He spent two minutes telling them his type."),
    (0.4, "They built his profiles. Swiped. Chatted. And booked it."),
    (0.9, "Saturday, eleven. Coffee with Maya."),
    (0.3, "He just shows up."),
    (0.8, "Me? I'm retired."),
]
TAIL = 2.0
LINES = [(0.0, text) for _, text in SCRIPT]

VOICE_OVERRIDES = {
    1: {"stability": 0.4, "style": 0.45, "speed": 1.0},
    2: {"stability": 0.5, "style": 0.4, "speed": 0.9},
    4: {"stability": 0.45, "style": 0.35, "speed": 0.95},
    9: {"stability": 0.45, "style": 0.35, "speed": 0.98},
    10: {"stability": 0.4, "style": 0.5, "speed": 0.95},
}


def timeline() -> dict:
    TRIMMED.mkdir(parents=True, exist_ok=True)
    lines, t = [], 0.0
    for i, (gap, text) in enumerate(SCRIPT, 1):
        name = f"line-{i:02d}"
        src = next((RECORDED / f"{name}{ext}" for ext in (".wav", ".m4a", ".mp3") if (RECORDED / f"{name}{ext}").exists()), None)
        if not src:
            raise SystemExit(f"missing {name}: run generate_elevenlabs_voice.py --project thumb")
        path = TRIMMED / f"{name}.wav"
        cut = trim(src, path)
        dur = probe(path)
        start = t + gap
        t = start + dur
        line = {"file": str(path.relative_to(PUBLIC)), "start": round(start, 3), "duration": round(dur, 3), "text": text}
        align = src.with_suffix(".align.json")
        if align.exists():  # exact word timing + lip-sync keyframes from ElevenLabs
            line["words"], line["mouth"] = speech_data(align, cut, start)
        lines.append(line)
        print(f"{name} {dur:5.2f}s  @{start:5.2f}  {text}")
    L = lambda n: lines[n - 1]["start"]
    E = lambda n: lines[n - 1]["start"] + lines[n - 1]["duration"]
    def w(n, needle):
        ln = lines[n - 1]
        if "words" in ln:
            return next(x["start"] for x in ln["words"] if x["text"].lower().strip('.,?!"\u201c\u201d').startswith(needle))
        return next(s for x, s in words(L(n), ln["duration"], ln["text"]) if x.startswith(needle))
    beats = {
        "eleven": w(1, "eleven"), "quit": L(2),
        "burnout": L(3) - 0.2, "match": w(3, "matches"), "hey": w(3, "hey"), "nothing": w(3, "nothing"),
        "oneam": L(4), "again": w(4, "again"),
        "stop": L(5) - 0.2, "down": w(5, "stopped"), "logo": w(5, "noswipe"),
        "form": L(6) - 0.2, "minutes": w(6, "two"), "type": w(6, "type"),
        "steps": L(7) - 0.15, "built": w(7, "built"), "swiped": w(7, "swiped"), "chatted": w(7, "chatted"), "booked": w(7, "booked"),
        "card": L(8) - 0.45, "confirmed": L(8) - 0.25, "maya": w(8, "coffee"), "shows": L(9),
        "retired": L(10) - 0.35, "endcard": E(10) + 0.25, "end": E(10) + TAIL,
    }
    data = {"lines": lines, "beats": {k: round(v, 3) for k, v in beats.items()}, "duration": round(beats["end"], 3)}
    out = ROOT / "src/thumb/timeline.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
    print(f"total {data['duration']:.2f}s")
    return data


rng = random.Random(2026)


def midi(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


# C major, I–V–vi–IV, 112 BPM: warm and upbeat, not frantic.
PROG = [([60, 64, 67, 71], 36), ([59, 62, 67, 74], 43), ([57, 60, 64, 69], 45), ([57, 60, 65, 69], 41)]
HOOK = [76, 74, 72, 74, 76, 79, 76, 74]


def score(tr: Track, b: dict, dur: float) -> None:
    def pluck(t, m, vol=0.05, decay=7.0):
        f = midi(m)
        tr.mix(t, 0.5, lambda x: vol * (math.sin(2 * math.pi * f * x) + 0.5 * math.sin(4 * math.pi * f * x) * math.exp(-12 * x)) * min(1, x * 200) * math.exp(-decay * x))

    def pad(t, ms, d, vol=0.018):
        fs = [midi(m) for m in ms]
        tr.mix(t, d, lambda x: vol * sum(math.sin(2 * math.pi * f * x) + 0.3 * math.sin(2 * math.pi * f * 1.003 * x) for f in fs) * min(1, x * 3) * min(1, (d - x) * 3))

    def bass(t, m, vol=0.15):
        f = midi(m)
        tr.mix(t, 0.4, lambda x: vol * math.sin(2 * math.pi * f * x) * min(1, x * 120) * math.exp(-5 * x))

    def kick(t, vol=0.15):
        tr.mix(t, 0.25, lambda x: vol * math.sin(2 * math.pi * (48 * x + 1.4 * (1 - math.exp(-35 * x)))) * math.exp(-12 * x))

    def clap(t, vol=0.05):
        tr.mix(t, 0.15, lambda x: vol * rng.uniform(-1, 1) * (math.exp(-40 * x) + 0.5 * math.exp(-40 * max(0, x - 0.012))))

    def shaker(t, vol=0.012):
        tr.mix(t, 0.06, lambda x: vol * rng.uniform(-1, 1) * math.exp(-60 * x))

    beat = 60 / 112
    t, step = 0.0, 0
    while t < dur:
        chord, root = PROG[(step // 4) % 4]
        k = step % 4
        tired = b["burnout"] <= t < b["stop"]           # the burnout montage: half-time, thinner
        drop = b["confirmed"] - 0.05 <= t < b["confirmed"] + 0.4
        if not drop:
            if k == 0:
                pad(t, chord, beat * 4)
                kick(t)
            if k == 2 and not tired:
                kick(t, 0.11)
            if k in (1, 3) and not tired:
                clap(t)
            bass(t, root + (12 if k == 2 else 0), 0.13 if tired else 0.15)
            shaker(t + beat / 2)
            if not tired and step >= 8:
                pluck(t, HOOK[step % 8], 0.04)
                pluck(t + beat / 2, chord[(step + 1) % 4] + 12, 0.022)
        t += beat
        step += 1
    for i, m in enumerate([72, 76, 79, 84]):
        pluck(b["confirmed"] + i * 0.07, m, 0.07, 4)   # the confirmation sparkle
    # Light 16th-note arpeggio once the product appears, so the second half lifts.
    t, step = b["form"], 0
    while t < b["endcard"]:
        chord, _ = PROG[int(t / beat / 4) % 4]
        pluck(t, chord[step % 4] + 24, 0.012, 14)
        t += beat / 4
        step += 1
    # A filtered-noise riser into "date confirmed".
    rise = 1.4
    tr.mix(b["confirmed"] - rise, rise, lambda x: 0.05 * (x / rise) ** 2 * rng.uniform(-1, 1) * (0.5 + 0.5 * math.sin(2 * math.pi * (200 + 1800 * x / rise) * x)))
    # Sidechain-style pump: duck the whole bed after every kick so it breathes with the beat.
    for i in range(tr.n):
        ph = ((i / RATE) % beat) / beat
        tr.buf[i] *= 0.72 + 0.28 * min(1.0, ph * 4)


def foley(tr: Track, b: dict) -> None:
    def thunk(at, vol=0.25, f=90):
        tr.mix(at, 0.25, lambda x: vol * math.sin(2 * math.pi * (f * x + 0.6 * (1 - math.exp(-30 * x)))) * math.exp(-14 * x))

    def swipe(at, vol=0.05, d=0.22):
        tr.mix(at, d, lambda x: vol * rng.uniform(-1, 1) * math.sin(math.pi * x / d) ** 2 * (0.5 + x / d))

    def pop(at, hz=1200, vol=0.07):
        tr.mix(at, 0.12, lambda x: vol * math.sin(2 * math.pi * hz * (1 + 0.6 * math.exp(-40 * x)) * x) * math.exp(-28 * x))

    def tick(at, vol=0.05):
        tr.mix(at, 0.03, lambda x: vol * rng.uniform(-1, 1) * math.exp(-120 * x))

    def ping(at, vol=0.08):
        for i, hz in enumerate((1318.5, 1760.0)):
            tr.mix(at + i * 0.09, 0.5, lambda x, hz=hz: vol * math.sin(2 * math.pi * hz * x) * math.exp(-6 * x))

    thunk(0.05, 0.32, 70)                                # the letter slaps down
    pop(b["quit"] + 0.05, 700, 0.06)
    for i in range(6):
        swipe(b["burnout"] + 0.15 + i * 0.32, 0.05)      # cards flying
    pop(b["match"] + 0.3, 1500, 0.06); pop(b["hey"], 1000, 0.05)
    tick(b["oneam"], 0.07)
    thunk(b["down"], 0.22, 110)                          # phone face-down
    pop(b["logo"], 1600, 0.07)
    for i in range(4):
        tick(b["minutes"] + 0.1 + i * 0.18, 0.06)        # form fields ticking
    for k in ("built", "swiped", "chatted", "booked"):
        pop(b[k] + 0.05, 1700, 0.06)
    ping(b["confirmed"])
    swipe(b["card"] + 0.4, 0.05, 0.3); thunk(b["card"] + 0.6, 0.15, 140)
    swipe(b["retired"], 0.04, 0.4)
    thunk(b["endcard"], 0.18, 120)


if __name__ == "__main__":
    data = timeline()
    b, dur = data["beats"], data["duration"]
    music, sfx = Track(dur), Track(dur)
    score(music, b, dur); foley(sfx, b)
    (PUBLIC / "audio").mkdir(parents=True, exist_ok=True)
    write(PUBLIC / "audio/thumb-music.wav", music.buf)
    write(PUBLIC / "audio/thumb-sfx.wav", sfx.buf)
