"""Sound for "Lane 8" (season 7), driven by the "audio" block of specs/stories/<id>.json.

    python3 generate_lane_audio.py lane-ep1

A silent story: no voices. Three stems, composed in code (numpy only, no samples, no paid APIs):
- room: alley hum, distant pin crashes, jukebox murmur;
- music: gated drum machine + bouncy square bass + glass marimba at 108 bpm, in the spec's "groove" ranges;
  ducks under "musicDuck";
- sfx: swipe/timer/keypad beeps, split-flap ticks, bonk, ball rumble, gutter thud, pin clacks and wobble,
  soft claps, strike crash, phone buzz, ball-wipe whoosh, card pops, stamps and the end chime.
"""
from __future__ import annotations

import json
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).parent
RATE = 44100
rng = np.random.default_rng(808)


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


def tt(d: float) -> np.ndarray:
    return np.arange(max(1, int(d * RATE))) / RATE


def noise(d: float) -> np.ndarray:
    return rng.uniform(-1, 1, max(1, int(d * RATE)))


def fft_lp(x: np.ndarray, cutoff: float) -> np.ndarray:
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / RATE)
    return np.fft.irfft(X / (1 + (f / cutoff) ** 2), len(x))


def fft_bp(x: np.ndarray, lo: float, hi: float) -> np.ndarray:
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / RATE)
    return np.fft.irfft(X * (1 / (1 + (lo / np.maximum(f, 1)) ** 4)) / (1 + (f / hi) ** 2), len(x))


def env(t: np.ndarray, att: float, dec: float) -> np.ndarray:
    return np.minimum(1, t / max(att, 1e-4)) * np.exp(-t / dec)


def square(f, t, duty=0.5):
    return np.where((f * t) % 1.0 < duty, 1.0, -1.0)


# --- instruments ------------------------------------------------------------------------------
def marimba(m: float, d: float = 1.0) -> np.ndarray:        # glass marimba: sine + inharmonic partial
    t, f = tt(d), midi(m)
    return (np.sin(2 * np.pi * f * t) * env(t, 0.002, 0.35) + 0.4 * np.sin(2 * np.pi * f * 3.97 * t) * env(t, 0.001, 0.08)
            + 0.15 * np.sin(2 * np.pi * f * 9.2 * t) * env(t, 0.001, 0.03))


def bass(m: float, d: float = 0.25) -> np.ndarray:
    t, f = tt(d), midi(m)
    y = square(f, t, 0.35) * 0.6 + np.sin(2 * np.pi * f * t) * 0.6
    return fft_lp(y, 900) * env(t, 0.004, d * 0.5)


def kick() -> np.ndarray:
    t = tt(0.3)
    ph = 2 * np.pi * (45 * t + 90 * (1 - np.exp(-t * 28)) / 28)
    return np.sin(ph) * env(t, 0.002, 0.09) * 1.1


def clap() -> np.ndarray:
    t = tt(0.16)
    return fft_bp(noise(0.16), 900, 5000) * env(t, 0.001, 0.035) * 2.2


def hat(o: bool = False) -> np.ndarray:
    d = 0.14 if o else 0.04
    t = tt(d)
    return fft_bp(noise(d), 6000, 15000) * env(t, 0.001, d * 0.4) * 1.4


def blip(f: float, d: float = 0.08, sq: bool = True) -> np.ndarray:
    t = tt(d)
    return (square(f, t) if sq else np.sin(2 * np.pi * f * t)) * env(t, 0.002, d * 0.5) * 0.4


def click(f: float = 2400.0) -> np.ndarray:
    t = tt(0.025)
    return (np.sin(2 * np.pi * f * t) * 0.5 + noise(0.025) * 0.5) * env(t, 0.0005, 0.005)


def flap() -> np.ndarray:
    t = tt(0.05)
    return (fft_bp(noise(0.05), 1500, 6000) * env(t, 0.0004, 0.006) * 1.6 + np.sin(2 * np.pi * 1800 * t) * env(t, 0.0004, 0.004) * 0.3)


def bonk() -> np.ndarray:
    t = tt(0.5)
    ph = 2 * np.pi * (170 * t - 90 * (1 - np.exp(-t * 6)) / 6)
    return np.sin(ph) * env(t, 0.002, 0.16) * 1.1 + fft_lp(noise(0.5), 600) * env(t, 0.001, 0.02) * 0.6


def keybeep(f: float) -> np.ndarray:
    t = tt(0.11)
    return (np.sin(2 * np.pi * f * t) + np.sin(2 * np.pi * f * 1.4 * t) * 0.6) * env(t, 0.002, 0.06) * 0.35


def rumble(d: float, rate: float = 1.0) -> np.ndarray:
    t = tt(d)
    y = fft_lp(noise(d), 220 * rate) * 3.0 * (1 + 0.5 * np.sin(2 * np.pi * 9 * rate * t))
    fade = np.minimum(1, t / 0.12) * np.minimum(1, (d - t) / 0.12)
    return y * fade


