"""Sound for "Seven Across" (season 5), driven by the "audio" block of specs/stories/<id>.json.

    python3 generate_across_audio.py across-ep1

A silent story: no voices. Three stems, composed in code (numpy only, no samples, no paid APIs):
- room: 6/8 rail clack (a double-tap per eighth, accented on the bar and beat 4) over a carriage rumble;
  the clack is muted in the spec's muteFrom..muteTo;
- music: vibraphone + upright bass + brushes, swing at 112 bpm; it drops out at musicDropFrom, returns at
  musicBackAt; the full groove (bass + brushes) plays in the spec's "groove" ranges, vibes alone elsewhere;
  it ducks under the spec's musicDuck ranges;
- sfx: pen click, pen scratches, letter ticks, station chime, door hiss, page rustles, passing-train
  whoosh, phone buzz, blush ping, rubber-stamp thumps and whooshes.
"""

from __future__ import annotations

import json
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).parent
RATE = 44100
rng = np.random.default_rng(505)


def midi(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


class Stem:
    def __init__(self, seconds: float):
        self.buf = np.zeros(int(RATE * seconds))

    def add(self, at: float, sig: np.ndarray, vol: float = 1.0) -> None:
        i = int(round(at * RATE))
        if i < 0:                       # clamp negative cue times: start the sound at 0
            i = 0
        if i >= len(self.buf):
            return
        n = min(len(sig), len(self.buf) - i)
        self.buf[i:i + n] += vol * sig[:n]


def tt(d: float) -> np.ndarray:
    return np.arange(max(1, int(d * RATE))) / RATE


def lowpass(x: np.ndarray, a: float) -> np.ndarray:
    """One-pole lowpass via FFT-free block recursion (fast enough in chunks)."""
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc)
        y[i] = acc
    return y


def fft_lowpass(x: np.ndarray, cutoff: float) -> np.ndarray:
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / RATE)
    X *= 1 / (1 + (f / cutoff) ** 2)
    return np.fft.irfft(X, len(x))


def noise(d: float) -> np.ndarray:
    return rng.uniform(-1, 1, int(d * RATE))


def env(t: np.ndarray, att: float, dec: float) -> np.ndarray:
    return np.minimum(1, t / max(att, 1e-4)) * np.exp(-t / dec)


# --- instruments ------------------------------------------------------------------------------

def vibes(m: float, d: float = 1.8) -> np.ndarray:
    t, f = tt(d), midi(m)
    trem = 1 + 0.18 * np.sin(2 * np.pi * 5.2 * t)
    tone = np.sin(2 * np.pi * f * t) + 0.12 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 9) + 0.05 * np.sin(2 * np.pi * f * 10 * t) * np.exp(-t * 25)
    return tone * trem * env(t, 0.004, 0.9) * np.minimum(1, (d - t) / 0.1)


def upright(m: float, d: float = 0.5) -> np.ndarray:
    t, f = tt(d), midi(m)
    return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t * 8)) * env(t, 0.008, 0.28) * np.minimum(1, (d - t) / 0.05)


def swish(d: float = 0.2) -> np.ndarray:
    t = tt(d)
    return fft_lowpass(noise(d), 5000) * np.sin(np.pi * t / d) ** 1.5 * 0.5


def ridepat() -> np.ndarray:
    t = tt(0.12)
    return fft_lowpass(noise(0.12), 7000) * np.exp(-t * 45) * 0.4


# --- sound effects ----------------------------------------------------------------------------

def clack(strong: float) -> np.ndarray:
    t = tt(0.14)
    tap = (fft_lowpass(noise(0.14), 3000) * np.exp(-t * 70) + 0.6 * np.sin(2 * np.pi * 180 * t) * np.exp(-t * 45))
    out = tap.copy()
    k = int(0.055 * RATE)
    out[k:] += 0.7 * tap[:-k]
    return out * strong


def stamp() -> np.ndarray:
    t = tt(0.22)
    return 0.8 * np.sin(2 * np.pi * (130 + 90 * np.exp(-t * 40)) * t) * np.exp(-t * 26) + 0.5 * fft_lowpass(noise(0.22), 2500) * np.exp(-t * 45)


