"""Audio for "Ten Swipes Left" (season 7), driven by specs/stories/<id>.json.

    python3 generate_elevenlabs_voice.py --project swipes --episode swipes-ep1   # takes + character timestamps
    python3 generate_swipes_audio.py swipes-ep1 [hook]                           # timeline + music + sfx

Takes: line-01 .. line-11 are the body lines 1a, 2..11 in spec order; line-12 is hook b's first line.
Hook line 1 starts at 0.1 s in both variants; the shared body (line 2 on) starts at the same time in both
(the shorter hook is padded with a longer gap), so one music/sfx/room bed serves both hooks.
Timeline goes to src/stories/swipes-ep1.timeline.json. Score: chiptune (square bass + triangle arp, A minor,
100 bpm) that thins at "one", drops out before her screen, a warm chord on "too", back at the vote board.
Foley: swipe whoosh, coin clink, counter tick, stamp thump, sweat blip, coffee-room tone, her phone bip, vote ding.
"""

from __future__ import annotations

import json
import sys
import wave
from pathlib import Path

import numpy as np

from audio_kit import probe, speech_data, trim

ROOT = Path(__file__).parent
PUBLIC = ROOT / "public"
RATE = 44100

DELIVERY = {
    "warm": {"stability": 0.45, "style": 0.35, "speed": 1.0},
    "dry": {"stability": 0.55, "style": 0.25, "speed": 1.0},
    "punchy": {"stability": 0.4, "style": 0.4, "speed": 1.04},
    "slow reveal": {"stability": 0.55, "style": 0.3, "speed": 0.94},
    "deadpan": {"stability": 0.6, "style": 0.2, "speed": 0.98},
}

SPEC: dict = {}
LINES: list[tuple[float, str]] = []
RECORDED = PUBLIC / "voice-swipes-ep1"
VOICE_OVERRIDES: dict[int, dict] = {}
VOICE_ID = "R9RZPy40Zzy1wNxrgQpj"  # Witty McGee


def configure(episode: str) -> None:
    global SPEC, LINES, RECORDED, VOICE_OVERRIDES
    SPEC = json.loads((ROOT / "specs" / "stories" / f"{episode}.json").read_text())
    texts = [ln["text"] for ln in SPEC["lines"]] + [SPEC["hooks"]["b"]["line1"]]
    deliv = [ln.get("delivery", "dry") for ln in SPEC["lines"]] + ["warm"]
    LINES = [(0.0, t) for t in texts]
    RECORDED = PUBLIC / f"voice-{SPEC['id']}"
    VOICE_OVERRIDES = {i + 1: DELIVERY.get(d, {}) for i, d in enumerate(deliv)}


def norm(word: str) -> str:
    return "".join(c for c in word.lower() if c.isalnum() or c == "'")


def take(n: int, start: float, trimmed: Path, text: str) -> dict:
    name = f"line-{n:02d}"
    src = RECORDED / f"{name}.mp3"
    if not src.exists():
        raise SystemExit(f"missing {name}: run generate_elevenlabs_voice.py --project swipes --episode {SPEC['id']}")
    path = trimmed / f"{name}.wav"
    cut = trim(src, path)
    dur = probe(path)
    words, mouth = speech_data(src.with_suffix(".align.json"), cut, start)
    return {"file": str(path.relative_to(PUBLIC)), "start": round(start, 3), "duration": round(dur, 3), "text": text,
            "words": words, "mouth": mouth}