def thud() -> np.ndarray:
    t = tt(0.5)
    return np.sin(2 * np.pi * 70 * t) * env(t, 0.002, 0.14) * 1.2 + fft_lp(noise(0.5), 400) * env(t, 0.001, 0.05)


def clack(f: float = 1000.0) -> np.ndarray:
    t = tt(0.18)
    return (np.sin(2 * np.pi * f * t) * env(t, 0.0005, 0.03) * 0.6 + np.sin(2 * np.pi * f * 2.3 * t) * env(t, 0.0005, 0.015) * 0.3
            + fft_bp(noise(0.18), 800, 5000) * env(t, 0.0003, 0.01) * 0.8)


def crash(d: float = 1.4) -> np.ndarray:
    y = fft_bp(noise(d), 300, 7000) * env(tt(d), 0.002, 0.35) * 1.4
    out = y
    for _ in range(14):
        a = int(rng.uniform(0, 0.8) * RATE)
        c = clack(rng.uniform(700, 1500)) * rng.uniform(0.3, 0.9)
        n = min(len(c), len(out) - a)
        out[a:a + n] += c[:n]
    return out


def softclap() -> np.ndarray:
    t = tt(0.12)
    return fft_bp(noise(0.12), 500, 2500) * env(t, 0.002, 0.03) * 1.2


def buzz(d: float = 0.5) -> np.ndarray:
    t = tt(d)
    gate = ((t * 14) % 1.0 < 0.6) * np.minimum(1, (d - t) / 0.05)
    return (square(170, t) * 0.5 + np.sin(2 * np.pi * 85 * t) * 0.5) * gate * 0.8


def whoosh(d: float = 0.7) -> np.ndarray:
    t = tt(d)
    sweep = fft_bp(noise(d), 200, 3000) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5 * 1.8
    return sweep + rumble(d, 1.6) * 0.5 * np.sin(np.pi * np.clip(t / d, 0, 1))


def pop(f: float = 880) -> np.ndarray:
    t = tt(0.22)
    ph = 2 * np.pi * (f * t + 300 * t * t * 4)
    return np.sin(ph) * env(t, 0.002, 0.07) * 0.6


def power_off() -> np.ndarray:                                  # falling two-tone, then a soft tick
    t = tt(0.35)
    f = 1500 * np.exp(-t * 4.5) + 300
    return np.sin(2 * np.pi * np.cumsum(f) / RATE) * env(t, 0.003, 0.14) * 0.6


def slap() -> np.ndarray:                                       # air high-five: flat clap + short ping
    t = tt(0.2)
    return fft_bp(noise(0.2), 1200, 7000) * env(t, 0.0005, 0.03) * 2.0 + np.sin(2 * np.pi * 1500 * t) * env(t, 0.001, 0.05) * 0.4


def tape_rewind(d: float) -> np.ndarray:                        # rising warble, like a tape spinning back
    t = tt(d)
    f = 300 + 1500 * (t / d) ** 2
    return np.sin(2 * np.pi * np.cumsum(f) / RATE) * 0.3 * np.minimum(1, (d - t) / 0.1) * (0.6 + 0.4 * np.sin(2 * np.pi * 22 * t))


def stamp() -> np.ndarray:
    t = tt(0.2)
    return np.sin(2 * np.pi * 110 * t) * env(t, 0.002, 0.05) * 0.7 + fft_lp(noise(0.2), 900) * env(t, 0.001, 0.02) * 0.4


# --- stems ------------------------------------------------------------------------------------
def room(st: Stem, a: dict, dur: float) -> None:
    n = len(st.buf)
    x = np.arange(n) / RATE
    hum = fft_lp(noise(dur), 160) * 3.0 + 0.06 * np.sin(2 * np.pi * 60 * x) + 0.03 * np.sin(2 * np.pi * 120 * x)
    st.buf += hum * (0.5 + 0.1 * np.sin(2 * np.pi * 0.2 * x))
    murmur = fft_bp(noise(dur), 300, 1800) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.37 * x + 1) ** 2) * 0.5
    st.buf += murmur * 0.28
    t = 1.3
    while t < dur - 0.5:                                    # distant pin crashes, far away: dull and quiet
        c = fft_lp(crash(1.0), 1500)
        st.add(t, c, 0.18)
        t += rng.uniform(3.2, 6.0)