def rustle(d: float = 0.4) -> np.ndarray:
    t = tt(d)
    grit = fft_lowpass(noise(d), 4500) * (0.4 + 0.6 * (rng.uniform(0, 1, len(t)) > 0.95))
    return grit * np.sin(np.pi * t / d) * 0.7


def whoosh(d: float = 0.45) -> np.ndarray:
    t = tt(d)
    return fft_lowpass(noise(d), 2200) * np.sin(np.pi * t / d) ** 2 * 0.8


def train_pass(d: float = 1.0) -> np.ndarray:
    t = tt(d)
    swell = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    rush = fft_lowpass(noise(d), 1400) * swell
    rumble = np.sin(2 * np.pi * (55 + 20 * np.sin(np.pi * t / d)) * t) * swell * 0.6
    bumps = (np.sin(2 * np.pi * 14 * t) > 0.8) * swell * 0.4 * fft_lowpass(noise(d), 600)
    return rush + rumble + bumps


def scratch(d: float) -> np.ndarray:
    t = tt(d)
    stroke = 0.45 + 0.55 * np.abs(np.sin(2 * np.pi * 7.5 * t + 0.6 * np.sin(2 * np.pi * 1.3 * t)))
    hp = noise(d) - fft_lowpass(noise(d), 1800)
    return hp * stroke * np.minimum(1, t / 0.03) * np.minimum(1, (d - t) / 0.05) * 0.5


def pen_click() -> np.ndarray:
    t = tt(0.2)
    a = np.sin(2 * np.pi * 2800 * t) * np.exp(-t * 160)
    b = np.zeros_like(t)
    k = int(0.09 * RATE)
    b[k:] = (np.sin(2 * np.pi * 2100 * t) * np.exp(-t * 200))[:-k]
    return (a + 0.8 * b) * 0.7


def tick() -> np.ndarray:
    t = tt(0.07)
    return (np.sin(2 * np.pi * 1700 * t) + 0.4 * np.sin(2 * np.pi * 3400 * t)) * np.exp(-t * 80) * 0.7


def bell(f: float, d: float = 1.6) -> np.ndarray:
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 4) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 9)) * env(t, 0.003, 0.6)


def hiss(d: float = 0.9) -> np.ndarray:
    t = tt(d)
    return (noise(d) - fft_lowpass(noise(d), 2500)) * env(t, 0.02, 0.35) * 0.9 + fft_lowpass(noise(d), 300) * np.exp(-t * 20) * 1.2


def buzz(d: float = 0.5) -> np.ndarray:
    t = tt(d)
    on = (np.sin(2 * np.pi * 6 * t) > -0.2).astype(float)
    return fft_lowpass(np.sign(np.sin(2 * np.pi * 175 * t)) * 0.5 + np.sin(2 * np.pi * 350 * t) * 0.2, 1500) * on * np.minimum(1, (d - t) / 0.03) * 0.8


def ping() -> np.ndarray:
    t = tt(0.9)
    return np.sin(2 * np.pi * 1568 * t) * np.exp(-t * 6) * 0.6


def cup_rattle(d: float) -> np.ndarray:
    """A paper-cup lid chattering on a shaky hand."""
    t = tt(d)
    gate = (np.sin(2 * np.pi * 23 * t) > -0.1).astype(float)
    return fft_lowpass(noise(d), 3500) * gate * (0.3 + 0.7 * t / d) * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.05)


def splat() -> np.ndarray:
    t = tt(0.5)
    wet = (noise(0.5) - fft_lowpass(noise(0.5), 900)) * np.exp(-t * 14)
    thud = np.sin(2 * np.pi * (110 - 40 * t) * t) * np.exp(-t * 18)
    return fft_lowpass(wet, 4000) * 0.8 + 0.6 * thud


def drip() -> np.ndarray:
    t = tt(0.25)
    return np.sin(2 * np.pi * (900 + 500 * np.exp(-t * 30)) * t) * np.exp(-t * 28) * 0.6


