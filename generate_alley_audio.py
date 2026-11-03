"""Sound for "Across the Alley" (story account, season 3), driven by specs/stories/<id>.json.

    python3 generate_alley_audio.py alley-ep1

A silent season: no voices. Three stems, all composed in code:
- rain: steady rain on glass and a gutter drip, a distant roll of thunder when her window goes dark;
- music: a sparse music-box piano in A minor that turns warm in the sign exchange, stops dead when
  her light goes out, and leaves one unresolved chord on the end card;
- sfx: swipe flicks, the phone slip, marker squeaks for every sign, paper lifts, the buzz, the lamp click.
"""

from __future__ import annotations

import json
import math
import random
import sys
from pathlib import Path

from audio_kit import RATE, Track, write

ROOT = Path(__file__).parent
PUBLIC = ROOT / "public"
rng = random.Random(311)
spec_dips: list[float] = []


def midi(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def rain(tr: Track, b: dict, dur: float) -> None:
    lp, lp2 = 0.0, 0.0
    for i in range(tr.n):
        t = i / RATE
        x = rng.uniform(-1, 1)
        lp += 0.25 * (x - lp)
        lp2 += 0.03 * (lp - lp2)
        tr.buf[i] = 0.16 * (lp - lp2) + 0.12 * lp2
    # Drops on the sill: little ticks at random.
    t = 0.0
    while t < dur:
        tr.mix(t, 0.03, lambda x, v=rng.uniform(0.02, 0.06): v * rng.uniform(-1, 1) * math.exp(-160 * x))
        t += rng.uniform(0.05, 0.25)
    # Thunder, far away, as her window goes dark.
    if "dark" in b:
        tr.mix(b["dark"] + 0.4, 3.5, lambda x: 0.25 * rng.uniform(-1, 1) * min(1, x / 0.6) * math.exp(-1.2 * x) * (0.6 + 0.4 * math.sin(2 * math.pi * 3 * x)))


def music(tr: Track, b: dict, signs: list[dict], dur: float) -> None:
    def box(t, m, vol=0.05, d=2.2):   # a music-box note: sine plus a bright partial, quick decay
        f = midi(m)
        tr.mix(t, d, lambda x: vol * (math.sin(2 * math.pi * f * x) + 0.35 * math.sin(2 * math.pi * 3 * f * x) * math.exp(-6 * x)) * math.exp(-2.4 * x) * min(1, x * 400))

    def piano(t, m, vol=0.05, d=2.6):
        f = midi(m)
        tr.mix(t, d, lambda x: vol * (math.sin(2 * math.pi * f * x) + 0.3 * math.sin(4 * math.pi * f * x) * math.exp(-3 * x)) * math.exp(-1.5 * x) * min(1, x * 200))

    beat = 60 / 76
    # Lonely: a slow A-minor figure on the music box, one note per beat, through the swiping.
    figure = [69, 72, 76, 72, 67, 71, 74, 71, 65, 69, 72, 69, 64, 67, 71, 67]
    t, i = b.get("lonelyFrom", 0.3), 0
    while t < b.get("lonelyTo", b.get("drop", 0) - 0.2):
        box(t, figure[i % len(figure)], 0.035)
        t += beat
        i += 1
    # A held note while they look at each other.
    box(b.get("herLook", b.get("herSees")), 81, 0.04, 3.0)
    # The sign exchange: warmer, F–C–Am–G on piano, music box on top, until the name question.
    prog = [[53, 60, 65, 69], [48, 55, 64, 67], [45, 52, 60, 64], [43, 50, 59, 62]]
    t, i = b.get("warmFrom", signs[0]["write"]), 0
    while t < b.get("warmTo", b.get("buzz", 0) - 0.3):
        ch = prog[i % 4]
        piano(t, ch[0] - 12, 0.05)
        for k, m in enumerate(ch[1:]):
            piano(t + beat * (k + 1) * 0.5, m, 0.028)
        box(t + beat * 2, ch[-1] + 12, 0.022)
        t += beat * 4
        i += 1
    for key in ("visitor", "sting"):   # a reveal: a low note under the silence
        if key in b:
            piano(b[key], 40, 0.07, 3.0); piano(b[key] + 0.02, 47, 0.04, 3.0)
    # The buzz cuts the music; her window goes dark in silence. One unresolved chord on the end card.
    # The finale resolves to C major instead.
    for m in ((48, 60, 64, 67, 72) if "resolve" in b else (57, 64, 71, 74)):
        piano(b["endcard"] + 0.3, m, 0.035, 3.5)
    box(b["endcard"] + 1.2, 79 if "resolve" in b else 76, 0.03, 2.5)


def sfx(tr: Track, b: dict, signs: list[dict]) -> None:
    def flick(at, vol=0.025):
        tr.mix(at, 0.08, lambda x: vol * rng.uniform(-1, 1) * math.sin(math.pi * x / 0.08))

    def squeak(at, d):   # marker on paper: short rough strokes
        t = at
        while t < at + d:
            seg = rng.uniform(0.08, 0.18)
            f = rng.uniform(900, 1400)
            tr.mix(t, seg, lambda x, f=f, seg=seg: 0.018 * (math.sin(2 * math.pi * f * x) * 0.4 + rng.uniform(-1, 1)) * math.sin(math.pi * x / seg))
            t += seg + rng.uniform(0.02, 0.07)

    def rustle(at, vol=0.05):
        lp = [0.0]
        def s(x):
            lp[0] = 0.7 * lp[0] + 0.3 * rng.uniform(-1, 1)
            return vol * lp[0] * math.sin(math.pi * x / 0.35)
        tr.mix(at, 0.35, s)

    def thump(at, vol=0.12):
        tr.mix(at, 0.3, lambda x: vol * math.sin(2 * math.pi * (80 + 60 * math.exp(-25 * x)) * x) * math.exp(-12 * x))

    def buzz(at, n=2):
        for k in range(n):
            tr.mix(at + k * 0.5, 0.32, lambda x: 0.09 * math.sin(2 * math.pi * 165 * x) * (0.6 + 0.4 * math.sin(2 * math.pi * 33 * x)) * math.sin(math.pi * x / 0.32))

    def click(at):
        tr.mix(at, 0.05, lambda x: 0.12 * rng.uniform(-1, 1) * math.exp(-90 * x))
        tr.mix(at + 0.02, 0.08, lambda x: 0.06 * math.sin(2 * math.pi * 1900 * x) * math.exp(-60 * x))

    def ping(at):
        for k, hz in enumerate((1318, 1760)):
            tr.mix(at + k * 0.09, 0.5, lambda x, hz=hz: 0.04 * math.sin(2 * math.pi * hz * x) * math.exp(-8 * x))

    # Swipes: his and hers, offset, until they hide their phones.
    t = 0.0
    while t < b.get("hide", 0):
        flick(t + 0.75)
        if t > 3.5:
            flick(t + 0.75 - 0.4 + 1.15, 0.02)
        t += 1.15
    # The slip: a whoosh up, a fumble, a catch.
    if "drop" in b:
        tr.mix(b["drop"], 0.4, lambda x: 0.05 * rng.uniform(-1, 1) * math.sin(math.pi * x / 0.4))
        thump(b["drop"] + 0.68, 0.08)
        rustle(b["hide"], 0.06)
    if "faceDown" in b:   # phone turned face down on the sill
        thump(b["faceDown"], 0.09)
    if "tape" in b:       # tape torn and pressed to the glass
        for k in range(2):
            tr.mix(b["tape"] + k * 0.3, 0.18, lambda x: 0.05 * rng.uniform(-1, 1) * (1 - x / 0.18))
    if "herOn" in b:
        click(b["herOn"])
    if "tug" in b:        # the bulb string tugged: a little rattle and chime
        for k in range(5):
            tr.mix(b["tug"] + k * 0.06, 0.25, lambda x, k=k: 0.02 * math.sin(2 * math.pi * (2200 + 180 * k) * x) * math.exp(-12 * x))
    if "open" in b:       # her curtains drawn open
        rustle(b["open"], 0.08); rustle(b["open"] + 0.25, 0.06)
    if "snatch" in b:     # Mira snatching Jo's sign
        tr.mix(b["snatch"], 0.25, lambda x: 0.06 * rng.uniform(-1, 1) * math.sin(math.pi * x / 0.25))
    for d in spec_dips:   # a soft whoosh between nights
        tr.mix(d - 0.3, 0.6, lambda x: 0.03 * rng.uniform(-1, 1) * math.sin(math.pi * x / 0.6))
    if "door" in b:       # her door opening: a short creak
        tr.mix(b["door"], 0.6, lambda x: 0.04 * math.sin(2 * math.pi * (300 + 140 * x) * x) * (0.5 + 0.5 * math.sin(2 * math.pi * 23 * x)) * math.sin(math.pi * x / 0.6))
    if "swipeFrom" in b:  # her thumb flicking through cards until she sees his sign
        t = b["swipeFrom"]
        while t < b["herSees"]:
            flick(t + 0.5, 0.02)
            t += 0.9
    for s in signs:
        if s["write"] < 0:   # a recap sign already held up
            continue
        end = s.get("stop", s["up"] - 0.4)
        squeak(s["write"] + 0.05, max(0.3, end - s["write"] - 0.1))
        if s["up"] < 60:
            rustle(s["up"] - 0.35)
    for k in b:           # every phone buzz (buzz, buzz2, ...)
        if k.startswith("buzz"):
            buzz(b[k])
    if "shut" in b:   # her curtains sliding shut
        rustle(b["shut"], 0.08); rustle(b["shut"] + 0.25, 0.06)
    if "drop" in b:
        ping(b["buzz"] + 0.15)
    if "dark" in b:
        click(b["dark"])


if __name__ == "__main__":
    ep = sys.argv[1] if len(sys.argv) > 1 else "alley-ep1"
    spec = json.loads((ROOT / "specs" / "stories" / f"{ep}.json").read_text())
    b, dur, signs = spec["beats"], spec["duration"], spec["signs"]
    spec_dips[:] = spec.get("dips", [])
    r, m, s = Track(dur), Track(dur), Track(dur)
    rain(r, b, dur); music(m, b, signs, dur); sfx(s, b, signs)
    (PUBLIC / "audio").mkdir(parents=True, exist_ok=True)
    write(PUBLIC / f"audio/{ep}-rain.wav", r.buf, 0.5)
    write(PUBLIC / f"audio/{ep}-music.wav", m.buf)
    write(PUBLIC / f"audio/{ep}-sfx.wav", s.buf)
