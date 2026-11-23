"""Sound for "Same Bag" (season 10), driven by the "audio" block of specs/stories/<id>.json.

    python3 generate_bag_audio.py bag-ep1

Silent story, no voices, numpy only. One mixed file public/audio/<id>.wav: room tone + belt rumble, an easy 4/4 groove at the spec bpm
(ducks under musicDuck), sfx: swipe ticks, wheel clacks, tag slides, pen caps, scrawl, bag thumps, laugh sting, phone taps, gulp,
phone buzz, belt stop, board flip, belt whoosh, cliff sting, card pops, stamps, end chime.
"""
from __future__ import annotations

import json
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).parent
RATE = 44100
rng = np.random.default_rng(2020)


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
def nylon(m, d=0.6):
    t, f = tt(d), midi(m)
    return (np.sin(2 * np.pi * f * t) * env(t, 0.003, 0.22) + 0.3 * np.sin(2 * np.pi * 2 * f * t) * env(t, 0.002, 0.1)
            + 0.1 * np.sin(2 * np.pi * 3 * f * t) * env(t, 0.001, 0.05))


def bass(m, d=0.45):
    t, f = tt(d), midi(m)
    return np.sin(2 * np.pi * f * t) * env(t, 0.01, 0.25) + 0.2 * np.sin(2 * np.pi * 2 * f * t) * env(t, 0.01, 0.1)


def shaker(vol=1.0):
    t = tt(0.07)
    return fft_bp(noise(0.07), 5000, 12000) * env(t, 0.004, 0.02) * vol


def bell(m, d=1.6):
    t, f = tt(d), midi(m)
    return np.sin(2 * np.pi * f * t) * env(t, 0.002, 0.5) + 0.3 * np.sin(2 * np.pi * f * 2.76 * t) * env(t, 0.001, 0.2)


def tick():
    t = tt(0.03)
    return (np.sin(2 * np.pi * 2600 * t) * 0.4 + noise(0.03) * 0.4) * env(t, 0.0005, 0.006)


def chip_flick():
    t = tt(0.12)
    return fft_bp(noise(0.12), 2500, 9000) * env(t, 0.001, 0.025) * 1.2 + np.sin(2 * np.pi * 900 * t) * env(t, 0.001, 0.01) * 0.2


def riffle(d=0.45):
    n = int(d / 0.022)
    s = np.zeros(int(RATE * (d + 0.05)))
    for k in range(n):
        c = fft_bp(noise(0.02), 2000, 8000) * env(tt(0.02), 0.0005, 0.005)
        a = int(k * 0.022 * RATE); s[a:a + len(c)] += c[:len(s) - a] * (0.6 + 0.4 * rng.random())
    return s * 1.3


def slide(d=0.5):
    t = tt(d)
    return fft_bp(noise(d), 600, 3500) * np.sin(np.pi * np.clip(t / d, 0, 1)) * 0.8


def scrawl(d):
    t = tt(d)
    strokes = np.abs(np.sin(2 * np.pi * (6 + 1.5 * np.sin(2 * np.pi * 0.7 * t)) * t)) ** 0.6
    return fft_bp(noise(d), 1800, 6500) * strokes * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.05) * 0.9


def pencil_swing():
    t = tt(0.5)
    link = sum(np.sin(2 * np.pi * f * t) * env(t, 0.0005, 0.03) for f in (3400, 4300, 5200)) * 0.12
    return link * (1 + np.sin(2 * np.pi * 14 * t)) + fft_bp(noise(0.5), 3000, 9000) * env(t, 0.002, 0.12) * 0.25


def laugh_sting():
    s = np.zeros(int(RATE * 1.2))
    for k, m in enumerate([76, 79, 83, 88]):
        b = nylon(m, 0.4); a = int(k * 0.07 * RATE); s[a:a + len(b)] += b[:len(s) - a]
    return s


def phone_tap():
    t = tt(0.1)
    return np.sin(2 * np.pi * 180 * t) * env(t, 0.001, 0.025) * 0.9 + fft_lp(noise(0.1), 1200) * env(t, 0.001, 0.015) * 0.7