def rewind_sweep(d: float) -> np.ndarray:
    """Reverse-tape swell: filtered noise whose cutoff and level rise, then a sharp stop."""
    t = tt(d)
    base = noise(d)
    out = np.zeros_like(t)
    for k in range(8):
        lo, hi = k / 8, (k + 1) / 8
        band = fft_lowpass(base, 400 + 5200 * (hi ** 2))
        seg = (t / d >= lo) & (t / d < hi)
        out += band * seg
    wob = 0.7 + 0.3 * np.sin(2 * np.pi * (6 + 20 * t / d) * t)
    tone = np.sin(2 * np.pi * (300 + 1400 * (t / d) ** 2) * t) * 0.25
    return (out * 0.8 + tone) * wob * (t / d) ** 1.5 * np.minimum(1, (d - t) / 0.03)


def beep(f: float = 2100.0) -> np.ndarray:
    t = tt(0.09)
    return np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.004) * np.minimum(1, (0.09 - t) / 0.01) * 0.6


def pen_tap() -> np.ndarray:
    t = tt(0.1)
    return (np.sin(2 * np.pi * 900 * t) * 0.6 + fft_lowpass(noise(0.1), 2500) * 0.6) * np.exp(-t * 70)


# --- stems ------------------------------------------------------------------------------------

def room(st: Stem, a: dict, dur: float) -> None:
    n = len(st.buf)
    rum = fft_lowpass(rng.uniform(-1, 1, n), 140) * 3.0
    st.buf += rum * (0.5 + 0.1 * np.sin(2 * np.pi * 0.3 * np.arange(n) / RATE))
    c = a["clack"]
    eighth = 60.0 / (c["bpm"] * 1.5)           # 6/8: the dotted quarter is the beat
    lo, hi = c.get("muteFrom", -1), c.get("muteTo", -1)
    i, t = 0, c.get("from", 0.0)
    while t < min(dur, c.get("to", dur)):
        pos = i % 6
        vol = 1.0 if pos == 0 else 0.75 if pos == 3 else 0.4
        if c.get("reverseFrom", -1) <= t < c.get("reverseTo", -1):
            st.add(t - 0.14, clack(vol)[::-1], 0.55)       # rewind: each clack plays backwards
        elif not (lo <= t < hi):
            st.add(t, clack(vol), 0.55)
        i += 1
        t += eighth


CHORDS = [  # (bass, vibes voicing)  Dm9 | G13 | Cmaj9 | A7b13
    (38, [53, 57, 60, 64]), (43, [53, 59, 64, 69]), (36, [52, 55, 59, 62]), (45, [55, 61, 64, 69]),
]


def music(st: Stem, a: dict, dur: float) -> None:
    bpm = a["bpm"]
    beat = 60.0 / bpm
    bar = beat * 4
    groove = a.get("groove", [])
    in_groove = lambda t: any(lo <= t < hi for lo, hi in groove)
    nbars = int(dur / bar) + 1
    for b in range(nbars):
        t0 = b * bar
        bass_m, voc = CHORDS[b % 4]
        full = in_groove(t0)
        # vibes comp: swung on 1, the "and" of 2 and 4
        for off, vel in ((0, 1.0), (1.67, 0.7), (3.0, 0.8), (3.67, 0.5)):
            for k, m in enumerate(voc):
                st.add(t0 + off * beat + k * 0.012, vibes(m, 1.6), 0.09 * vel * (1 if full else 0.8))
        if full:
            for q in range(4):
                walk = bass_m + [0, 4, 7, 5][q] if b % 2 == 0 else bass_m + [0, 7, 5, 4][q]
                st.add(t0 + q * beat, upright(walk, beat * 0.9), 0.5)
            for q in (1, 3):
                st.add(t0 + q * beat, swish(0.22), 0.5)
            for q in range(4):                     # swung ride: beat + the triplet "a"
                st.add(t0 + q * beat, ridepat(), 0.55)
                st.add(t0 + (q + 0.67) * beat, ridepat(), 0.3)
    # melody: a lazy vibes line on the last bars of each groove range, plus a final chord
    for lo, hi in groove:
        t = lo
        for m, d in ((72, 1), (74, 1), (76, 2), (72, 1), (69, 1), (71, 2)):
            if t < hi:
                st.add(t, vibes(m, 1.4), 0.16)
            t += d * beat
    for k, m in enumerate([53, 60, 64, 69, 72]):
        st.add(a["stamps"][-1] if "stamps" in a else 40.0, vibes(m, 2.8), 0.12)
    # drop-out and return, with short fades
    g = np.ones(len(st.buf))
    x = np.arange(len(g)) / RATE
    d0, d1 = a["musicDropFrom"], a["musicBackAt"]
    g *= 1 - np.clip((x - d0) / 0.25, 0, 1) * (1 - np.clip((x - d1 + 0.05) / 0.1, 0, 1))
    for lo, hi in a.get("musicDuck", []):
        g *= 1 - 0.55 * np.clip((x - lo) / 0.3, 0, 1) * (1 - np.clip((x - hi) / 0.4, 0, 1))
    st.buf *= g


