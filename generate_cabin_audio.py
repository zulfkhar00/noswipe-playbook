"""Sound for "Cabin Six" (season 12), driven by the "audio" block of specs/stories/<id>.json.

    python3 generate_cabin_audio.py cabin-ep1

Silent story, numpy only, no samples. One mixed file public/audio/<id>.wav: ski-gondola room (cable whirr, wind), an acoustic 6/8 waltz
at 84 bpm (plucked guitar arpeggios, glockenspiel tune, soft bass) that drops to wind plus ONE glock note for the sunrise hold,
foley: swipe ticks, no-signal beeps, ka-chunk at every pylon, finger squeaks on glass, breath puffs, sleeve-wipe swishes, porthole
rubs, laugh sting, strike swoosh, card pops, end chime.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

import generate_bag_audio as g
from generate_bag_audio import RATE, Stem, bell, env, fft_bp, fft_lp, laugh_sting, midi, noise, pop, tick, tt, write

ROOT = Path(__file__).parent
g.rng = np.random.default_rng(1212)
rng = g.rng


def pluck(m, d=0.9):
    """Karplus-Strong plucked string (acoustic guitar-ish)."""
    f = midi(m)
    n = int(d * RATE)
    p = int(RATE / f)
    buf = rng.uniform(-1, 1, p)
    out = np.zeros(n)
    for i in range(n):
        j = i % p
        out[i] = buf[j]
        buf[j] = 0.4985 * (buf[j] + buf[(j + 1) % p])
    return out * np.minimum(1, np.arange(n) / 60) * np.exp(-np.arange(n) / RATE / (d * 0.9))


def glock(m, d=1.2):
    t, f = tt(d), midi(m)
    return (np.sin(2 * np.pi * f * t) * env(t, 0.001, 0.5) + 0.45 * np.sin(2 * np.pi * f * 2.76 * t) * env(t, 0.001, 0.18)
            + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * env(t, 0.001, 0.07))


def softbass(m, d=0.7):
    t, f = tt(d), midi(m)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * env(t, 0.01, 0.35)


def pad(m, d):
    t, f = tt(d), midi(m)
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)) * np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.6) * 0.5


def kachunk():
    t = tt(0.5)
    ka = fft_bp(noise(0.5), 600, 3500) * env(t, 0.0008, 0.03) * 0.9 + np.sin(2 * np.pi * 150 * t) * env(t, 0.001, 0.05) * 0.6
    t2 = t - 0.13
    chunk = np.where(t2 > 0, np.sin(2 * np.pi * (78 - 20 * np.clip(t2 / 0.15, 0, 1)) * np.maximum(t2, 0)) * np.exp(-np.maximum(t2, 0) / 0.12) * 1.2
                     + fft_lp(noise(0.5), 400) * np.exp(-np.maximum(t2, 0) / 0.05) * 0.8, 0)
    return ka + chunk


def squeak(d):
    t = tt(d)
    f = 1900 + 500 * np.sin(2 * np.pi * 7 * t) + 400 * t / d
    stick = (np.abs(np.sin(2 * np.pi * 23 * t)) ** 0.4)
    return (np.sin(2 * np.pi * np.cumsum(f) / RATE) * 0.5 + fft_bp(noise(d), 1500, 4500) * 0.35) * stick * np.minimum(1, t / 0.03) * np.minimum(1, (d - t) / 0.05) * 0.6


def creak(d=0.9):
    t = tt(d)
    f = 95 + 25 * np.sin(2 * np.pi * 3.3 * t)
    return (np.sin(2 * np.pi * np.cumsum(f) / RATE) * 0.5 + fft_bp(noise(d), 150, 700) * 0.5) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5 * 0.6


def breath(d=0.7):
    t = tt(d)
    k = np.clip(t / d, 0, 1)
    return fft_bp(noise(d), 600, 2800) * np.sin(np.pi * k) ** 1.5 * 0.9


def swish(d=0.45):
    t = tt(d)
    k = np.clip(t / d, 0, 1)
    return fft_bp(noise(d), 400, 4000) * np.sin(np.pi * k) ** 1.1 * 1.1 + np.sin(2 * np.pi * np.cumsum(300 + 700 * k) / RATE) * 0.05 * np.sin(np.pi * k)


def rub(d):
    t = tt(d)
    return fft_bp(noise(d), 900, 3500) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t)) * np.minimum(1, t / 0.04) * np.minimum(1, (d - t) / 0.08) * 0.8


def beep(f0, f1, d=0.16):
    t = tt(d)
    return np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f1, len(t))) / RATE) * np.minimum(1, t / 0.005) * np.minimum(1, (d - t) / 0.02) * 0.5


def room(st: Stem, a):
    n = len(st.buf); tm = np.arange(n) / RATE
    cable = (np.sin(2 * np.pi * 71 * tm) * 0.5 + np.sin(2 * np.pi * 142 * tm * (1 + 0.002 * np.sin(2 * np.pi * 0.4 * tm))) * 0.25) * 0.02 * (0.75 + 0.25 * np.sin(2 * np.pi * 3.1 * tm))
    whirr = fft_bp(rng.uniform(-1, 1, n), 500, 1400) * 0.012 * (0.7 + 0.3 * np.sin(2 * np.pi * 7.3 * tm))
    wind = fft_bp(rng.uniform(-1, 1, n), 150, 1100) * (0.03 + 0.012 * np.sin(2 * np.pi * 0.23 * tm + 1))
    only = np.zeros(n)
    for lo, hi in a.get("windOnly", []):
        i0, i1 = int(lo * RATE), int(hi * RATE); fade = int(0.35 * RATE)
        only[i0:i1] = 1
        only[i0 - fade:i0] = np.linspace(0, 1, fade); m = len(only[i1:i1 + fade]); only[i1:i1 + fade] = np.linspace(1, 0, fade)[:m]
    cs = a.get("cableStop")
    if cs:   # the whirr cuts out dead at the jolt
        g = np.ones(n); i0 = int(cs * RATE); g[i0:] = 0; g[i0 - 400:i0] = np.linspace(1, 0, 400)
        cable, whirr = cable * g, whirr * g
    st.buf += cable * (1 - 0.6 * only) + whirr * (1 - 0.7 * only) + wind * (1 + 1.6 * only)


CH = [(50, [62, 66, 69]), (47, [59, 62, 66]), (43, [59, 62, 67]), (45, [61, 64, 69])]   # D  Bm  G  A
TUNE = [[74, 0, 78, 0, 76, 74], [74, 0, 71, 0, 69, 71], [74, 0, 71, 0, 67, 71], [73, 0, 76, 0, 73, 69]]


def music(st: Stem, a):
    beat = 60.0 / a["bpm"]       # dotted quarter in 6/8
    e8 = beat / 3
    bar = beat * 2
    for lo, hi in a["groove"]:
        k = int(np.ceil(lo / bar))
        while k * bar < hi - 0.01:
            t0 = k * bar
            root, ch = CH[k % 4]
            st.add(t0, softbass(root), 0.5)
            st.add(t0 + 3 * e8, softbass(root + (7 if k % 2 else 12)), 0.3)
            for j, m in enumerate([ch[0], ch[1], ch[2], ch[1], ch[2], ch[1]]):
                st.add(t0 + j * e8 + rng.uniform(0, 0.005), pluck(m, 0.8), 0.16)
            if lo < 11 or k % 2 == 0 or t0 > 24:
                for j, m in enumerate(TUNE[k % 4]):
                    if m:
                        st.add(t0 + j * e8, glock(m + 12 - (12 if m < 70 else 0)), 0.2)
            k += 1
    for lo, hi in a["groove"]:
        i0, i1 = int(lo * RATE), min(len(st.buf), int(hi * RATE)); fade = int(0.25 * RATE)
        gain = np.zeros(len(st.buf)); gain[i0:i1] = 1
        if i0 - fade >= 0: gain[i0 - fade:i0] = np.linspace(0, 1, fade)
        gain[i1:i1 + fade] = np.linspace(1, 0, min(fade, len(gain) - i1))
        st.buf = st.buf * np.maximum(gain, 0) if lo > 0 else st.buf * np.maximum(gain, 0) + 0


def sfx(st: Stem, a):
    for t in a["swipeTicks"]: st.add(t, tick(), 0.6)
    for t in a.get("noSignal", []): st.add(t, beep(900, 520), 0.8)
    for t in a.get("gulps", []): st.add(t, pop(240), 0.9)
    for t in a.get("bangs", []): st.add(t, pop(900), 0.9)
    for t in a.get("rewinds", []): st.add(t, swish(0.9)[::-1], 0.8)
    for t in a.get("creaks", []): st.add(t, creak(0.9), 0.7)
    for t in a["pylons"]: st.add(t, kachunk(), 0.85)
    for lo, hi in a["squeaks"]: st.add(lo, squeak(hi - lo), 0.6)
    for t in a["wipes"]: st.add(t, swish(0.45), 0.9); st.add(t + 0.1, squeak(0.25), 0.4)
    if a.get("porthole"): st.add(a["porthole"][0], rub(a["porthole"][1] - a["porthole"][0] + 0.3), 0.9)
    for t in a["breaths"]: st.add(t, breath(0.75), 0.9)
    for t in a["laugh"]: st.add(t, laugh_sting(), 0.45)
    for t in a["strike"]: st.add(t, swish(0.4), 0.5)
    for lo, hi in a.get("sunSwell", []):
        for m in (62, 69, 74, 78, 81): st.add(lo, pad(m, hi - lo), 0.1)
        st.add(hi - 0.1, fft_bp(noise(0.8), 800, 6000) * np.exp(-tt(0.8) / 0.3) * 0.5, 0.3)
    for t in a["glockNote"]: st.add(t, glock(90, 2.5), 0.5)
    for i, t in enumerate(a["cardPops"]): st.add(t, pop(600 + 200 * i), 0.8)
    for lo, hi in a.get("voteHum", []):
        for m in (50, 57, 62): st.add(lo, pad(m, hi - lo), 0.05)
    for t in a["endChime"]:
        for k, m in enumerate([74, 78, 81, 86]): st.add(t + k * 0.1, bell(m), 0.3)


if __name__ == "__main__":
    ep = sys.argv[1] if len(sys.argv) > 1 else "cabin-ep1"
    spec = json.loads((ROOT / "specs" / "stories" / f"{ep}.json").read_text())
    a, dur = spec["audio"], spec["duration"]
    r, m, s = Stem(dur), Stem(dur), Stem(dur)
    room(r, a); music(m, a); sfx(s, a)
    mix = r.buf * 1.0 + m.buf * 0.9 + s.buf * 1.0
    (ROOT / "public" / "audio").mkdir(parents=True, exist_ok=True)
    write(ROOT / f"public/audio/{ep}.wav", mix)