def gulp():
    t = tt(0.3)
    f = 220 - 120 * np.clip(t / 0.18, 0, 1)
    return np.sin(2 * np.pi * np.cumsum(f) / RATE) * env(t, 0.004, 0.08) * 0.8


def thumb_tick():
    t = tt(0.06)
    return fft_lp(noise(0.06), 1800) * env(t, 0.001, 0.012) * 1.1 + np.sin(2 * np.pi * 420 * t) * env(t, 0.001, 0.015) * 0.4


def intercom_ding():
    t = tt(1.4)
    return (np.sin(2 * np.pi * 1318 * t) + 0.5 * np.sin(2 * np.pi * 1760 * t)) * env(t, 0.002, 0.45) * 0.5 + fft_bp(noise(1.4), 1500, 3000) * env(t, 0.001, 0.02) * 0.1


def rattle(d):
    t = tt(d)
    knocks = np.abs(np.sin(2 * np.pi * 11.5 * t)) ** 6 * (0.7 + 0.3 * np.sin(2 * np.pi * 3.1 * t))
    body = fft_bp(noise(d), 180, 2600) * knocks * 0.9
    ring = sum(np.sin(2 * np.pi * f * t) for f in (1900, 2750)) * 0.05 * np.abs(np.sin(2 * np.pi * 23 * t)) ** 4
    rumble = np.sin(2 * np.pi * 58 * t) * 0.12 * (1 + np.sin(2 * np.pi * 23 * t))
    return (body + ring + rumble) * np.minimum(1, t / 0.08) * np.minimum(1, (d - t) / 0.12)


def clunk():
    t = tt(0.5)
    return (np.sin(2 * np.pi * 85 * t) * env(t, 0.002, 0.12) + fft_bp(noise(0.5), 300, 2500) * env(t, 0.001, 0.03) * 0.8
            + np.sin(2 * np.pi * 1500 * t) * env(t, 0.001, 0.1) * 0.12)


def buzz():
    t = tt(0.26)
    return np.sign(np.sin(2 * np.pi * 150 * t)) * 0.25 * (np.sin(2 * np.pi * 40 * t) > -0.3) * np.minimum(1, t / 0.01) * np.minimum(1, (0.26 - t) / 0.02) + fft_lp(noise(0.26), 700) * 0.2


def whoosh(d=0.7):
    t = tt(d)
    k = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    return (fft_bp(noise(d), 200, 3200) * k * 1.6) + np.pad(riffle(d), (0, len(t)))[:len(t)] * 0.5


def pop(f=700):
    t = tt(0.2)
    return np.sin(2 * np.pi * (f * t + 1200 * t * t)) * env(t, 0.002, 0.07) * 0.6


def stamp():
    t = tt(0.2)
    return np.sin(2 * np.pi * 110 * t) * env(t, 0.002, 0.05) * 0.6 + fft_lp(noise(0.2), 900) * env(t, 0.001, 0.02) * 0.35



def thump():
    t = tt(0.3)
    return np.sin(2 * np.pi * 70 * t) * env(t, 0.002, 0.09) + fft_lp(noise(0.3), 600) * env(t, 0.001, 0.03) * 0.6


def clack():
    t = tt(0.14)
    return (np.sin(2 * np.pi * 1100 * t) * env(t, 0.0005, 0.012) + fft_bp(noise(0.14), 800, 4000) * env(t, 0.0005, 0.02)) * 0.9


def belt_rumble(d):
    t = tt(d)
    return (np.sin(2 * np.pi * 52 * t) * 0.14 * (1 + 0.3 * np.sin(2 * np.pi * 1.8 * t)) + fft_bp(noise(d), 80, 500) * 0.12
            + fft_bp(noise(d), 1500, 4000) * 0.03 * (np.abs(np.sin(2 * np.pi * 5 * t)) ** 3)) * np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.3)


def belt_stop():
    t = tt(0.9)
    return (np.sin(2 * np.pi * (60 - 35 * np.clip(t / 0.8, 0, 1)) * t) * env(t, 0.005, 0.3) * 0.8 + fft_bp(noise(0.9), 100, 900) * env(t, 0.002, 0.15) * 0.6)


