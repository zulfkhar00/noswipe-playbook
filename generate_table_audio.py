"""Sound for "Table Nine" (season 8), driven by the "audio" block of specs/stories/<id>.json.

    python3 generate_table_audio.py table-ep1

Silent story, no voices, numpy only. One mixed file public/audio/<id>.wav:
- room tone (low murmur, glassy clinks), tipsy pizzicato waltz 3/4 at the spec bpm (ducks under musicDuck),
- sfx: phone swipe ticks, marker slide/cap/scrawl, tent flip, laugh sting, phone taps, forks, plate, gulp,
  lazy Susan whoosh, card pops, stamps, end chime.
"""
from __future__ import annotations

import json
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).parent
RATE = 44100
rng = np.random.default_rng(909)


def midi(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


class Stem:
    def __init__(self, seconds: float):
        self.buf = np.zeros(int(RATE * seconds))

    def add(self, at: float, sig: np.ndarray, vol: float = 1.0) -> None:
        i = max(0, int(round(at * RATE)))
        if i >= len(self.buf):
            return
        n = min(len(sig), len(self.buf) - i)
        self.buf[i:i + n] += vol * sig[:n]


def tt(d):
    return np.arange(max(1, int(d * RATE))) / RATE


def noise(d):
    return rng.uniform(-1, 1, max(1, int(d * RATE)))


def fft_lp(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / RATE)
    return np.fft.irfft(X / (1 + (f / cutoff) ** 2), len(x))


def fft_bp(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / RATE)
    return np.fft.irfft(X * (1 / (1 + (lo / np.maximum(f, 1)) ** 4)) / (1 + (f / hi) ** 2), len(x))


def env(t, att, dec):
    return np.minimum(1, t / max(att, 1e-4)) * np.exp(-t / dec)


# --- instruments -------------------------------------------------------------------------------
def pluck(m, d=0.5, wob=0.0):                       # pizzicato: sine + short harmonics, slightly out of tune (tipsy)
    t, f = tt(d), midi(m + wob)
    return (np.sin(2 * np.pi * f * t) * env(t, 0.002, 0.14) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * env(t, 0.001, 0.06)
            + 0.12 * np.sin(2 * np.pi * 3 * f * t) * env(t, 0.001, 0.03))


def bell(m, d=1.6):
    t, f = tt(d), midi(m)
    return np.sin(2 * np.pi * f * t) * env(t, 0.002, 0.5) + 0.3 * np.sin(2 * np.pi * f * 2.76 * t) * env(t, 0.001, 0.2)


def tick():
    t = tt(0.03)
    return (np.sin(2 * np.pi * 2600 * t) * 0.4 + noise(0.03) * 0.4) * env(t, 0.0005, 0.006)


def slide(d=0.5):
    t = tt(d)
    return fft_bp(noise(d), 600, 3500) * np.sin(np.pi * np.clip(t / d, 0, 1)) * 0.9


def cap_pop():
    t = tt(0.1)
    return np.sin(2 * np.pi * (500 + 900 * t) * t) * env(t, 0.001, 0.025) * 0.8 + fft_bp(noise(0.1), 1000, 5000) * env(t, 0.0005, 0.01) * 0.4


def scrawl(d):
    t = tt(d)
    strokes = np.abs(np.sin(2 * np.pi * (5.5 + 1.5 * np.sin(2 * np.pi * 0.7 * t)) * t)) ** 0.6
    return fft_bp(noise(d), 1800, 6500) * strokes * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.05) * 0.9


def flip():
    t = tt(0.22)
    return fft_bp(noise(0.22), 300, 2500) * env(t, 0.005, 0.05) * 1.3 + np.sin(2 * np.pi * 140 * t) * env(t, 0.002, 0.04) * 0.4


def laugh_sting():
    s = np.zeros(int(RATE * 1.2))
    for k, m in enumerate([76, 79, 83, 88]):
        b = pluck(m, 0.4); a = int(k * 0.07 * RATE); s[a:a + len(b)] += b[:len(s) - a]
    return s


def phone_tap():
    t = tt(0.1)
    return np.sin(2 * np.pi * 180 * t) * env(t, 0.001, 0.025) * 0.9 + fft_lp(noise(0.1), 1200) * env(t, 0.001, 0.015) * 0.7


def fork_tink(f=4200):
    t = tt(0.5)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.52 * t)) * env(t, 0.0005, 0.12) * 0.25


def plate_clink():
    t = tt(0.6)
    return (np.sin(2 * np.pi * 3100 * t) * env(t, 0.0005, 0.15) + np.sin(2 * np.pi * 4700 * t) * env(t, 0.0005, 0.08)) * 0.3


