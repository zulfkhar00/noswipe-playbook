"""Audio for the NoSwipe story account (STORIES.md), driven by specs/stories/<id>.json.

    python3 generate_elevenlabs_voice.py --project story --episode groupchat-ep1
    python3 generate_story_audio.py groupchat-ep1

Each line is voiced by its speaker's cast voice (LINE_VOICES), with character timestamps. Lines
are laid end to end with their gapBefore; beats and chat messages resolve to the word they name.
The timeline goes to src/stories/<id>.timeline.json. The score and Foley here are season 1's
(The Group Chat Is Cooking): lo-fi bedroom pop with a glockenspiel, typing clicks, message pops,
a send swoosh, a "Seen" tick and a heartbeat under the typing dots.
"""

from __future__ import annotations

import json
import math
import random
import sys
from pathlib import Path

from audio_kit import RATE, Track, probe, speech_data, trim, write

ROOT = Path(__file__).parent
PUBLIC = ROOT / "public"

DELIVERY = {
    "deadpan": {"stability": 0.55, "style": 0.2, "speed": 0.98},
    "dry": {"stability": 0.55, "style": 0.25, "speed": 1.0},
    "nervous": {"stability": 0.3, "style": 0.5, "speed": 1.05},
    "panicked": {"stability": 0.25, "style": 0.65, "speed": 1.1},
    "smug": {"stability": 0.35, "style": 0.6, "speed": 1.02},
    "warm": {"stability": 0.45, "style": 0.4, "speed": 1.0},
}

SPEC: dict = {}
LINES: list[tuple[float, str]] = []
RECORDED = PUBLIC / "voice-story"
VOICE_OVERRIDES: dict[int, dict] = {}
LINE_VOICES: dict[int, str] = {}


def configure(episode: str) -> None:
    """Load an episode spec; generate_elevenlabs_voice.py calls this with --episode."""
    global SPEC, LINES, RECORDED, VOICE_OVERRIDES, LINE_VOICES
    SPEC = json.loads((ROOT / "specs" / "stories" / f"{episode}.json").read_text())
    LINES = [(0.0, ln["text"]) for ln in SPEC["lines"]]
    RECORDED = PUBLIC / f"voice-{SPEC['id']}"
    VOICE_OVERRIDES = {ln["n"]: DELIVERY.get(ln.get("delivery", "dry"), {}) for ln in SPEC["lines"]}
    LINE_VOICES = {ln["n"]: SPEC["cast"][ln["speaker"]] for ln in SPEC["lines"]}


def norm(word: str) -> str:
    return "".join(c for c in word.lower() if c.isalnum() or c == "'")


def timeline() -> dict:
    trimmed = PUBLIC / f"voice-{SPEC['id']}-trimmed"
    trimmed.mkdir(parents=True, exist_ok=True)
    lines, t = [], 0.0
    for ln in SPEC["lines"]:
        name = f"line-{ln['n']:02d}"
        src = RECORDED / f"{name}.mp3"
        if not src.exists():
            raise SystemExit(f"missing {name}: run generate_elevenlabs_voice.py --project story --episode {SPEC['id']}")
        path = trimmed / f"{name}.wav"
        cut = trim(src, path)
        dur = probe(path)
        start = t + ln["gapBefore"]
        t = start + dur
        line = {"file": str(path.relative_to(PUBLIC)), "start": round(start, 3), "duration": round(dur, 3), "text": ln["text"], "speaker": ln["speaker"]}
        line["words"], line["mouth"] = speech_data(src.with_suffix(".align.json"), cut, start)
        lines.append(line)
        print(f"{name} {ln['speaker']:<8} {dur:5.2f}s  @{start:5.2f}  {ln['text']}")

    def at(line: int, word: str, offset: float = 0.0) -> float:
        hit = next((w["start"] for w in lines[line - 1]["words"] if norm(w["text"]).startswith(norm(word))), None)
        if hit is None:
            raise SystemExit(f"word {word!r} not found in line {line}")
        return round(hit + offset, 3)

    beats = {"start": 0.0}
    for b in SPEC["beats"]:
        beats[b["name"]] = at(b["line"], b["word"], b.get("offset", 0.0))
    for i, l in enumerate(lines, 1):
        beats[f"l{i}"] = l["start"]
        beats[f"e{i}"] = round(l["start"] + l["duration"], 3)
    beats["end"] = round(t + 3.0, 3)
    chat = [{**c, "at": at(c["line"], c["word"], c.get("offset", 0.0))} for c in SPEC["chat"]]
    data = {"id": SPEC["id"], "lines": lines, "beats": beats, "chat": chat, "duration": beats["end"]}
    out = ROOT / "src" / "stories" / f"{SPEC['id']}.timeline.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
    print(f"total {data['duration']:.2f}s")
    return data


rng = random.Random(11)


