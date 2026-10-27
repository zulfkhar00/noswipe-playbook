"""Audio for any "Pre-Game" episode (Format 2), driven by its spec in specs/<id>.json.

    python3 generate_elevenlabs_voice.py --project pregame --episode friday-night-live
    python3 generate_pregame_audio.py friday-night-live

Voice handling is the receipt format's: lines voiced one by one with character timestamps, laid
end to end with each line's gapBefore, beats resolved to their anchor words. The timeline goes to
src/pregame/<id>.timeline.json. The sound is a broadcast's: a stadium warm-up groove and crowd
murmur that thin out as the night drags, replay stings, a sad slide on the final score, and a
cheer when NoSwipe books the date.
"""

from __future__ import annotations

import json
import math
import random
import sys

import generate_receipt_audio as R
from audio_kit import RATE, Track, probe, speech_data, trim, write

ROOT, PUBLIC, VOICE_ID = R.ROOT, R.PUBLIC, R.VOICE_ID
SPEC: dict = {}
LINES: list[tuple[float, str]] = []
RECORDED = PUBLIC / "voice-pregame"
VOICE_OVERRIDES: dict[int, dict] = {}


def configure(episode: str) -> None:
    """Load an episode spec; generate_elevenlabs_voice.py calls this with --episode."""
    global SPEC, LINES, RECORDED, VOICE_OVERRIDES
    R.configure(episode)
    SPEC, LINES, RECORDED, VOICE_OVERRIDES = R.SPEC, R.LINES, R.RECORDED, R.VOICE_OVERRIDES


def timeline() -> dict:
    trimmed = PUBLIC / f"voice-{SPEC['id']}-trimmed"
    trimmed.mkdir(parents=True, exist_ok=True)
    lines, t = [], 0.0
    for ln in SPEC["lines"]:
        name = f"line-{ln['n']:02d}"
        src = next((RECORDED / f"{name}{ext}" for ext in (".wav", ".m4a", ".mp3") if (RECORDED / f"{name}{ext}").exists()), None)
        if not src:
            raise SystemExit(f"missing {name}: run generate_elevenlabs_voice.py --project pregame --episode {SPEC['id']}")
        path = trimmed / f"{name}.wav"
        cut = trim(src, path)
        dur = probe(path)
        start = t + ln["gapBefore"]
        t = start + dur
        line = {"file": str(path.relative_to(PUBLIC)), "start": round(start, 3), "duration": round(dur, 3), "text": ln["text"]}
        line["words"], line["mouth"] = speech_data(src.with_suffix(".align.json"), cut, start)
        lines.append(line)
        print(f"{name} {dur:5.2f}s  @{start:5.2f}  {ln['text']}")
    beats = {"start": 0.0}
    for b in SPEC["beats"]:
        ln = lines[b["line"] - 1]
        hit = next((w["start"] for w in ln["words"] if R.norm(w["text"]).startswith(R.norm(b["word"]))), None)
        if hit is None:
            raise SystemExit(f"beat {b['name']}: word {b['word']!r} not found in line {b['line']}")
        beats[b["name"]] = round(hit + b.get("offset", 0.0), 3)
    for i, l in enumerate(lines, 1):
        beats[f"e{i}"] = round(l["start"] + l["duration"], 3)
    beats["end"] = round(t + 1.3, 3)
    data = {"id": SPEC["id"], "lines": lines, "beats": beats, "duration": beats["end"]}
    out = ROOT / "src" / "pregame" / f"{SPEC['id']}.timeline.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
    print(f"total {data['duration']:.2f}s")
    return data


rng = random.Random(77)