def gulp():
    t = tt(0.3)
    f = 220 - 120 * np.clip(t / 0.18, 0, 1)
    return np.sin(2 * np.pi * np.cumsum(f) / RATE) * env(t, 0.004, 0.08) * 0.8


def whoosh(d=0.7):
    t = tt(d)
    k = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    return fft_bp(noise(d), 200, 3200) * k * 1.8


def pop(f=700):
    t = tt(0.2)
    return np.sin(2 * np.pi * (f * t + 1200 * t * t)) * env(t, 0.002, 0.07) * 0.6


def stamp():
    t = tt(0.2)
    return np.sin(2 * np.pi * 110 * t) * env(t, 0.002, 0.05) * 0.6 + fft_lp(noise(0.2), 900) * env(t, 0.001, 0.02) * 0.35


# --- stems -------------------------------------------------------------------------------------
def room(st: Stem, dur):
    n = len(st.buf)
    mur = fft_bp(rng.uniform(-1, 1, n), 150, 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.23 * np.arange(n) / RATE))
    st.buf += mur * 0.12


def music(st: Stem, a, dur):
    beat = 60.0 / a["bpm"]
    bar = beat * 3
    prog = [(48, [64, 67, 72]), (55, [62, 67, 71]), (57, [64, 69, 72]), (55, [62, 67, 71])]   # C G Am G, tipsy waltz
    mel = [76, 79, 77, 74, 76, 72, 71, 74, 76, 79, 81, 77]
    for lo, hi in a["groove"]:
        k = int(np.ceil(lo / bar))
        while k * bar < hi - 0.01:
            t0 = k * bar
            root, chord = prog[k % 4]
            st.add(t0, pluck(root - 12 + 12, 0.45), 0.55)
            for j in (1, 2):
                for m in chord:
                    st.add(t0 + j * beat + rng.uniform(0, 0.012), pluck(m - 12, 0.3), 0.14)
            if k % 2 == 0:                                   # wobbly melody on every other bar
                for j in range(3):
                    st.add(t0 + j * beat + 0.02 * ((k + j) % 2), pluck(mel[(k // 2 * 3 + j) % len(mel)], 0.4, wob=0.08 * np.sin(k + j)), 0.22)
            k += 1
    for lo, hi in a["musicDuck"]:
        i0, i1 = int(lo * RATE), int(hi * RATE)
        fade = int(0.15 * RATE)
        g = np.ones(len(st.buf)); g[i0:i1] = 0.0
        g[i0 - fade:i0] = np.linspace(1, 0, fade); g[i1:i1 + fade] = np.linspace(0, 1, fade)
        st.buf *= g


def sfx(st: Stem, a):
    for t in a["swipeTicks"]: st.add(t, tick(), 0.6)
    for t in a["markerSlide"]: st.add(t, slide(0.5), 0.5)
    for t in a["capPop"]: st.add(t, cap_pop(), 0.7)
    for lo, hi in a["scrawl"]: st.add(lo, scrawl(hi - lo), 0.55)
    for t in a["tentFlip"]: st.add(t, flip(), 0.7)
    for t in a["laughSting"]: st.add(t, laugh_sting(), 0.5)
    for t in a["phoneTap"]:
        st.add(t, phone_tap(), 0.9); st.add(t + 0.012, phone_tap(), 0.7)
    for i, t in enumerate(a["forkTinks"]): st.add(t, fork_tink(3900 + 300 * i), 0.5)
    for t in a["plateClink"]: st.add(t, plate_clink(), 0.7)
    for t in a["gulp"]: st.add(t, gulp(), 0.8)
    for t in a["slide"]: st.add(t, slide(0.6), 0.45)
    for t in a["susanWhoosh"]: st.add(t - 0.1, whoosh(0.8), 0.7)
    for i, t in enumerate(a["cardPops"]): st.add(t, pop(600 + 200 * i), 0.8)
    for t in a["stamps"]: st.add(t, stamp(), 0.5)
    for t in a["endChime"]:
        for k, m in enumerate([72, 76, 79, 84]): st.add(t + k * 0.1, bell(m), 0.3)


def write(path: Path, x, peak=0.85):
    x = x * min(1.0, peak / max(1e-9, np.abs(x).max()))
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
    print(f"wrote {path}")


if __name__ == "__main__":
    ep = sys.argv[1] if len(sys.argv) > 1 else "table-ep1"
    spec = json.loads((ROOT / "specs" / "stories" / f"{ep}.json").read_text())
    a, dur = spec["audio"], spec["duration"]
    r, m, s = Stem(dur), Stem(dur), Stem(dur)
    room(r, dur); music(m, a, dur); sfx(s, a)
    mix = r.buf * 0.7 + m.buf * 0.9 + s.buf * 1.0
    (ROOT / "public" / "audio").mkdir(parents=True, exist_ok=True)
    write(ROOT / f"public/audio/{ep}.wav", mix)
