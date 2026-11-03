"""Sound for "The Dryer Notes" (story account, season 4), driven by specs/stories/<id>.json.

    python3 generate_dryer_audio.py dryer-ep1   (part 1 has its own cue sheet below;
    python3 generate_dryer_audio.py dryer-ep2    from part 2 on, the spec's "audio" block lists the cues)

A silent season: no voices. Three stems, all composed in code (numpy):
- room: the laundromat at night: fluorescent hum, the running dryers' rumble with a soft thump each
  time the clothes tumble over; it ducks under the vote and the end card;
- music: lazy lo-fi at 84 bpm (Rhodes chords, round bass, brushed kit) that drops out when he finds
  the note, keeps only a glockenspiel under the note close-up, and comes back when he grins;
- sfx: footsteps, the basket, paper, the dryer's end-of-cycle buzzer as the punchline, the facepalm,
  a rubber-stamp thump on every strip and card, and the drum rumbling under the end card.
"""

from __future__ import annotations

import json
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).parent
RATE = 44100
rng = np.random.default_rng(404)


def midi(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


class Stem:
    def __init__(self, seconds: float):
        self.buf = np.zeros(int(RATE * seconds))

    def add(self, at: float, sig: np.ndarray, vol: float = 1.0) -> None:
        i = int(at * RATE)
        if i >= len(self.buf):
            return
        if i < 0:
            sig, i = sig[-i:], 0
        n = min(len(sig), len(self.buf) - i)
        self.buf[i:i + n] += vol * sig[:n]


def tt(d: float) -> np.ndarray:
    return np.arange(int(d * RATE)) / RATE


def lowpass(x: np.ndarray, a: float) -> np.ndarray:
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc)
        y[i] = acc
    return y


def env(t: np.ndarray, att: float, dec: float) -> np.ndarray:
    return np.minimum(1, t / max(att, 1e-4)) * np.exp(-t / dec)


# --- instruments -------------------------------------------------------------------------------

def rhodes(m: float, d: float = 1.6) -> np.ndarray:
    t, f = tt(d), midi(m)
    bell = np.sin(2 * np.pi * f * 7 * t) * np.exp(-t * 14) * 0.12
    return (np.sin(2 * np.pi * f * t + 0.6 * np.sin(2 * np.pi * f * t) * np.exp(-t * 3)) + bell) * env(t, 0.006, 0.9)


def bass(m: float, d: float = 0.6) -> np.ndarray:
    t, f = tt(d), midi(m)
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)) * env(t, 0.01, 0.35)


def glock(m: float) -> np.ndarray:
    t, f = tt(1.4), midi(m)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 8)) * env(t, 0.002, 0.45)


def kick() -> np.ndarray:
    t = tt(0.3)
    return np.sin(2 * np.pi * (50 + 70 * np.exp(-t * 30)) * t) * np.exp(-t * 14)


def brush(d: float = 0.18) -> np.ndarray:
    t = tt(d)
    return lowpass(rng.uniform(-1, 1, len(t)), 0.5) * np.sin(np.pi * t / d) ** 2


def snare() -> np.ndarray:
    t = tt(0.25)
    return lowpass(rng.uniform(-1, 1, len(t)), 0.4) * np.exp(-t * 18) + 0.3 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25)


# --- sound effects -----------------------------------------------------------------------------

def thud(f0: float = 70, d: float = 0.35) -> np.ndarray:
    t = tt(d)
    return np.sin(2 * np.pi * (f0 + 60 * np.exp(-t * 25)) * t) * np.exp(-t * 11) + 0.3 * lowpass(rng.uniform(-1, 1, len(t)), 0.2) * np.exp(-t * 30)


def stamp() -> np.ndarray:   # a rubber stamp hitting paper: a dull knock plus a papery slap
    t = tt(0.22)
    return 0.8 * np.sin(2 * np.pi * (130 + 90 * np.exp(-t * 40)) * t) * np.exp(-t * 26) + 0.5 * lowpass(rng.uniform(-1, 1, len(t)), 0.6) * np.exp(-t * 45)


def rustle(d: float = 0.4) -> np.ndarray:
    t = tt(d)
    grit = lowpass(rng.uniform(-1, 1, len(t)), 0.35) * (0.5 + 0.5 * (rng.uniform(0, 1, len(t)) > 0.97))
    return grit * np.sin(np.pi * t / d)