def music(st: Stem, a: dict, dur: float) -> None:
    beat = 60.0 / a["bpm"]
    bar = beat * 4
    groove = a["groove"]
    on = lambda t: any(lo <= t < hi for lo, hi in groove)
    prog = [(45, [69, 72, 76]), (41, [65, 69, 72]), (36, [67, 72, 76]), (43, [67, 71, 74])]   # Am F C G
    mel = [(81, .5), (84, .5), (88, 1), (84, .5), (81, .5), (79, 1), (76, 1), (79, .5), (81, 1.5)]
    for b in range(int(dur / bar) + 1):
        t0 = b * bar
        if not on(t0 + 0.01):
            continue
        root, ch = prog[b % 4]
        for q in (0, 2):
            st.add(t0 + q * beat, kick(), 0.9)
        for q in (1, 3):
            st.add(t0 + q * beat, clap(), 0.55)
        for e in range(8):
            st.add(t0 + e * beat / 2, hat(e % 4 == 3), 0.32 if e % 2 else 0.2)
        # bouncy square bass: root, octave, root-ish offbeats
        for k, (off, add) in enumerate(((0, 0), (0.75, 12), (1.5, 0), (2, 7), (2.75, 12), (3.5, 0))):
            st.add(t0 + off * beat, bass(root + add, 0.22), 0.5)
        for k, m in enumerate(ch):                                  # marimba stabs on the offbeats
            st.add(t0 + 1.5 * beat + k * 0.01, marimba(m + 12 if m < 70 else m, 0.5), 0.1)
            st.add(t0 + 3.5 * beat + k * 0.01, marimba(m + 12 if m < 70 else m, 0.5), 0.08)
        if b % 2 == 1:
            t = t0 - bar + 0.0
            tm = t0 - bar
            for m, d in mel:
                if on(tm):
                    st.add(tm, marimba(m, 0.7), 0.17)
                tm += d * beat
    x = np.arange(len(st.buf)) / RATE
    g = np.ones(len(x))
    for lo, hi in a.get("musicDuck", []):
        g *= 1 - 0.6 * np.clip((x - lo) / 0.1, 0, 1) * (1 - np.clip((x - hi) / 0.4, 0, 1))
    st.buf *= g


def sfx(st: Stem, a: dict) -> None:
    for t in a["swipeTicks"]:
        st.add(t, click(2000), 0.5)
        st.add(t + 0.03, click(3000), 0.3)
    for i, t in enumerate(a["timerTicks"]):
        st.add(t, blip(1100 + 130 * i, 0.07), 0.6)
    for t in a["bonk"]:
        st.add(t, bonk(), 0.9)
    for t in a["flipTicks"]:
        st.add(t, flap(), 0.45 + 0.1 * (int(t * 100) % 3))
    for i, t in enumerate(a["keypadBeeps"]):
        st.add(t, keybeep(1250 + 90 * (i % 3)), 0.6)
    for lo, hi in a["ballRoll"]:
        st.add(lo, rumble(hi - lo, 1.0 if hi - lo < 1.3 else 0.8), 0.5)
    for t in a["gutterThud"]:
        st.add(t, thud(), 0.9)
    for t in a["pinClack"]:
        st.add(t, clack(1100), 0.8)
    for lo, hi in a["pinWobble"]:                                   # accelerating little taps, then the fall
        t, gap = lo, 0.22
        while t < hi - 0.05:
            st.add(t, clack(900 + 80 * (t - lo)), 0.22)
            t += gap
            gap = max(0.07, gap * 0.82)
    for t in a["pinFall"]:
        st.add(t, clack(850), 0.8)
        st.add(t + 0.09, clack(1150), 0.5)
        st.add(t + 0.17, thud(), 0.3)
    for t in a["scorePop"]:
        st.add(t, pop(700), 0.8)
        st.add(t + 0.1, pop(1050), 0.7)
    for t in a["softClaps"]:
        for k in range(3):
            st.add(t + k * 0.2, softclap(), 0.6)
    for t in a["strikeCrash"]:
        st.add(t, crash(1.5), 0.9)
    for t in a["phoneBuzz"]:
        st.add(t, buzz(0.55), 0.8)
    for t in a["ballWipe"]:
        st.add(t - 0.05, whoosh(0.8), 0.7)
    for i, t in enumerate(a["cardPops"]):
        st.add(t, pop(600 + 200 * i), 0.8)
        st.add(t + 0.05, marimba(76 + 4 * i, 0.6), 0.25)
    for t in a["stamps"]:
        st.add(t, stamp(), 0.6)
    for t in a.get("powerOff", []):
        st.add(t, power_off(), 0.7)
    for t in a.get("slap", []):
        st.add(t, slap(), 0.8)
    for lo, hi in a.get("rewind", []):
        st.add(lo, tape_rewind(hi - lo), 0.6)
    for t in a["endChime"]:
        for k, m in enumerate([69, 72, 76, 81]):
            st.add(t + k * 0.09, marimba(m, 2.0), 0.28)


def write(path: Path, x: np.ndarray, peak: float = 0.8) -> None:
    x = x * min(1.0, peak / max(1e-9, np.abs(x).max()))
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
    print(f"wrote {path}")


if __name__ == "__main__":
    ep = sys.argv[1] if len(sys.argv) > 1 else "lane-ep1"
    spec = json.loads((ROOT / "specs" / "stories" / f"{ep}.json").read_text())
    a, dur = spec["audio"], spec["duration"]
    a["swipeTicks"] = a.get("swipeTicks", [])
    r, m, s = Stem(dur), Stem(dur), Stem(dur)
    room(r, a, dur)
    music(m, a, dur)
    sfx(s, a)
    (ROOT / "public" / "audio").mkdir(parents=True, exist_ok=True)
    write(ROOT / f"public/audio/{ep}-room.wav", r.buf, 0.4)
    write(ROOT / f"public/audio/{ep}-music.wav", m.buf)
    write(ROOT / f"public/audio/{ep}-sfx.wav", s.buf)