def board_flip():
    s = np.zeros(int(RATE * 0.6))
    for k in range(9):
        c = clack(); a = int(k * 0.04 * RATE); s[a:a + len(c)] += c[:len(s) - a] * (0.9 - 0.06 * k)
    return s


def cliff_sting():
    s = np.zeros(int(RATE * 1.4))
    for k, m in enumerate([64, 61, 58]):
        b = bell(m, 1.2); a = int(k * 0.16 * RATE); s[a:a + len(b)] += b[:len(s) - a] * 0.6
    return s


def flap_whoosh():
    t = tt(0.7)
    k = np.sin(np.pi * np.clip(t / 0.7, 0, 1)) ** 1.5
    return fft_bp(noise(0.7), 150, 2600) * k * 1.4 + fft_bp(noise(0.7), 3000, 8000) * k * 0.3 * (np.abs(np.sin(2 * np.pi * 17 * t)) ** 2)


def flower_droop():
    t = tt(0.9)
    f = 520 * np.exp(-t * 2.2)
    sad = np.sin(2 * np.pi * np.cumsum(f) / RATE) * env(t, 0.01, 0.45) * 0.5
    plop = np.sin(2 * np.pi * 95 * t) * env(t, 0.002, 0.07) * 0.5
    return sad + np.pad(plop, (int(0.38 * RATE), 0))[:len(t)] * 0.9


def zip_jam():
    t = tt(0.32)
    rasp = fft_bp(noise(0.32), 2500, 7500) * (np.abs(np.sin(2 * np.pi * 38 * t)) ** 1.2) * np.minimum(1, (0.26 - t).clip(0) / 0.05) * 0.9
    stop = np.sin(2 * np.pi * 240 * t) * env(np.maximum(t - 0.26, 0), 0.001, 0.03) * (t > 0.26) * 0.7
    return rasp + stop


def jog_pat():
    t = tt(0.12)
    return (np.sin(2 * np.pi * 150 * t) * env(t, 0.001, 0.025) + fft_lp(noise(0.12), 900) * env(t, 0.001, 0.02) * 0.6) * 0.8


def belt_rewind(d=1.0):
    t = tt(d)
    k = np.clip(t / d, 0, 1)
    f = 180 + 1500 * (1 - k) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(f) / RATE) * 0.2 * np.sin(np.pi * k)
    fl = fft_bp(noise(d), 300, 3500) * (np.abs(np.sin(2 * np.pi * 22 * t)) ** 2) * np.sin(np.pi * k) * 0.9
    return tone + fl


def tag_tap():
    t = tt(0.9)
    return (np.sin(2 * np.pi * 2093 * t) * env(t, 0.0005, 0.25) + 0.5 * np.sin(2 * np.pi * 3136 * t) * env(t, 0.0005, 0.12)) * 0.45 + fft_bp(noise(0.9), 3000, 9000) * env(t, 0.0005, 0.006) * 0.5


def pen_cap():
    t = tt(0.12)
    return (np.sin(2 * np.pi * 1700 * t) * env(t, 0.0005, 0.02) + fft_bp(noise(0.12), 1500, 6000) * env(t, 0.0005, 0.01)) * 0.8


# --- stems -------------------------------------------------------------------------------------
def room(st: Stem, a):
    n = len(st.buf); tm = np.arange(n) / RATE
    hum = (np.sin(2 * np.pi * 120 * tm) + 0.4 * np.sin(2 * np.pi * 240 * tm)) * 0.008
    air = fft_bp(rng.uniform(-1, 1, n), 150, 900) * 0.03
    st.buf += hum + air
    for lo, hi in a.get("beltRumble", []):
        st.add(lo, belt_rumble(hi - lo), 1.0)


