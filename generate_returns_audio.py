"""Sound for "Reason for Return" (season 13), driven by the "audio" block of specs/stories/<id>.json.

    python3 generate_returns_audio.py returns-ep1

Silent story, no voices, numpy only. Store-muzak at 92 bpm (4/4): Rhodes chords, fretless bass, brushed shaker, soft vibes; ducks to
room tone plus one vibes note for the shared moment. Foley: store hum, swipe ticks, pen-chain rattle, pen scrawl, paper slides, pen
tap, laugh sting, phone drops, line shuffles, PA ding-dong, receipt printer, gulp, scanner beeps + beam whoosh, card pops, stamps, end chime.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

import generate_bag_audio as g
from generate_bag_audio import RATE, Stem, bell, env, fft_bp, fft_lp, gulp, laugh_sting, midi, noise, pop, scrawl, slide, stamp, tick, tt, write

ROOT = Path(__file__).parent
g.rng = np.random.default_rng(1328)
rng = g.rng


def rhodes(m, d=0.9):
    t, f = tt(d), midi(m)
    bark = np.sin(2 * np.pi * 7 * f * t) * np.exp(-t / 0.03) * 0.15
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.4) + bark) * env(t, 0.004, 0.55) * (0.85 + 0.15 * np.sin(2 * np.pi * 4.5 * t))


def fretless(m, d=0.5):
    t, f = tt(d), midi(m)
    slidef = f * (1 + 0.02 * np.exp(-t / 0.04))
    ph = np.cumsum(slidef) / RATE
    return (np.sin(2 * np.pi * ph) + 0.3 * np.sin(4 * np.pi * ph)) * env(t, 0.01, 0.3)


def brush(d=0.12):
    t = tt(d)
    return fft_bp(noise(d), 4000, 10000) * np.minimum(1, t / 0.02) * np.exp(-t / 0.05) * 0.7


def vibes(m, d=1.8):
    t, f = tt(d), midi(m)
    trem = 0.8 + 0.2 * np.sin(2 * np.pi * 4 * t)
    return (np.sin(2 * np.pi * f * t) * env(t, 0.002, 0.9) + 0.3 * np.sin(2 * np.pi * 4 * f * t) * env(t, 0.001, 0.15)) * trem


def chain_rattle(d=0.5):
    t = tt(d)
    ticks = np.abs(np.sin(2 * np.pi * 19 * t)) ** 14
    return (fft_bp(noise(d), 2500, 8000) * ticks + np.sin(2 * np.pi * 3100 * t) * ticks * 0.1) * np.exp(-t / 0.25) * 0.9


def pen_tap():
    t = tt(0.2)
    return fft_bp(noise(0.2), 600, 4000) * env(t, 0.0008, 0.025) * 0.8 + np.sin(2 * np.pi * 420 * t) * env(t, 0.001, 0.05) * 0.4


def phone_drop():
    t = tt(0.3)
    return fft_bp(noise(0.3), 150, 2000) * env(t, 0.001, 0.04) * 0.8 + np.sin(2 * np.pi * 150 * t) * env(t, 0.001, 0.07) * 0.5


def shuffle(d=0.4):
    t = tt(d)
    return fft_bp(noise(d), 200, 2200) * (np.abs(np.sin(2 * np.pi * 7 * t)) ** 1.5) * np.sin(np.pi * np.clip(t / d, 0, 1)) * 0.8


def pa_ding():
    t = tt(1.4)
    a = np.sin(2 * np.pi * 988 * t) * env(t, 0.003, 0.5) + 0.3 * np.sin(2 * np.pi * 1976 * t) * env(t, 0.002, 0.2)
    u = np.maximum(t - 0.38, 0)
    b = (np.sin(2 * np.pi * 784 * u) * env(u, 0.003, 0.6) + 0.3 * np.sin(2 * np.pi * 1568 * u) * env(u, 0.002, 0.2)) * (t > 0.38)
    return (a + b) * 0.5


def printer(d=1.0):
    t = tt(d)
    zz = (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 34 * t)))
    return fft_bp(noise(d), 1500, 6000) * zz * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.1) * 0.7


def beep(f=1800, d=0.09):
    t = tt(d)
    return np.sign(np.sin(2 * np.pi * f * t)) * 0.3 * np.minimum(1, t / 0.003) * np.minimum(1, (d - t) / 0.01) + np.sin(2 * np.pi * f * t) * 0.2 * np.minimum(1, (d - t) / 0.01)


def beam_whoosh():
    t = tt(0.5)
    k = np.clip(t / 0.5, 0, 1)
    return np.sin(2 * np.pi * np.cumsum(500 + 2600 * k) / RATE) * 0.14 * np.sin(np.pi * k) + fft_bp(noise(0.5), 1200, 7000) * np.sin(np.pi * k) * 0.7


def room(st: Stem, a):
    n = len(st.buf); tm = np.arange(n) / RATE
    hum = (np.sin(2 * np.pi * 60 * tm) * 0.5 + np.sin(2 * np.pi * 120 * tm) * 0.3 + np.sin(2 * np.pi * 240 * tm) * 0.05) * 0.012
    air = fft_bp(rng.uniform(-1, 1, n), 200, 1800) * 0.022 * (0.7 + 0.3 * np.sin(2 * np.pi * 0.19 * tm))
    st.buf += hum + air


def music(st: Stem, a):
    beat = 60.0 / a["bpm"]
    bar = beat * 4
    prog = [(36, [60, 64, 67, 71]), (33, [57, 60, 64, 67]), (38, [62, 65, 69, 72]), (43, [59, 62, 65, 67])]  # Cmaj7 Am7 Dm7 G7
    for lo, hi in a["groove"]:
        k = int(np.ceil(lo / bar))
        while k * bar < hi - 0.01:
            t0 = k * bar
            root, chord = prog[k % 4]
            for off, m in ((0, root + 12), (1.5, root + 12), (2.5, root + 19 if k % 2 else root + 12)):
                st.add(t0 + off * beat, fretless(m, beat * 0.9), 0.5)
            for off in (0, 1.5):
                for m in chord:
                    st.add(t0 + off * beat + rng.uniform(0, 0.012), rhodes(m + 12, beat * 1.6), 0.07)
            for j in range(8):
                st.add(t0 + j * beat / 2, brush(0.1 if j % 2 else 0.14), 0.16 if j % 2 else 0.22)
            if k % 2 == 1:
                for j, m in enumerate((chord[3] + 24, chord[2] + 24)):
                    st.add(t0 + (2 + j) * beat, vibes(m, 1.2), 0.05)
            k += 1
    for lo, hi in a["musicDuck"]:
        i0, i1 = int(lo * RATE), int(hi * RATE)
        fade = int(0.2 * RATE)
        gain = np.ones(len(st.buf)); gain[i0:i1] = 0.0
        gain[i0 - fade:i0] = np.linspace(1, 0, fade); gain[i1:i1 + fade] = np.linspace(0, 1, fade)
        st.buf *= gain
    for lo, hi in a["musicDuck"]:
        st.add(lo + 0.5, vibes(84, 2.4), 0.22)


def sfx(st: Stem, a):
    for t in a["swipeTicks"]: st.add(t, tick(), 0.6)
    for t in a["chainRattle"]: st.add(t, chain_rattle(), 0.6)
    for lo, hi in a["scrawl"]: st.add(lo, scrawl(hi - lo), 0.55)
    for t in a["paperSlides"]: st.add(t, slide(0.5), 0.55)
    for t in a["penTap"]: st.add(t, pen_tap(), 0.8)
    for t in a["laughSting"]: st.add(t, laugh_sting(), 0.45)
    for t in a["phoneDrops"]: st.add(t, phone_drop(), 0.8)
    for t in a["shuffles"]: st.add(t, shuffle(), 0.6)
    for t in a["paDing"]: st.add(t, pa_ding(), 0.7)
    for t in a["printer"]: st.add(t, printer(0.9), 0.6)
    for t in a["gulp"]: st.add(t, gulp(), 0.8)
    for t in a["beamWhoosh"]: st.add(t - 0.05, beam_whoosh(), 0.8)
    for i, t in enumerate(a["scannerBeeps"]): st.add(t, beep(1700 + 300 * i), 0.7)
    for i, t in enumerate(a["cardPops"]): st.add(t, pop(600 + 200 * i), 0.8)
    for t in a["stamps"]: st.add(t, stamp(), 0.45)
    for t in a["endChime"]:
        for k, m in enumerate([72, 76, 79, 84]): st.add(t + k * 0.1, bell(m), 0.3)


if __name__ == "__main__":
    ep = sys.argv[1] if len(sys.argv) > 1 else "returns-ep1"
    spec = json.loads((ROOT / "specs" / "stories" / f"{ep}.json").read_text())
    a, dur = spec["audio"], spec["duration"]
    r, m, s = Stem(dur), Stem(dur), Stem(dur)
    room(r, a); music(m, a); sfx(s, a)
    mix = r.buf * 1.0 + m.buf * 0.9 + s.buf * 1.0
    (ROOT / "public" / "audio").mkdir(parents=True, exist_ok=True)
    write(ROOT / f"public/audio/{ep}.wav", mix)
