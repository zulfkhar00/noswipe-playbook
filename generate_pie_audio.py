"""Sound for "Pie for Two" (season 11), driven by the "audio" block of specs/stories/<id>.json.

    python3 generate_pie_audio.py pie-ep1

Silent story, no voices, numpy only, no samples. One mixed file public/audio/<id>.wav: fridge hum + grill sizzle room tone, a late-night
jukebox doo-wop ballad in 12/8 (tremolo guitar triplet arpeggios, upright bass, brushed snare on 2 and 4, soft ooh pad, finger snaps)
that ducks to a single celesta note for the shared moment, and foley: swipe ticks, case hum, plate clinks/scrapes, napkin pulls/slides,
crayon scrawl/draw, cream splat, laugh sting, phone buzz, mug clunks, fork tink, gulp, slice whoosh, card pops, stamps, end chime.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

import generate_bag_audio as g
from generate_bag_audio import (RATE, Stem, bell, bass, buzz, clack, env, fft_bp, fft_lp, gulp, laugh_sting, midi, noise, nylon, pop, riffle,
                                scrawl, slide, stamp, tick, tt, whoosh, write)

ROOT = Path(__file__).parent
g.rng = np.random.default_rng(1123)
rng = g.rng


def tremolo_gtr(m, d=0.5):
    t, f = tt(d), midi(m)
    trem = 0.75 + 0.25 * np.sin(2 * np.pi * 5.5 * t)
    return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3 * f * t)) * env(t, 0.004, 0.3) * trem


def upright(m, d=0.6):
    t, f = tt(d), midi(m)
    return (np.sin(2 * np.pi * f * t) * env(t, 0.006, 0.3) + 0.25 * np.sin(2 * np.pi * 2 * f * t) * env(t, 0.004, 0.12)) + fft_lp(noise(d), 500) * env(t, 0.001, 0.015) * 0.2


def brush(d=0.22):
    t = tt(d)
    return fft_bp(noise(d), 3000, 9000) * np.minimum(1, t / 0.03) * np.exp(-t / 0.09) * 0.8


def snap():
    t = tt(0.07)
    return fft_bp(noise(0.07), 1800, 6000) * env(t, 0.0005, 0.012) * 1.2 + np.sin(2 * np.pi * 1100 * t) * env(t, 0.0005, 0.01) * 0.3


def ooh(m, d=3.0):
    t, f = tt(d), midi(m)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5 * t)
    s = (np.sin(2 * np.pi * f * vib * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * np.minimum(1, t / 0.5) * np.minimum(1, (d - t) / 0.5)
    return s * 0.5


def celesta(m, d=2.0):
    t, f = tt(d), midi(m)
    return np.sin(2 * np.pi * f * t) * env(t, 0.002, 0.7) + 0.4 * np.sin(2 * np.pi * 4 * f * t) * env(t, 0.001, 0.2) + 0.2 * np.sin(2 * np.pi * 6 * f * t) * env(t, 0.001, 0.1)


def plate_clink():
    t = tt(0.6)
    return sum(np.sin(2 * np.pi * f * t) * env(t, 0.0008, d) for f, d in ((2400, 0.18), (3650, 0.12), (5200, 0.07))) * 0.35 + fft_bp(noise(0.6), 3000, 8000) * env(t, 0.0005, 0.008) * 0.4


def plate_scrape(d=0.4):
    t = tt(d)
    return fft_bp(noise(d), 700, 4200) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.7 * (0.7 + 0.3 * np.sin(2 * np.pi * 40 * t)) * 0.9 + np.sin(2 * np.pi * 140 * t) * 0.08 * np.sin(np.pi * np.clip(t / d, 0, 1))


def napkin_pull():
    t = tt(0.4)
    return fft_bp(noise(0.4), 1500, 7000) * np.sin(np.pi * np.clip(t / 0.4, 0, 1)) ** 0.8 * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 21 * t))) * 0.8


def crayon(d):
    t = tt(d)
    strokes = np.abs(np.sin(2 * np.pi * (4.5 + np.sin(2 * np.pi * 0.6 * t)) * t)) ** 0.5
    return fft_bp(noise(d), 900, 5000) * strokes * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.06) * 0.8 + fft_lp(noise(d), 300) * 0.08 * strokes


def splat():
    t = tt(0.4)
    return fft_bp(noise(0.4), 200, 2200) * env(t, 0.002, 0.07) * 1.1 + np.sin(2 * np.pi * (260 - 160 * np.clip(t / 0.2, 0, 1)) * t) * env(t, 0.002, 0.08) * 0.6


def mug_clunk():
    t = tt(0.5)
    return (np.sin(2 * np.pi * 190 * t) * env(t, 0.001, 0.09) * 0.8 + fft_bp(noise(0.5), 500, 4000) * env(t, 0.0005, 0.02) * 0.7
            + np.sin(2 * np.pi * 1400 * t) * env(t, 0.001, 0.14) * 0.2 + np.sin(2 * np.pi * 2300 * t) * env(t, 0.001, 0.1) * 0.12)


def fork_tink():
    t = tt(0.7)
    return (np.sin(2 * np.pi * 3520 * t) * env(t, 0.0005, 0.22) + 0.5 * np.sin(2 * np.pi * 5300 * t) * env(t, 0.0005, 0.1)) * 0.4


def cup_clink():
    t = tt(0.9)
    return (np.sin(2 * np.pi * 2650 * t) * env(t, 0.0006, 0.2) + 0.6 * np.sin(2 * np.pi * 3980 * t) * env(t, 0.0006, 0.14)
            + 0.3 * np.sin(2 * np.pi * 5750 * t) * env(t, 0.0006, 0.08)) * 0.45 + fft_bp(noise(0.9), 1800, 7000) * env(t, 0.0003, 0.012) * 0.4


def case_hum(d):
    t = tt(d)
    return (np.sin(2 * np.pi * 110 * t) * 0.12 + np.sin(2 * np.pi * 220 * t) * 0.05 + fft_bp(noise(d), 300, 1200) * 0.05) * np.minimum(1, t / 0.15) * np.minimum(1, (d - t) / 0.2)


def slice_whoosh():
    t = tt(0.55)
    k = np.clip(t / 0.55, 0, 1)
    return fft_bp(noise(0.55), 300, 5000) * np.sin(np.pi * k) ** 1.2 * 1.3 + np.sin(2 * np.pi * np.cumsum(200 + 900 * k) / RATE) * 0.1 * np.sin(np.pi * k)


def phone_buzz_muted():
    return buzz() * 0.8


def growl(d):
    t = tt(d)
    f = 62 + 18 * np.sin(2 * np.pi * 3.2 * t)
    body = np.sin(2 * np.pi * np.cumsum(f) / RATE) * 0.7 + fft_lp(noise(d), 260) * 1.2
    return body * (0.55 + 0.45 * np.abs(np.sin(2 * np.pi * 11 * t))) * np.minimum(1, t / 0.08) * np.minimum(1, (d - t) / 0.15)


def mug_rattle(d):
    t = tt(d)
    ticks = np.abs(np.sin(2 * np.pi * 17 * t)) ** 12
    return (fft_bp(noise(d), 1500, 5000) * ticks * 0.9 + np.sin(2 * np.pi * 2100 * t) * ticks * 0.12) * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.2)


def fork_clink():
    t = tt(0.5)
    return (np.sin(2 * np.pi * 4200 * t) * env(t, 0.0004, 0.12) + 0.6 * np.sin(2 * np.pi * 6100 * t) * env(t, 0.0004, 0.07)
            + 0.3 * np.sin(2 * np.pi * 7900 * t) * env(t, 0.0004, 0.04)) * 0.4 + fft_bp(noise(0.5), 3500, 9000) * env(t, 0.0003, 0.01) * 0.4


def kazoo(m, d=0.3):
    t, f = tt(d), midi(m)
    ph = np.cumsum(f * (1 + 0.014 * np.sin(2 * np.pi * 6.2 * t))) / RATE
    saw = sum(np.sin(2 * np.pi * k * ph) / k for k in range(1, 9))
    return (fft_bp(saw, 500, 3200) * 0.9 + fft_bp(noise(d), 1500, 4200) * 0.12) * np.minimum(1, t / 0.01) * np.exp(-t / (d * 0.9)) * np.minimum(1, (d - t) / 0.02)


def tuba(m, d=0.3):
    t, f = tt(d), midi(m)
    return (np.sin(2 * np.pi * f * t) + 0.55 * np.sin(2 * np.pi * 2 * f * t) + 0.3 * np.sin(2 * np.pi * 3 * f * t)) * np.minimum(1, t / 0.015) * np.exp(-t / (d * 0.8)) + fft_lp(noise(d), 500) * 0.12 * np.exp(-t / 0.05)


def pah(chord, d=0.16):
    t = tt(d)
    return sum(np.sin(2 * np.pi * midi(m) * t) for m in chord) * 0.25 * env(t, 0.003, 0.05) + fft_bp(noise(d), 1500, 6000) * env(t, 0.001, 0.02) * 0.25


def coin_drop():
    t = tt(0.9)
    ting = (np.sin(2 * np.pi * 3100 * t) * env(t, 0.0005, 0.12) + 0.6 * np.sin(2 * np.pi * 4700 * t) * env(t, 0.0005, 0.08)) * 0.35
    slot = fft_lp(noise(0.9), 900) * env(t, 0.001, 0.03) * 0.5 * (t > 0.28)
    u = np.maximum(t - 0.3, 0)
    clunk = np.sin(2 * np.pi * 120 * u) * env(u, 0.002, 0.08) * 0.5 * (t > 0.3)
    return ting + slot + clunk


def splash():
    t = tt(0.5)
    return fft_bp(noise(0.5), 400, 3500) * env(t, 0.004, 0.09) * 0.9 + np.sin(2 * np.pi * (320 + 500 * t) * t) * env(t, 0.002, 0.06) * 0.4


def slap():
    t = tt(0.4)
    return fft_bp(noise(0.4), 200, 4500) * env(t, 0.0006, 0.04) * 1.2 + np.sin(2 * np.pi * 85 * t) * env(t, 0.001, 0.09) * 0.7


def scratch():
    t = tt(0.55)
    k = np.clip(t / 0.55, 0, 1)
    return fft_bp(noise(0.55), 800, 6000) * (0.5 + 0.5 * np.sin(2 * np.pi * (14 - 10 * k) * t)) * np.sin(np.pi * k) ** 0.6 * 0.9


def tuba_blat():
    t = tt(0.4)
    return np.sign(np.sin(2 * np.pi * 70 * t)) * 0.4 * env(t, 0.01, 0.18) + fft_lp(noise(0.4), 300) * 0.4 * env(t, 0.01, 0.1)


def room(st: Stem, a):
    n = len(st.buf); tm = np.arange(n) / RATE
    fridge = (np.sin(2 * np.pi * 60 * tm) * 0.5 + np.sin(2 * np.pi * 120 * tm) * 0.3 + np.sin(2 * np.pi * 180 * tm) * 0.08) * 0.014
    sizzle = fft_bp(rng.uniform(-1, 1, n), 2500, 9000) * 0.02 * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 0.37 * tm)))
    air = fft_bp(rng.uniform(-1, 1, n), 120, 700) * 0.02
    st.buf += fridge + sizzle + air
    for z in a.get("neonZaps", []):
        st.add(z, fft_bp(noise(0.08), 3000, 9000) * env(tt(0.08), 0.0005, 0.02) * 0.5, 1.0)
    for lo, hi in a.get("neonBuzz", []):
        st.add(lo, np.sin(2 * np.pi * 120 * tt(hi - lo)) * 0.02 * np.minimum(1, tt(hi - lo) / 0.1) + fft_bp(noise(hi - lo), 2000, 6000) * 0.012, 1.0)


def music(st: Stem, a):
    beat = 60.0 / a["bpm"]       # dotted quarter in 12/8
    e8 = beat / 3
    bar = beat * 4
    prog = [(36, [60, 64, 67]), (33, [57, 60, 64]), (41, [65, 69, 72]), (43, [62, 67, 71])]   # C  Am  F  G
    pad = [[64, 67, 72], [64, 69, 72], [65, 69, 72], [62, 67, 71]]
    gg = a.get("grooveGain", 1.0)
    pb = 60.0 / a.get("polkaBpm", 132)
    mel = [72, 72, 76, 72, 79, 77, 74, 71, 72, 76, 79, 84, 83, 81, 79, 77]
    for lo, hi in a.get("polka", []):
        n = 0
        while lo + n * pb * 0.5 < hi - 0.05:
            tn = lo + n * pb * 0.5
            st.add(tn, kazoo(mel[n % len(mel)] + (1 if n % 7 == 6 else 0), pb * 0.45), 0.5)
            if n % 2 == 0:
                st.add(tn, tuba([36, 43][(n // 2) % 2], pb * 0.45), 0.55)
            else:
                st.add(tn, pah([60, 64, 67]), 0.5)
            n += 1
    for lo, hi in a["groove"]:
        k = int(np.ceil(lo / bar))
        while k * bar < hi - 0.01:
            t0 = k * bar
            root, chord = prog[k % 4]
            for off in (0, 2):
                st.add(t0 + off * beat, upright(root + 12), 0.55 * gg)
            st.add(t0 + 3.0 * beat, upright(root + 12 + (7 if k % 2 else 0)), 0.4 * gg)
            for j in range(12):
                m = chord[[0, 1, 2][j % 3]] + 12
                st.add(t0 + j * e8 + rng.uniform(0, 0.006), tremolo_gtr(m, 0.45), 0.09 * gg)
            for off in (1, 3):
                st.add(t0 + off * beat, brush(), 0.5 * gg)
                st.add(t0 + off * beat, snap(), 0.22 * gg)
            for j in range(4):
                st.add(t0 + j * beat, brush(0.1), 0.13 * gg)
            if k % 2 == 0:
                for m in pad[k % 4]:
                    st.add(t0, ooh(m, bar * 2 + 0.2), 0.045 * gg)
            k += 1
    for lo, hi in a["musicDuck"]:
        i0, i1 = int(lo * RATE), int(hi * RATE)
        fade = int(0.2 * RATE)
        gain = np.ones(len(st.buf)); gain[i0:i1] = 0.0
        gain[i0 - fade:i0] = np.linspace(1, 0, fade); gain[i1:i1 + fade] = np.linspace(0, 1, fade)
        st.buf *= gain


def sfx(st: Stem, a):
    for t in a["swipeTicks"]: st.add(t, tick(), 0.6)
    for lo, hi in a.get("caseHum", []): st.add(lo, case_hum(hi - lo), 1.0)
    for t in a["plateClinks"]: st.add(t, plate_clink(), 0.7)
    for t in a["plateScrapes"]: st.add(t, plate_scrape(0.38), 0.55)
    for t in a["napkinPulls"]: st.add(t, napkin_pull(), 0.6)
    for t in a["napkinSlides"]: st.add(t, slide(0.5), 0.55)
    for lo, hi in a["scrawl"]: st.add(lo, crayon(hi - lo), 0.55)
    for lo, hi in a["crayonDraw"]: st.add(lo, crayon(hi - lo), 0.6)
    for t in a["splat"]: st.add(t, splat(), 0.9); st.add(t - 0.1, splash(), 0.7)
    for t in a["laughSting"]: st.add(t, laugh_sting(), 0.45)
    for t in a.get("laughHit", []):
        for m in (60, 64, 67, 72): st.add(t, bell(m, 1.2), 0.3)
        st.add(t, snap(), 0.5); st.add(t, upright(48, 0.8), 0.6)
    for t in a["phoneBuzz"]: st.add(t, buzz(), 0.7 if t < 20 else 0.35)
    for t in a["mugClunks"]: st.add(t, mug_clunk(), 0.9)
    for t in a["forkTink"]: st.add(t, fork_tink(), 0.7)
    for t in a["celestaNote"]: st.add(t, celesta(84), 0.35)
    for t in a["gulp"]: st.add(t, gulp(), 0.8)
    for t in a.get("coinDrops", []): st.add(t, coin_drop(), 0.8)
    for t in a.get("slaps", []): st.add(t, slap(), 0.9)
    for t in a.get("scratch", []): st.add(t - 0.1, scratch(), 0.8)
    for t in a.get("tubaBlats", []): st.add(t - 0.1, tuba_blat(), 0.5)
    for t in a["sliceWhoosh"]: st.add(t - 0.05, slice_whoosh(), 0.9)
    for i, t in enumerate(a["cardPops"]): st.add(t, pop(600 + 200 * i), 0.8)
    for t in a["stamps"]: st.add(t, stamp(), 0.45)
    for lo, hi in a.get("growls", []): st.add(lo, growl(hi - lo), 0.9)
    for lo, hi in a.get("mugRattles", []): st.add(lo, mug_rattle(hi - lo), 0.6)
    for t in a.get("forkClinks", []): st.add(t, fork_clink(), 0.8)
    for t in a.get("cupClinks", []): st.add(t, cup_clink(), 0.9)
    for t in a["endChime"]:
        for k, m in enumerate([72, 76, 79, 84]): st.add(t + k * 0.1, bell(m), 0.3)


if __name__ == "__main__":
    ep = sys.argv[1] if len(sys.argv) > 1 else "pie-ep1"
    spec = json.loads((ROOT / "specs" / "stories" / f"{ep}.json").read_text())
    a, dur = spec["audio"], spec["duration"]
    r, m, s = Stem(dur), Stem(dur), Stem(dur)
    room(r, a); music(m, a); sfx(s, a)
    mix = r.buf * 1.0 + m.buf * 0.9 + s.buf * 1.0
    (ROOT / "public" / "audio").mkdir(parents=True, exist_ok=True)
    write(ROOT / f"public/audio/{ep}.wav", mix)
    if "hookSlide" in a:
        sl = Stem(0.7); sl.add(0.0, slide(0.5), 0.6)
        write(ROOT / f"public/audio/{ep}-slide.wav", sl.buf)