def midi(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def score(tr: Track, b: dict, dur: float) -> None:
    """Lo-fi bedroom pop at 84 BPM in F: soft kick, brushed snare, a dusty Rhodes and a glockenspiel
    hook. It stops dead on "Sending", and from "Sana is typing" a lone heartbeat bass pulses."""
    def kick(t, vol=0.1):
        tr.mix(t, 0.25, lambda x: vol * math.sin(2 * math.pi * (52 * x + 1.2 * (1 - math.exp(-30 * x)))) * math.exp(-11 * x))

    def snare(t, vol=0.035):
        tr.mix(t, 0.18, lambda x: vol * rng.uniform(-1, 1) * math.exp(-20 * x))

    def hat(t, vol=0.012):
        tr.mix(t, 0.05, lambda x: vol * rng.uniform(-1, 1) * math.exp(-80 * x))

    def rhodes(t, ms, d, vol=0.018):
        fs = [midi(m) for m in ms]
        tr.mix(t, d, lambda x: vol * sum(math.sin(2 * math.pi * f * x) + 0.3 * math.sin(4 * math.pi * f * x) * math.exp(-4 * x) for f in fs)
               * (1 + 0.15 * math.sin(2 * math.pi * 4.5 * x)) * min(1, x * 25, (d - x) * 6))

    def glock(t, m, vol=0.035):
        f = midi(m)
        tr.mix(t, 1.0, lambda x: vol * (math.sin(2 * math.pi * f * x) + 0.35 * math.sin(2 * math.pi * f * 2.76 * x) * math.exp(-6 * x)) * math.exp(-3.5 * x))

    def bass(t, m, vol=0.1, d=0.5):
        f = midi(m)
        tr.mix(t, d, lambda x: vol * math.sin(2 * math.pi * f * x) * min(1, x * 100) * math.exp(-4 * x))

    beat = 60 / 84
    prog = [([65, 69, 72, 76], 41), ([62, 65, 69, 72], 38), ([58, 62, 65, 69], 34), ([60, 64, 67, 70], 36)]
    hook = [77, 0, 76, 72, 0, 74, 72, 69]
    stop = b["send"] - 0.05
    t, step = max(0.0, b["l1"] - 0.2), 0
    while t < stop:
        chord, root = prog[(step // 4) % 4]
        k = step % 4
        kick(t, 0.1 if k in (0, 2) else 0)
        if k in (1, 3):
            snare(t)
        hat(t + beat / 2)
        if k == 0:
            rhodes(t, chord, min(beat * 4, stop - t))
            bass(t, root)
        if k == 2:
            bass(t, root + 7, 0.07)
        m = hook[(step * 2) % 8], hook[(step * 2 + 1) % 8]
        if t > 2 and (step // 8) % 2 == 0:
            for j, n in enumerate(m):
                if n and t + j * beat / 2 < stop:
                    glock(t + j * beat / 2, n)
        t += beat
        step += 1
    # After the send: silence, then a heartbeat under the typing dots.
    t = b["dots"] - 0.2
    while t < dur - 0.3:
        bass(t, 29, 0.16, 0.35)
        bass(t + 0.22, 29, 0.1, 0.3)
        t += 0.9
    glock(b["dots"] + 0.6, 84, 0.02)


def room(tr: Track, dur: float) -> None:
    """A quiet apartment at night: soft air and the fridge hum."""
    lp = 0.0
    for i in range(tr.n):
        lp += 0.02 * (rng.uniform(-1, 1) - lp)
        tr.buf[i] = 0.05 * lp + 0.003 * math.sin(2 * math.pi * 60 * i / RATE)


def foley(tr: Track, b: dict, chat: list[dict]) -> None:
    def click(at, vol=0.035):
        tr.mix(at, 0.02, lambda x: vol * rng.uniform(-1, 1) * math.exp(-180 * x))

    def pop(at, hz=1200, vol=0.07):
        tr.mix(at, 0.12, lambda x: vol * math.sin(2 * math.pi * hz * (1 + 0.5 * math.exp(-40 * x)) * x) * math.exp(-26 * x))

    def swoosh(at, d=0.45, vol=0.08):
        tr.mix(at, d, lambda x: vol * rng.uniform(-1, 1) * math.sin(math.pi * x / d) ** 2 * (0.5 + x / d))

    def chime(at):
        for k, hz in enumerate((1318, 1760)):
            tr.mix(at + k * 0.09, 0.6, lambda x, hz=hz: 0.05 * math.sin(2 * math.pi * hz * x) * math.exp(-6 * x))

    pitch = {"DEV": 900, "BO": 1300, "NINA": 1100, "SANA": 1500}
    for c in chat:
        if c["from"] in ("DEV", "BO", "NINA") and not (c["from"] == "DEV" and c["thread"] == "sana"):
            n = min(14, max(4, len(c["text"]) // 3))
            for i in range(n):
                click(c["at"] - 0.06 * (n - i) - 0.1 + rng.uniform(-0.01, 0.01))
        pop(c["at"], pitch[c["from"]], 0.07)
    chime(b["banner"] - 0.15)
    if b["l1"] > 1.0:   # flash-forward cold open, then a tape rewind back to the start
        tr.mix(b["l1"] - 0.75, 0.6, lambda x: 0.07 * math.sin(2 * math.pi * (1800 * x - 1300 * x * x)) * math.sin(math.pi * x / 0.6) * (0.6 + 0.4 * rng.uniform(-1, 1)))
        pop(0.15, 2000, 0.05)
    for i in range(int((b["e7"] - b["draftHi"]) / 0.07)):
        click(b["draftHi"] + i * 0.07, 0.03)
    swoosh(b["send"] - 0.1)
    click(b["draft"] + 0.2, 0.06); pop(b["draft"] + 0.25, 2000, 0.05)   # "Seen"


if __name__ == "__main__":
    configure(sys.argv[1] if len(sys.argv) > 1 else "groupchat-ep1")
    data = timeline()
    b, dur = data["beats"], data["duration"]
    music, sfx, amb = Track(dur), Track(dur), Track(dur)
    score(music, b, dur); room(amb, dur); foley(sfx, b, data["chat"])
    (PUBLIC / "audio").mkdir(parents=True, exist_ok=True)
    write(PUBLIC / f"audio/{SPEC['id']}-music.wav", music.buf)
    write(PUBLIC / f"audio/{SPEC['id']}-sfx.wav", sfx.buf)
    write(PUBLIC / f"audio/{SPEC['id']}-room.wav", amb.buf, 0.5)