def whoosh(d: float = 0.45, up: bool = True) -> np.ndarray:
    t = tt(d)
    n = rng.uniform(-1, 1, len(t))
    a = np.linspace(0.05, 0.5, len(t)) if up else np.linspace(0.5, 0.05, len(t))
    y, acc = np.empty_like(n), 0.0
    for i, v in enumerate(n):
        acc += a[i] * (v - acc)
        y[i] = acc
    return y * np.sin(np.pi * t / d) ** 2


def buzzer(d: float = 1.1) -> np.ndarray:   # the dryer's end-of-cycle buzzer
    t = tt(d)
    sq = np.sign(np.sin(2 * np.pi * 120 * t)) * 0.6 + np.sign(np.sin(2 * np.pi * 241 * t)) * 0.3
    return lowpass(sq, 0.25) * np.minimum(1, t / 0.01) * np.minimum(1, (d - t) / 0.05)


def step() -> np.ndarray:
    t = tt(0.12)
    return lowpass(rng.uniform(-1, 1, len(t)), 0.25) * np.exp(-t * 40) + 0.4 * np.sin(2 * np.pi * 90 * t) * np.exp(-t * 35)


def slap() -> np.ndarray:
    t = tt(0.15)
    return lowpass(rng.uniform(-1, 1, len(t)), 0.7) * np.exp(-t * 50) + 0.5 * np.sin(2 * np.pi * 160 * t) * np.exp(-t * 40)


def tick() -> np.ndarray:
    t = tt(0.06)
    return np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 90)


# --- stems -------------------------------------------------------------------------------------

def room(st: Stem, b: dict, dur: float) -> None:
    t = tt(dur)
    hum = 0.05 * np.sin(2 * np.pi * 120 * t) + 0.02 * np.sin(2 * np.pi * 240 * t)
    rumble = lowpass(rng.uniform(-1, 1, len(t)), 0.02) * 1.6
    tumble = np.zeros(len(t))
    period = 0.74
    for k in range(int(dur / period) + 1):   # clothes flopping over inside the running dryers
        i = max(0, int((k * period + rng.uniform(-0.04, 0.04)) * RATE))
        s = thud(55, 0.25) * 0.10
        n = max(0, min(len(s), len(t) - i))
        tumble[i:i + n] += s[:n]
    duck = np.ones(len(t))
    for a in (b["choice"],):
        duck *= 1 - 0.65 * np.clip((t - a) / 0.5, 0, 1)
    st.add(0, (hum + 0.25 * rumble + tumble) * duck)


def music(st: Stem, b: dict, dur: float, lines: list[float]) -> None:
    beat = 60 / 84
    chords = [[65, 69, 72, 76], [64, 67, 71, 74], [62, 65, 69, 72], [60, 64, 67, 71]]   # Fmaj7 Em7 Dm7 Cmaj7
    roots = [41, 40, 38, 36]

    def groove(a: float, z: float, vol: float = 1.0) -> None:
        bar = 0
        t = a
        while t < z - 0.05:
            ch, r = chords[bar % 4], roots[bar % 4]
            for k, m in enumerate(ch):
                st.add(t + 0.012 * k, rhodes(m, 2.2), 0.045 * vol)
            st.add(t + beat * 2.5, rhodes(ch[1] + 12, 0.8), 0.025 * vol)
            for q, m in ((0, r), (1.5, r + 7), (2, r + 12), (3, r + 7)):
                if t + q * beat < z:
                    st.add(t + q * beat, bass(m), 0.16 * vol)
            for q in range(4):
                tq = t + q * beat
                if tq >= z:
                    break
                if q in (0, 2):
                    st.add(tq, kick(), 0.22 * vol)
                if q in (1, 3):
                    st.add(tq, snare(), 0.07 * vol)
                st.add(tq, brush(), 0.03 * vol)
                st.add(tq + beat * 0.5 + 0.03, brush(0.1), 0.02 * vol)   # a lazy swung offbeat
            t += beat * 4
            bar += 1

    groove(0.0, b["closeIn"] - 0.1)
    # Under the note: only a glockenspiel, one rising note per line she wrote.
    for k, at in enumerate(lines):
        st.add(at, glock([76, 79, 81, 84, 88][k % 5]), 0.06)
    # Back on him: two soft Rhodes chords hang until the punchline, then silence for the buzzer.
    st.add(b["unfold"], sum_pad([65, 69, 72, 76], 1.6), 0.04)
    # The grin brings the groove back, through the vote; one last chord for the end card.
    groove(b["grin"], b["endcard"])
    st.add(b["endcard"] + 0.2, sum_pad([60, 64, 67, 71, 74], 4.0), 0.05)
    st.add(b["endcard"] + 0.9, glock(88), 0.06)
    st.add(b["endcard"] + 1.25, glock(84), 0.05)


