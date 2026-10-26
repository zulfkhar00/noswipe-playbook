"""Audio for "Overtime", the first scene-led receipt episode (specs/overtime.json).

    python3 generate_elevenlabs_voice.py --project receipt --episode overtime
    python3 generate_overtime_audio.py

The voice timeline is built exactly like the list-style receipts (generate_receipt_audio.timeline);
only the score and Foley differ, because the story is told by the gym: a groove while he lifts, a
thin drone once the rest timer runs out, near silence for the receipt, warmth for the turn.
"""

from __future__ import annotations

import math
import random

import generate_receipt_audio as R
from audio_kit import Track, write

rng = random.Random(90)


def score(tr: Track, b: dict, dur: float) -> None:
    def midi(m):
        return 440.0 * 2 ** ((m - 69) / 12)

    def kick(t, vol=0.13):
        tr.mix(t, 0.25, lambda x: vol * math.sin(2 * math.pi * (48 * x + 1.3 * (1 - math.exp(-35 * x)))) * math.exp(-12 * x))

    def hat(t, vol=0.02):
        tr.mix(t, 0.06, lambda x: vol * rng.uniform(-1, 1) * math.exp(-70 * x))

    def clap(t, vol=0.05):
        tr.mix(t, 0.12, lambda x: vol * rng.uniform(-1, 1) * math.exp(-30 * x))

    def bass(t, m, vol=0.11, d=0.28):
        f = midi(m)
        tr.mix(t, d, lambda x: vol * math.sin(2 * math.pi * f * x) * min(1, x * 120) * math.exp(-5 * x))

    def pad(t, ms, d, vol):
        fs = [midi(m) for m in ms]
        tr.mix(t, d, lambda x: vol * sum(math.sin(2 * math.pi * f * x) for f in fs) * min(1, x * 3, (d - x) * 3))

    def pluck(t, m, vol=0.026):
        f = midi(m)
        tr.mix(t, 0.4, lambda x: vol * math.sin(2 * math.pi * f * x) * math.exp(-7 * x))

    beat = 60 / 100
    groove = [(0.0, b["timerout"] - 0.1), (b["or"] + 0.2, b["endcard"] + 0.1)]
    roots = [45, 41, 48, 43]
    bright = [([60, 64, 67], 48), ([55, 59, 62], 43), ([57, 60, 64], 45), ([53, 57, 60], 41)]
    for a, z in groove:
        warm = a > 0
        t, step = a, 0
        while t < z:
            k = step % 4
            kick(t)
            hat(t + beat / 2)
            if k in (1, 3):
                clap(t)
            chord, root = bright[(step // 4) % 4] if warm else ([0], roots[(step // 4) % 4])
            bass(t + beat / 2, root)
            if warm and k == 0:
                pad(t, chord, beat * 4, 0.012)
            if warm and step % 2 == 0:
                pluck(t + beat / 2, chord[(step // 2) % 3] + 12)
            t += beat
            step += 1
    # A thin, slightly sour drone while the gym empties; it thins out further for the receipt.
    a, z = b["timerout"], b["or"]
    pad(a, [45, 52], b["receipt"] - a, 0.014)
    pad(b["receipt"], [45], z - b["receipt"], 0.008)


def foley(tr: Track, b: dict) -> None:
    def clank(at, vol=0.12):
        for hz in (180, 410, 760):
            tr.mix(at, 0.5, lambda x, hz=hz: vol / 3 * math.sin(2 * math.pi * hz * x) * math.exp(-9 * x))
        tr.mix(at, 0.05, lambda x: vol * rng.uniform(-1, 1) * math.exp(-60 * x))

    def flick(at, vol=0.03):
        tr.mix(at, 0.08, lambda x: vol * rng.uniform(-1, 1) * math.sin(math.pi * x / 0.08))

    def buzzer(at, d=0.7):
        tr.mix(at, d, lambda x: 0.06 * (1 if math.sin(2 * math.pi * 220 * x) > 0 else -1) * min(1, x * 50, (d - x) * 30))

    def whoosh(at, d=0.4, vol=0.05):
        tr.mix(at, d, lambda x: vol * rng.uniform(-1, 1) * math.sin(math.pi * x / d) ** 2)

    def click(at):
        tr.mix(at, 0.04, lambda x: 0.09 * rng.uniform(-1, 1) * math.exp(-120 * x))
        tr.mix(at, 0.15, lambda x: 0.05 * math.sin(2 * math.pi * 90 * x) * math.exp(-30 * x))

    def swish(at, d=0.5):
        tr.mix(at, d, lambda x: 0.04 * rng.uniform(-1, 1) * math.sin(math.pi * x / d) * (0.6 + 0.4 * math.sin(2 * math.pi * 6 * x)))

    def printer(at, d, vol=0.05):
        tr.mix(at, d, lambda x: vol * rng.uniform(-1, 1) * (0.55 + 0.45 * math.sin(2 * math.pi * 55 * x)) * min(1, x * 40, (d - x) * 30))

    def kaching(at):
        for i, hz in enumerate((2093.0, 2637.0, 3136.0)):
            tr.mix(at + i * 0.04, 0.9, lambda x, hz=hz: 0.07 * math.sin(2 * math.pi * hz * x) * math.exp(-4 * x))

    def tear(at, d=0.35):
        tr.mix(at, d, lambda x: 0.09 * rng.uniform(-1, 1) * (0.4 + 0.6 * abs(math.sin(2 * math.pi * 30 * x))) * math.sin(math.pi * x / d))

    def ping(at):
        for i, hz in enumerate((1318.5, 1760.0)):
            tr.mix(at + i * 0.09, 0.5, lambda x, hz=hz: 0.07 * math.sin(2 * math.pi * hz * x) * math.exp(-6 * x))

    clank(0.35)                                   # dumbbell set down on frame 1
    t = b["swiping"]
    while t < b["timerout"] - 0.2:                # his thumb, flick after flick
        flick(t); t += 0.5
    buzzer(b["timerout"] - 0.15)
    whoosh(b["patiently"] + 0.6, 0.5, 0.04)      # buddy walks off
    clank(b["settwo"] + 0.25, 0.06)               # the half rep
    for i in range(3):
        click(b["home"] + 0.5 + i * 0.35)         # ceiling lights go off
    for i in range(3):
        swish(b["mop"] + i * 0.55)
    printer(b["receipt"] + 0.05, 0.9)
    kaching(b["total"])
    tear(b["or"])
    for i in range(5):
        flick(b["swipesself"] + i * 0.18, 0.025)
    ping(b["booked"] + 0.1)
    clank(b["payoff"] + 0.2, 0.08)
    ping(b["payoff"] + 0.9)
    whoosh(b["endcard"] - 0.2, 0.3, 0.04)


if __name__ == "__main__":
    R.configure("overtime")
    data = R.timeline()
    b, dur = data["beats"], data["duration"]
    music, sfx = Track(dur), Track(dur)
    score(music, b, dur)
    foley(sfx, b)
    write(R.PUBLIC / "audio/overtime-music.wav", music.buf)
    write(R.PUBLIC / "audio/overtime-sfx.wav", sfx.buf)