def midi(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def score(tr: Track, b: dict, dur: float) -> None:
    """A 104 BPM warm-up groove (kick, claps, organ stabs) until nine PM, then a lonely organ
    hum through midnight, silence on the final score, and the groove back in a brighter key
    from the substitution on."""
    def kick(t, vol=0.12):
        tr.mix(t, 0.25, lambda x: vol * math.sin(2 * math.pi * (50 * x + 1.3 * (1 - math.exp(-35 * x)))) * math.exp(-12 * x))

    def clap(t, vol=0.05):
        tr.mix(t, 0.12, lambda x: vol * rng.uniform(-1, 1) * math.exp(-28 * x))

    def organ(t, ms, d, vol=0.016):
        fs = [midi(m) for m in ms]
        tr.mix(t, d, lambda x: vol * sum(math.sin(2 * math.pi * f * x) + 0.5 * math.sin(4 * math.pi * f * x) + 0.25 * math.sin(6 * math.pi * f * x) for f in fs)
               * (1 + 0.1 * math.sin(2 * math.pi * 6 * x)) * min(1, x * 40, (d - x) * 20))

    def bass(t, m, vol=0.12):
        f = midi(m)
        tr.mix(t, 0.3, lambda x: vol * math.sin(2 * math.pi * f * x) * min(1, x * 120) * math.exp(-6 * x))

    beat = 60 / 104
    dull = [([57, 60, 64], 45), ([53, 57, 60], 41), ([55, 59, 62], 43), ([52, 55, 59], 40)]
    bright = [([60, 64, 67], 48), ([65, 69, 72], 53), ([67, 71, 74], 55), ([60, 64, 67], 48)]
    for a, z, prog in ((0.0, b["nine"] - 0.2, dull), (b["sub"] - 0.1, dur - 0.3, bright)):
        t, step = a, 0
        while t < z:
            chord, root = prog[(step // 4) % 4]
            k = step % 4
            kick(t)
            if k in (1, 3):
                clap(t)
            bass(t, root if k % 2 == 0 else root + 7)
            if k in (0, 2):
                organ(t + beat / 2, chord, beat * 0.4)
            t += beat
            step += 1
    # The lonely stretch: one held organ chord per two bars, getting quieter, gone for the final score.
    t = b["nine"] - 0.2
    while t < b["zero"] - 0.3:
        organ(t, [57, 60, 64], min(beat * 8, b["zero"] - 0.3 - t), 0.012 * max(0.3, 1 - (t - b["nine"]) / 10))
        t += beat * 8


def crowd(tr: Track, b: dict, dur: float) -> None:
    """Stadium murmur: band-limited noise with slow swells; thins after nine PM, gone by midnight,
    back with the substitution and a cheer on the date."""
    lp = 0.0
    for i in range(tr.n):
        t = i / RATE
        if t < b["nine"]:
            level = 0.16
        elif t < b["sub"]:
            level = 0.16 * max(0.0, 1 - (t - b["nine"]) / max(0.5, b["midnight"] - b["nine"]))
        else:
            level = 0.12
        swell = 1 + 0.35 * math.sin(2 * math.pi * 0.21 * t) * math.sin(2 * math.pi * 0.07 * t + 1)
        x = rng.uniform(-1, 1)
        lp += 0.08 * (x - lp)
        tr.buf[i] = level * swell * lp
    # A cheer on the date, a smaller one on the payoff.
    for at, d, vol in ((b["maya"] - 0.1, 2.2, 0.22), (b["better"], 1.6, 0.14)):
        tr.mix(at, d, lambda x, d=d, vol=vol: vol * rng.uniform(-1, 1) * min(1, x * 6) * math.exp(-1.6 * x) * (1 + 0.4 * math.sin(2 * math.pi * 7 * x)))


def foley(tr: Track, b: dict) -> None:
    def pop(at, hz=1200, vol=0.08):
        tr.mix(at, 0.12, lambda x: vol * math.sin(2 * math.pi * hz * (1 + 0.6 * math.exp(-40 * x)) * x) * math.exp(-28 * x))

    def tick(at, vol=0.05):
        tr.mix(at, 0.025, lambda x: vol * rng.uniform(-1, 1) * math.exp(-140 * x))

    def whoosh(at, d=0.4, vol=0.06):
        tr.mix(at, d, lambda x: vol * rng.uniform(-1, 1) * math.sin(math.pi * x / d) ** 2)

    def whistle(at, d=0.7):     # referee's pea whistle: a trilled tone
        tr.mix(at, d, lambda x: 0.07 * math.sin(2 * math.pi * 2900 * x + 3 * math.sin(2 * math.pi * 40 * x)) * min(1, x * 40, (d - x) * 10))

    def bwoop(at):              # the replay sting
        tr.mix(at, 0.35, lambda x: 0.07 * math.sin(2 * math.pi * (300 * x + 900 * x * x)) * math.sin(math.pi * x / 0.35))

    def scribble(at, d=0.5):    # telestrator pen
        tr.mix(at, d, lambda x: 0.035 * rng.uniform(-1, 1) * (0.5 + 0.5 * abs(math.sin(2 * math.pi * 11 * x))) * min(1, x * 30, (d - x) * 30))

    def slide(at):              # sad trombone-ish slide down
        for i, (m, d) in enumerate(((58, 0.32), (57, 0.32), (56, 0.32), (55, 0.9))):
            f0 = midi(m)
            st = at + i * 0.34
            tr.mix(st, d, lambda x, f0=f0, d=d: 0.05 * sum(math.sin(2 * math.pi * f0 * (1 - 0.02 * x * (i == 3)) * h * x) / h for h in (1, 2, 3, 4))
                   * (1 + 0.15 * math.sin(2 * math.pi * 5 * x)) * min(1, x * 30, (d - x) * 8))

    def ping(at):
        for k, hz in enumerate((1568, 2093, 2637)):
            tr.mix(at + k * 0.07, 0.6, lambda x, hz=hz: 0.05 * math.sin(2 * math.pi * hz * x) * math.exp(-6 * x))

    def buzzer(at):             # substitution board
        tr.mix(at, 0.45, lambda x: 0.05 * (1 if math.sin(2 * math.pi * 220 * x) > 0 else -1) * min(1, x * 50, (0.45 - x) * 20))

    whistle(0.05)
    for k in ("replay1", "opens", "nine", "midnight", "sub", "same"):   # broadcast stingers on the cuts
        whoosh(b[k] - 0.38, 0.5, 0.07)
    for i in range(6):
        tick(b["thumb"] + 0.2 + i * 0.12, 0.04)
    bwoop(b["replay1"] - 0.1)
    for at in (b["left1"], b["again"] - 0.3, b["again"] + 0.15):
        whoosh(at, 0.35, 0.05)
    for i in range(3):
        tick(b["types"] + 0.2 + i * 0.1, 0.05)
    pop(b["hey"] + 0.2, 1500, 0.07)
    scribble(b["hey"] + 0.35, 0.6)
    tr.mix(b["nothing"] + 0.2, 1.2, lambda x: 0.02 * math.sin(2 * math.pi * 4200 * x) * (1 if (x * 7) % 1 < 0.15 else 0))   # a cricket
    scribble(b["couch"], 0.7)
    whistle(b["zero"] - 0.05, 1.1)
    slide(b["zero"] + 0.6)
    tr.mix(b["given"], 0.3, lambda x: 0.12 * math.sin(2 * math.pi * (70 * x + 0.8 * (1 - math.exp(-30 * x)))) * math.exp(-12 * x))   # pizza lid flops
    buzzer(b["sub"]); whoosh(b["noswipe"], 0.4, 0.06)
    for i, k in enumerate(("swipes", "chats", "books")):
        pop(b[k], 1200 + 200 * i, 0.06)
    ping(b["maya"] - 0.05)
    pop(b["better"], 1700, 0.07)
    tick(b["endcard"] + 0.4, 0.07)


if __name__ == "__main__":
    configure(sys.argv[1] if len(sys.argv) > 1 else "friday-night-live")
    data = timeline()
    b, dur = data["beats"], data["duration"]
    music, sfx, amb = Track(dur), Track(dur), Track(dur)
    score(music, b, dur); crowd(amb, b, dur); foley(sfx, b)
    (PUBLIC / "audio").mkdir(parents=True, exist_ok=True)
    write(PUBLIC / f"audio/{SPEC['id']}-music.wav", music.buf)
    write(PUBLIC / f"audio/{SPEC['id']}-sfx.wav", sfx.buf)
    write(PUBLIC / f"audio/{SPEC['id']}-crowd.wav", amb.buf, 0.5)