def sum_pad(ms: list[int], d: float) -> np.ndarray:
    return sum(rhodes(m, d) for m in ms)


def sfx(st: Stem, b: dict, spec: dict) -> None:
    t = 0.18
    while t < b["arrive"]:   # footsteps on tile
        st.add(t, step(), 0.25)
        t += 0.42
    st.add(b["set"], thud(80), 0.35)
    st.add(b["set"] + 0.05, rustle(0.25), 0.12)
    st.add(b["pick"], rustle(0.35), 0.2)
    st.add(b["closeIn"] - 0.1, whoosh(0.45), 0.25)
    st.add(b["closeOut"] - 0.4, whoosh(0.45, False), 0.2)
    st.add(b["unfold"] + 0.15, whoosh(0.3), 0.18)
    st.add(b["unfold"] + 0.35, rustle(0.3), 0.2)
    st.add(b["shirtNote"], buzzer(), 0.22)   # the punchline: "this was white."
    st.add(b["facepalm"] + 0.05, slap(), 0.3)
    st.add(b["pen"] + 0.1, tick(), 0.15)    # pen click
    st.add(b["pen"] + 0.22, tick(), 0.12)
    for s in spec["strips"]:
        if s["from"] > 0:
            st.add(s["from"] + 0.1, stamp(), 0.35)
    st.add(b["choice"] - 0.1, whoosh(0.5), 0.25)
    st.add(b["endcard"] + 1.35, stamp(), 0.35)
    for key in ("cardA", "cardB", "comment"):
        st.add(b[key] + 0.05, stamp(), 0.45)
    st.add(b["choice"] + 0.3, stamp(), 0.35)
    st.add(b["endcard"] - 0.3, whoosh(0.5), 0.25)
    for k in (0.35, 0.65, 0.95):
        st.add(b["endcard"] + k, stamp(), 0.4)
    d = spec["duration"] - b["endcard"]
    tr = tt(d)
    drum = lowpass(rng.uniform(-1, 1, len(tr)), 0.03) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.4 * tr)) * np.minimum(1, tr / 0.5) * np.minimum(1, (d - tr) / 0.6)
    st.add(b["endcard"], drum, 0.5)