def music(st: Stem, a):
    beat = 60.0 / a["bpm"]
    bar = beat * 4
    prog = [(40, [60, 64, 67, 71]), (45, [57, 60, 64, 67]), (38, [62, 65, 69, 72]), (43, [59, 62, 67, 71])]   # Cmaj7 Am7 Dm7 G
    mel = [79, 83, 84, 83, 79, 76, 77, 79, 74, 76, 79, 72]
    for lo, hi in a["groove"]:
        k = int(np.ceil(lo / bar))
        while k * bar < hi - 0.01:
            t0 = k * bar
            root, chord = prog[k % 4]
            for off in (0.0, 1.5, 2.5, 3.5):
                st.add(t0 + off * beat, bass(root + (7 if off == 2.5 else 0)), 0.5)
            for off in (0.5, 2.0, 3.0):
                for m in chord:
                    st.add(t0 + off * beat + rng.uniform(0, 0.012), nylon(m, 0.35), 0.1)
            for j in range(16):
                st.add(t0 + j * beat / 4, shaker(0.5 if j % 4 == 2 else 0.25), 0.35)
            if k % 2 == 1:
                for j in range(3):
                    st.add(t0 + (j * 1.5 + 0.5) * beat, nylon(mel[(k // 2 * 3 + j) % len(mel)], 0.5), 0.2)
            k += 1
    for lo, hi in a["musicDuck"]:
        i0, i1 = int(lo * RATE), int(hi * RATE)
        fade = int(0.15 * RATE)
        g = np.ones(len(st.buf)); g[i0:i1] = 0.0
        g[i0 - fade:i0] = np.linspace(1, 0, fade); g[i1:i1 + fade] = np.linspace(0, 1, fade)
        st.buf *= g


def sfx(st: Stem, a):
    for t in a["swipeTicks"]: st.add(t, tick(), 0.6)
    for t in a["wheelClacks"]: st.add(t, clack(), 0.6)
    for t in a["tagSlides"]: st.add(t, slide(0.5), 0.5)
    for t in a["penCaps"]: st.add(t, pen_cap(), 0.7)
    for lo, hi in a["scrawl"]: st.add(lo, scrawl(hi - lo), 0.55)
    for t in a["bagThumps"]: st.add(t, thump(), 0.8)
    for t in a["laughSting"]: st.add(t, laugh_sting(), 0.5)
    for t in a["phoneTap"]:
        st.add(t, phone_tap(), 0.9); st.add(t + 0.012, phone_tap(), 0.7)
    for t in a.get("ribbonTie", []): st.add(t, slide(0.35), 0.5)
    for t in a.get("gulp", []): st.add(t, gulp(), 0.8)
    for t in a["phoneBuzz"]: st.add(t, buzz(), 0.7)
    for t in a.get("beltStop", []): st.add(t, belt_stop(), 0.9)
    for t in a.get("boardFlip", []): st.add(t + 0.1, board_flip(), 0.6)
    for t in a["beltWhoosh"]: st.add(t - 0.05, flap_whoosh(), 0.8)
    for t in a.get("cliffSting", []): st.add(t, cliff_sting(), 0.6)
    for t in a.get("flowerDroop", []): st.add(t, flower_droop(), 0.8)
    for t in a.get("zipJam", []): st.add(t, zip_jam(), 0.8)
    for t in a.get("jogPats", []): st.add(t, jog_pat(), 0.7)
    for t in a.get("beltRewind", []): st.add(t, belt_rewind(1.0), 0.9)
    for t in a.get("pops", []): st.add(t, pop(900), 0.9)
    for t in a.get("ding", []): st.add(t, intercom_ding(), 0.7)
    for t in a.get("tagTap", []): st.add(t, tag_tap(), 0.7)
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
    ep = sys.argv[1] if len(sys.argv) > 1 else "bag-ep1"
    spec = json.loads((ROOT / "specs" / "stories" / f"{ep}.json").read_text())
    a, dur = spec["audio"], spec["duration"]
    r, m, s = Stem(dur), Stem(dur), Stem(dur)
    room(r, a); music(m, a); sfx(s, a)
    mix = r.buf * 1.0 + m.buf * 0.9 + s.buf * 1.0
    (ROOT / "public" / "audio").mkdir(parents=True, exist_ok=True)
    write(ROOT / f"public/audio/{ep}.wav", mix)