def timeline() -> dict:
    trimmed = PUBLIC / f"voice-{SPEC['id']}-trimmed"
    trimmed.mkdir(parents=True, exist_ok=True)
    n_body = len(SPEC["lines"])
    hooks = {}
    for h, n in (("a", 1), ("b", n_body + 1)):
        hooks[h] = take(n, SPEC["lines"][0]["gapBefore"], trimmed, SPEC["hooks"][h]["line1"])
    # shared body start: the later of (hook end + that hook's own gap)
    body_start = max(hooks[h]["start"] + hooks[h]["duration"] + SPEC["hooks"][h]["gapBeforeLine2"] for h in hooks)
    lines, t = [], body_start
    for ln in SPEC["lines"][1:]:
        start = t if ln["n"] == 2 else t + ln["gapBefore"]
        lines.append(take(ln["n"], start, trimmed, ln["text"]))
        t = start + lines[-1]["duration"]
        print(f"line-{ln['n']:02d} {lines[-1]['duration']:5.2f}s @{start:6.2f}  {ln['text']}")
    for h in hooks:
        print(f"hook {h} {hooks[h]['duration']:5.2f}s ends {hooks[h]['start'] + hooks[h]['duration']:.2f}")
    # lines[0] is line 2 ... so spec line n lives at lines[n-2]

    def at(line: int, word: str, offset: float = 0.0) -> float:
        ws = lines[line - 2]["words"]
        hit = next((w["start"] for w in ws if norm(w["text"]).startswith(norm(word))), None)
        if hit is None:
            raise SystemExit(f"word {word!r} not found in line {line}")
        return round(hit + offset, 3)

    beats = {"hook": 0.0, "bodyStart": round(body_start, 3)}
    for b in SPEC["beats"]:
        if "line" in b:
            beats[b["name"]] = at(b["line"], b["word"], b.get("offset", 0.0))
    for ln in SPEC["lines"][1:]:
        i = ln["n"] - 2
        beats[f"l{ln['n']}"] = lines[i]["start"]
        beats[f"e{ln['n']}"] = round(lines[i]["start"] + lines[i]["duration"], 3)
    beats["endcard"] = round(beats["e11"] + 0.5, 3)
    beats["end"] = round(beats["endcard"] + 3.5, 3)
    # the second "Lovely" and third: use real word starts rather than offsets
    lov = [w["start"] for w in lines[4 - 2]["words"] if norm(w["text"]).startswith("lovely")]
    if len(lov) >= 3:
        beats["swipe2"], beats["swipe3"], beats["swipe4"] = (round(x, 3) for x in lov[:3])
    # the swipe-3-4 cards: quick, ahead of the voice by 40 ms
    # counter: 9..6 on swipes, 5 on "sweating", then evenly spaced to 2, and 1 on "one"
    c = [(0.0, 10), (beats["swipe1"], 9), (beats["swipe2"], 8), (beats["swipe3"], 7), (beats["swipe4"], 6)]
    s0, one = beats["sweat"], beats["one"]
    step = min(0.3, (one - s0 - 0.12) / 3)
    for k, v in enumerate((5, 4, 3, 2)):
        c.append((round(s0 + k * step, 3), v))
    c.append((one, 1))
    beats["race"] = c[6][0]
    counter = [{"t": round(a, 3), "value": v} for a, v in c]
    cues = {
        "swipe": [x["t"] for x in counter[1:9]],
        "coinClink": [x["t"] for x in counter[1:]] + [beats["pullBack"]],
        "counterTick": [x["t"] for x in counter[1:]],
        "stamp": [beats["rule"], beats["voteBoard"], beats["hlA"], beats["hlB"], beats["endcard"]],
        "sweatBlip": [beats["sweat"]],
        "herPhoneBip": [beats["herScreen"]],
        "voteDing": [beats["voteBoard"]],
    }
    data = {"id": SPEC["id"], "hooks": hooks, "lines": lines, "beats": beats, "counter": counter, "cues": cues,
            "duration": beats["end"]}
    out = ROOT / "src" / "stories" / f"{SPEC['id']}.timeline.json"
    out.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
    print(f"total {data['duration']:.2f}s = {round(data['duration'] * 60)} frames; vote board at {beats['voteBoard']:.2f}s")
    return data


# --------------------------------------------------------------------------------- synthesis
rng = np.random.default_rng(606)


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


def fft_filter(x: np.ndarray, lo: float | None, hi: float | None) -> np.ndarray:
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / RATE)
    g = np.ones_like(f)
    if hi:
        g *= 1 / (1 + (f / hi) ** 4)
    if lo:
        g *= 1 - 1 / (1 + (f / lo) ** 4)
    return np.fft.irfft(X * g, len(x))


def square(f: float, t: np.ndarray, duty: float = 0.5) -> np.ndarray:
    return np.where((f * t) % 1.0 < duty, 1.0, -1.0)


def tri(f: float, t: np.ndarray) -> np.ndarray:
    return 2 * np.abs(2 * ((f * t) % 1.0) - 1) - 1


def swipe_whoosh() -> np.ndarray:
    d = 0.09
    t = tt(d)
    return fft_filter(rng.uniform(-1, 1, len(t)), 1200, 5200) * np.sin(np.pi * t / d) * 0.7


def coin() -> np.ndarray:
    t = tt(0.16)
    return (np.sin(2 * np.pi * 2400 * t) + 0.7 * np.sin(2 * np.pi * 3100 * t)) * np.exp(-t * 30) * 0.35


def tick() -> np.ndarray:
    t = tt(0.03)
    return square(880, t) * np.minimum(1, (0.03 - t) / 0.01) * 0.25


def stamp() -> np.ndarray:
    t = tt(0.25)
    return 0.9 * np.sin(2 * np.pi * (90 + 60 * np.exp(-t * 40)) * t) * np.exp(-t * 18) + 0.3 * fft_filter(rng.uniform(-1, 1, len(t)), None, 2500) * np.exp(-t * 60)


def blip_down() -> np.ndarray:
    t = tt(0.25)
    return np.sin(2 * np.pi * (1100 - 1600 * t) * t) * np.exp(-t * 9) * 0.35


def bip() -> np.ndarray:
    t = tt(0.4)
    a = np.sin(2 * np.pi * 988 * t) * np.exp(-t * 18)
    b = np.zeros_like(t)
    k = int(0.12 * RATE)
    b[k:] = (np.sin(2 * np.pi * 1318 * t) * np.exp(-t * 14))[:len(t) - k]
    return (a + b) * 0.3