def from_spec(r: Stem, m: Stem, s: Stem, spec: dict) -> None:
    """Parts 2 on: the spec's "audio" block lists every cue, so the episode code stays the source of truth."""
    a, b, dur = spec["audio"], spec["beats"], spec["duration"]
    room(r, b, dur)
    beat = 60 / 84
    chords = [[65, 69, 72, 76], [64, 67, 71, 74], [62, 65, 69, 72], [60, 64, 67, 71]]
    roots = [41, 40, 38, 36]
    for lo, hi in a["groove"]:
        bar, t = 0, lo
        while t < hi - 0.05:
            ch, rt = chords[bar % 4], roots[bar % 4]
            for k, n in enumerate(ch):
                m.add(t + 0.012 * k, rhodes(n, 2.2), 0.045)
            for q, n in ((0, rt), (1.5, rt + 7), (2, rt + 12), (3, rt + 7)):
                if t + q * beat < hi:
                    m.add(t + q * beat, bass(n), 0.16)
            for q in range(4):
                tq = t + q * beat
                if tq >= hi:
                    break
                if q in (0, 2):
                    m.add(tq, kick(), 0.22)
                if q in (1, 3):
                    m.add(tq, snare(), 0.07)
                m.add(tq, brush(), 0.03)
                m.add(tq + beat * 0.5 + 0.03, brush(0.1), 0.02)
            t += beat * 4
            bar += 1
    # A sad, descending little figure when the notes stop.
    if "sadFrom" in a:
        for k, n in enumerate((72, 71, 69, 65)):
            m.add(a["sadFrom"] + k * 0.45, rhodes(n, 1.6), 0.05)
    for k, at in enumerate(a.get("glock", [])):
        m.add(at, glock([76, 79, 81, 84, 88][k % 5]), 0.06)
    m.add(b["endcard"] + 0.2, sum_pad([60, 64, 67, 71, 74], 4.0), 0.05)
    m.add(b["endcard"] + 0.9, glock(88), 0.06)
    for lo, hi in a.get("steps", []):
        t = lo + 0.1
        while t < hi:
            s.add(t, step(), 0.25)
            t += 0.42
    for at in a.get("stamps", []):
        s.add(at, stamp(), 0.4)
    for at in a.get("whooshes", []):
        s.add(at, whoosh(0.45), 0.22)
    for at in a.get("rustles", []):
        s.add(at, rustle(0.3), 0.2)
    for at in a.get("slapsOn", []):
        s.add(at + 0.05, slap(), 0.25)
    if "plonk" in a:   # the bleach bottle set on the dryer
        s.add(a["plonk"], thud(110, 0.25), 0.3)
    if "tumbleweed" in a:   # a thin wind as the lint rolls by
        d = 2.0
        tr = tt(d)
        wind = whoosh(d) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.8 * tr))
        s.add(a["tumbleweed"], wind, 0.35)
        s.add(a["tumbleweed"], 0.2 * np.sin(2 * np.pi * (900 + 300 * np.sin(2 * np.pi * 0.7 * tr)) * tr) * np.sin(np.pi * tr / d), 0.15)
    if "coin" in a:   # a quarter rolling across tile, wobbling faster and faster, then flat
        at = a["coin"]
        for k in range(14):   # rolling: soft ticks thinning out
            s.add(at + 0.1 * k * (1 + 0.04 * k), tick() * 0.5, 0.12)
        for k in range(9):   # the wobble: rings closing in
            tk = at + 1.45 - 0.5 * (0.72 ** k)
            tr = tt(0.12)
            s.add(tk, np.sin(2 * np.pi * 2900 * tr) * np.exp(-tr * 40), 0.05 + 0.01 * k)
        tr = tt(0.6)
        s.add(at + 1.48, (np.sin(2 * np.pi * 2900 * tr) + 0.5 * np.sin(2 * np.pi * 4350 * tr)) * np.exp(-tr * 9), 0.14)
    if "clockTicks" in a:   # the wall clock, the only thing moving while he waits
        lo, hi = a["clockTicks"]
        t, k = lo, 0
        while t < hi:
            s.add(t, tick(), 0.18 if k % 2 else 0.13)
            t += 0.5
            k += 1
    if "rewind" in a:   # tape rewind: a warbling chirp racing upward, then the drum spinning backwards
        lo, hi = a["rewind"]
        d = hi - lo
        tr = tt(d)
        f = 300 + 2200 * (tr / d) ** 1.5
        chirp = np.sin(2 * np.pi * np.cumsum(f) / RATE) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 14 * tr)))
        s.add(lo, chirp * np.minimum(1, tr / 0.05) * np.minimum(1, (d - tr) / 0.1), 0.12)
        s.add(lo, lowpass(rng.uniform(-1, 1, len(tr)), 0.05) * np.minimum(1, tr / 0.2), 0.4)
    if "pump" in a:
        s.add(a["pump"], whoosh(0.25), 0.25)
        s.add(a["pump"] + 0.2, glock(91), 0.12)
    d = dur - b["endcard"]
    tr = tt(d)
    drum = lowpass(rng.uniform(-1, 1, len(tr)), 0.03) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.4 * tr)) * np.minimum(1, tr / 0.5) * np.minimum(1, (d - tr) / 0.6)
    s.add(b["endcard"], drum, 0.5)


def write(path: Path, x: np.ndarray, peak: float = 0.8) -> None:
    x = x * min(1.0, peak / max(1e-9, np.abs(x).max()))
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
    print(f"wrote {path}")


if __name__ == "__main__":
    ep = sys.argv[1] if len(sys.argv) > 1 else "dryer-ep1"
    spec = json.loads((ROOT / "specs" / "stories" / f"{ep}.json").read_text())
    b, dur = spec["beats"], spec["duration"]
    r, m, s = Stem(dur), Stem(dur), Stem(dur)
    if "audio" in spec:
        from_spec(r, m, s, spec)
    else:
        room(r, b, dur); music(m, b, dur, [ln["at"] for ln in spec["note1"]["lines"]]); sfx(s, b, spec)
    (ROOT / "public" / "audio").mkdir(parents=True, exist_ok=True)
    write(ROOT / f"public/audio/{ep}-room.wav", r.buf, 0.45)
    write(ROOT / f"public/audio/{ep}-music.wav", m.buf)
    write(ROOT / f"public/audio/{ep}-sfx.wav", s.buf)