def sfx(st: Stem, a: dict) -> None:
    for t in a["penClick"]:
        st.add(t, pen_click(), 0.9)
    for lo, hi in a["penScratch"]:
        st.add(lo, scratch(max(0.1, hi - lo)), 0.7)
    for t in a["letterTicks"]:
        st.add(t, tick(), 0.7)
    for t in a["chime"]:
        st.add(t, bell(784), 0.4)
        st.add(t + 0.28, bell(659, 2.0), 0.4)
    for t in a["doorHiss"]:
        st.add(t, hiss(1.0), 0.7)
    for t in a["pageRustle"]:
        st.add(t, rustle(0.45), 0.8)
    rev = set(a.get("passingTrainReversed", []))
    for t in a["passingTrain"]:
        if t not in rev:
            st.add(t - 0.05, train_pass(1.0), 0.9)
    for t in a.get("penTap", []):
        st.add(t, pen_tap(), 0.9)
    for lo, hi in a.get("cupRattle", []):
        st.add(lo, cup_rattle(hi - lo), 0.6)
    for t in a.get("splat", []):
        st.add(t, splat(), 0.9)
    for t in a.get("drips", []):
        st.add(t, drip(), 0.7)
    for lo, hi in a.get("rewindSweep", []):
        st.add(lo, rewind_sweep(hi - lo), 0.7)
    for t in a.get("doorBeeps", []):
        st.add(t, beep(), 0.6)
    for t in a.get("passingTrainReversed", []):
        st.add(t - 0.05, train_pass(1.0)[::-1], 0.3)
    for t in a.get("warmNote", []):
        st.add(t, vibes(72, 2.0), 0.35)
    for t in a.get("phoneBuzz", []):
        st.add(t, buzz(0.55), 0.8)
    for t in a["stamps"]:
        st.add(t, stamp(), 0.8)
    for t in a["whooshes"]:
        st.add(t, whoosh(0.5), 0.6)
    for t in a.get("blushPing", []):
        st.add(t, ping(), 0.6)


def write(path: Path, x: np.ndarray, peak: float = 0.8) -> None:
    x = x * min(1.0, peak / max(1e-9, np.abs(x).max()))
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
    print(f"wrote {path}")


if __name__ == "__main__":
    ep = sys.argv[1] if len(sys.argv) > 1 else "across-ep1"
    spec = json.loads((ROOT / "specs" / "stories" / f"{ep}.json").read_text())
    a, dur = spec["audio"], spec["duration"]
    a["stamps"] = a["stamps"]
    r, m, s = Stem(dur), Stem(dur), Stem(dur)
    room(r, a, dur)
    music(m, a, dur)
    sfx(s, a)
    (ROOT / "public" / "audio").mkdir(parents=True, exist_ok=True)
    write(ROOT / f"public/audio/{ep}-room.wav", r.buf, 0.45)
    write(ROOT / f"public/audio/{ep}-music.wav", m.buf)
    write(ROOT / f"public/audio/{ep}-sfx.wav", s.buf)