def ding() -> np.ndarray:
    t = tt(0.9)
    return (np.sin(2 * np.pi * 1568 * t) + 0.4 * np.sin(2 * np.pi * 3136 * t)) * np.exp(-t * 5) * 0.3


def pop() -> np.ndarray:
    t = tt(0.12)
    return np.sin(2 * np.pi * (500 + 1400 * t) * t) * np.exp(-t * 28) * 0.4


def music(d: float, B: dict) -> np.ndarray:
    st = Stem(d)
    beat = 60 / 100
    step = beat / 2
    # Am - F - C - G, 2 beats per chord (8ths arps)
    chords = [(45, [57, 60, 64]), (41, [53, 57, 60]), (48, [55, 60, 64]), (43, [55, 59, 62])]
    drop_from, drop_to = B["drop"], B["backAt"]
    thin = B["one"]
    n_steps = int(d / step)
    for i in range(n_steps):
        t = i * step
        if drop_from <= t < drop_to:
            continue
        bass, arp = chords[(i // 4) % 4]
        thinned = thin <= t < drop_from
        arp_note = arp[[0, 1, 2, 1][i % 4]]
        if i % 2 == 0 and not thinned or (thinned and i % 4 == 0):
            tn = tt(step * 0.9)
            st.add(t, square(midi(bass), tn, 0.5) * np.exp(-tn * 6) * 0.28)
        if not thinned and t < B["endcard"]:
            tn = tt(step * 0.8)
            st.add(t, tri(midi(arp_note + 12), tn) * np.exp(-tn * 5) * 0.3)
        if thinned and i % 4 == 2:
            tn = tt(step * 1.5)
            st.add(t, tri(midi(arp_note + 12), tn) * np.exp(-tn * 3) * 0.25)
    # warm chord on "too"
    w = tt(2.0)
    chord = sum(np.sin(2 * np.pi * midi(m) * w) for m in (57, 60, 64, 67)) * np.exp(-w * 1.2) * np.minimum(1, w / 0.05) * 0.1
    st.add(B["smile"], chord)
    # end chord (gold)
    e = tt(2.5)
    ec = sum(np.sin(2 * np.pi * midi(m) * e) + 0.3 * np.sin(2 * np.pi * midi(m) * 2 * e) for m in (57, 61, 64, 69)) * np.exp(-e * 1.3) * np.minimum(1, e / 0.02) * 0.1
    st.add(B["endcard"], ec)
    return st.buf


def room(d: float, B: dict) -> np.ndarray:
    n = int(d * RATE)
    pink = np.cumsum(rng.uniform(-1, 1, n)) * 0.002
    pink = fft_filter(pink - np.mean(pink), 80, 700)
    pink = pink / (np.max(np.abs(pink)) + 1e-9) * 0.35
    t = np.arange(n) / RATE
    gate = np.clip((t - B["pullBack"]) / 0.3, 0, 1) * np.clip((B["endcard"] - t) / 0.5, 0, 1)
    return pink * gate


def build(data: dict) -> None:
    B, C, d = data["beats"], data["cues"], data["duration"]
    B = {**B, "drop": round(B["turn"] - 0.4, 3), "backAt": B["voteBoard"]}
    mus = music(d, B)
    sfx = Stem(d)
    for x in C["swipe"]:
        sfx.add(x, swipe_whoosh(), 0.8)
    for x in C["coinClink"]:
        sfx.add(x + 0.12, coin(), 0.7)
    for x in C["counterTick"]:
        sfx.add(x, tick(), 0.6)
    for x in C["stamp"]:
        sfx.add(x, stamp(), 0.9)
    for x in C["sweatBlip"]:
        sfx.add(x, blip_down(), 0.8)
    for x in C["herPhoneBip"]:
        sfx.add(x, bip(), 0.8)
    for x in C["voteDing"]:
        sfx.add(x, ding(), 0.8)
    sfx.add(B["cardA"] + 0.02, pop(), 0.8)
    sfx.add(B["cardB"] + 0.02, pop(), 0.8)
    sfx.add(B["comment"], pop(), 0.6)
    out = PUBLIC / "audio"
    out.mkdir(exist_ok=True)
    for name, buf in (("music", mus), ("sfx", sfx.buf), ("room", room(d, B))):
        peak = max(1e-9, np.max(np.abs(buf)))
        buf = buf / peak * (0.8 if name != "room" else 0.5) if name != "music" else buf / peak * 0.8
        with wave.open(str(out / f"{SPEC['id']}-{name}.wav"), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
            w.writeframes((np.clip(buf, -1, 1) * 32767).astype("<i2").tobytes())
        print("wrote", out / f"{SPEC['id']}-{name}.wav")


if __name__ == "__main__":
    configure(sys.argv[1] if len(sys.argv) > 1 else "swipes-ep1")
    build(timeline())
