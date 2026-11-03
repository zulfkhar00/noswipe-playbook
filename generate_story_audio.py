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


def treat(path: Path, kind: str) -> None:
    """Phone lines get a narrow band (300 Hz–3.2 kHz); off-screen lines a soft low-pass and a short
    room echo. Plain one-pole filters on the trimmed 16-bit WAV, in place."""
    import array, wave
    with wave.open(str(path)) as w:
        params = w.getparams()
        data = array.array("h", w.readframes(w.getnframes()))
    ch, sr = params.nchannels, params.framerate
    x = [v / 32768 for v in data]

    def lowpass(sig, fc):
        a = math.exp(-2 * math.pi * fc / sr); y = [0.0] * ch; out = []
        for i, v in enumerate(sig):
            c = i % ch; y[c] = (1 - a) * v + a * y[c]; out.append(y[c])
        return out

    def highpass(sig, fc):
        lp = lowpass(sig, fc)
        return [v - l for v, l in zip(sig, lp)]

    if kind == "phone":
        y = lowpass(lowpass(highpass(highpass(x, 320), 320), 3200), 3200)
        y = [max(-1, min(1, v * 2.2)) for v in y]
    else:
        y = lowpass(x, 5200)
        d = int(0.038 * sr) * ch
        y = [v + (0.22 * y[i - d] if i >= d else 0) for i, v in enumerate(y)]
    peak = max(1e-6, max(abs(v) for v in y))
    gain = min(1.0, 0.9 / peak) if kind == "phone" else 1.0
    out = array.array("h", (int(max(-1, min(1, v * gain)) * 32767) for v in y))
    with wave.open(str(path), "wb") as w:
        w.setparams(params)
        w.writeframes(out.tobytes())


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
        # Voices heard through a phone or from another room get treated like it.
        if ln.get("kind") in ("phone", "offscreen"):
            treat(path, ln["kind"])
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


def score(tr: Track, b: dict, dur: float, stop: float, pulse: float) -> None:
    """Lo-fi bedroom pop at 84 BPM in F: soft kick, brushed snare, a dusty Rhodes and a glockenspiel
    hook. It stops dead at `stop` (the episode's shock), and from `pulse` a lone heartbeat bass
    carries the cliffhanger."""
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
    t = pulse - 0.2
    while t < dur - 0.3:
        bass(t, 29, 0.16, 0.35)
        bass(t + 0.22, 29, 0.1, 0.3)
        t += 0.9
    glock(pulse + 0.6, 84, 0.02)


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
    CUES[SPEC["id"]](b, click, pop, swoosh, chime, tr)


def cues_ep1(b, click, pop, swoosh, chime, tr):
    chime(b["banner"] - 0.15)
    if b["l1"] > 1.0:   # flash-forward cold open, then a tape rewind back to the start
        tr.mix(b["l1"] - 0.75, 0.6, lambda x: 0.07 * math.sin(2 * math.pi * (1800 * x - 1300 * x * x)) * math.sin(math.pi * x / 0.6) * (0.6 + 0.4 * rng.uniform(-1, 1)))
        pop(0.15, 2000, 0.05)
    for i in range(int((b["e7"] - b["draftHi"]) / 0.07)):
        click(b["draftHi"] + i * 0.07, 0.03)
    swoosh(b["send"] - 0.1)
    click(b["draft"] + 0.2, 0.06); pop(b["draft"] + 0.25, 2000, 0.05)   # "Seen"


def cues_ep2(b, click, pop, swoosh, chime, tr):
    def scribble(at, d=0.6):
        tr.mix(at, d, lambda x: 0.03 * rng.uniform(-1, 1) * (0.5 + 0.5 * abs(math.sin(2 * math.pi * 11 * x))) * min(1, x * 30, (d - x) * 30))
    scribble(0.1, 0.8)                                   # the marker circles "husband"
    swoosh(b["grab"] - 0.05, 0.35, 0.09)                 # Bo snatches the phone
    for i in range(int((b["surprise"] + 0.4 - b["forgive"]) / 0.06)):
        click(b["forgive"] + i * 0.06, 0.035)            # Bo's big thumbs
    swoosh(b["surprise"] + 0.45)
    click(b["ooh"] - 0.35, 0.06); pop(b["ooh"] - 0.3, 2000, 0.05)   # "Seen"
    scribble(b["plan"] - 0.4, 0.7)



def cues_ep3(b, click, pop, swoosh, chime, tr):
    def stamp(at):   # a rubber stamp hitting cork
        tr.mix(at, 0.25, lambda x: 0.2 * math.sin(2 * math.pi * (70 * x + 0.6 * (1 - math.exp(-30 * x)))) * math.exp(-14 * x))
        tr.mix(at, 0.06, lambda x: 0.08 * rng.uniform(-1, 1) * math.exp(-50 * x))

    def violin(at, d=1.2):   # a cheesy two-note string swell for "violins"
        for m, off in ((76, 0.0), (79, 0.35)):
            f = midi(m)
            tr.mix(at + off, d, lambda x, f=f: 0.03 * sum(math.sin(2 * math.pi * f * h * x) / h for h in (1, 2, 3, 4)) * (1 + 0.04 * math.sin(2 * math.pi * 6 * x)) * min(1, x * 6, (d - x) * 4))
    violin(b["violins"])
    if b["l1"] > 1.0:   # flash-forward cold open, then a tape rewind
        tr.mix(b["l1"] - 0.75, 0.6, lambda x: 0.07 * math.sin(2 * math.pi * (1800 * x - 1300 * x * x)) * math.sin(math.pi * x / 0.6) * (0.6 + 0.4 * rng.uniform(-1, 1)))
        pop(0.15, 1500, 0.05)
    for k in ("veto_music", "veto_speech", "veto_cape"):
        stamp(b[k])
    swoosh(b["cape_on"] - 0.1, 0.3, 0.07)
    swoosh(b["veto_cape"] + 0.15, 0.3, 0.06)
    chime(b["banner"] - 0.2)
    for i in range(9):
        click(b["type"] + 0.1 + i * 0.08, 0.035)
    for i in range(9):
        click(b["stops"] + 0.3 + i * 0.05, 0.025)



def score_drama(tr, b, dur):
    """The Ring in the Drawer: a soft felt piano with a warm string pad in D major for hope; on
    "Don't tell her yet" it drops to a low B-minor drone and a single high note that won't resolve."""
    def piano(t, m, vol=0.05, d=2.4):
        f = midi(m)
        tr.mix(t, d, lambda x: vol * (math.sin(2 * math.pi * f * x) + 0.4 * math.sin(4 * math.pi * f * x) * math.exp(-3 * x) + 0.15 * math.sin(6 * math.pi * f * x) * math.exp(-5 * x))
               * math.exp(-1.8 * x) * min(1, x * 200))

    def pad(t, ms, d, vol=0.012):
        tr.mix(t, d, lambda x: vol * sum(math.sin(2 * math.pi * midi(m) * (1 + 0.003 * math.sin(2 * math.pi * 5 * x)) * x) for m in ms) * min(1, x / 1.2, (d - x) / 1.2))

    turn = b["iknow"] - 0.2
    beat = 60 / 72
    prog = [([62, 66, 69], 50), ([59, 62, 66], 47), ([55, 59, 62], 43), ([57, 61, 64], 45)]
    melody = [74, 73, 71, 69, 71, 73, 74, 76]
    t, step = 0.4, 0
    while t < turn:
        chord, root = prog[(step // 4) % 4]
        k = step % 4
        if k == 0:
            piano(t, root, 0.06, 3.0)
            pad(t, chord, min(beat * 4 + 0.6, turn - t + 0.3), 0.012 if t < b["home"] else 0.016)
        piano(t + beat / 2, chord[k % 3] + 12, 0.03, 1.6)
        if t > b["ring"] - 0.2 and k in (0, 2):
            piano(t, melody[(step // 2) % 8], 0.035, 2.0)
        t += beat
        step += 1
    pad(turn, [35, 42, 47], dur - turn - 0.2, 0.02)
    piano(b["tellme"] + 0.3, 78, 0.03, 3.0)


def cues_ring1(b, click, pop, swoosh, chime, tr):
    def thump(at, vol=0.12, f=55):
        tr.mix(at, 0.35, lambda x: vol * math.sin(2 * math.pi * (f * x + 0.5 * (1 - math.exp(-25 * x)))) * math.exp(-10 * x))

    def rustle(at, d=0.6, vol=0.04):
        tr.mix(at, d, lambda x: vol * rng.uniform(-1, 1) * (0.4 + 0.6 * abs(math.sin(2 * math.pi * 17 * x))) * math.sin(math.pi * x / d))

    def keys(at):
        for i in range(6):
            tr.mix(at + i * 0.05 + rng.uniform(0, 0.02), 0.15, lambda x: 0.03 * math.sin(2 * math.pi * rng.choice([3200, 4100, 5200]) * x) * math.exp(-30 * x))

    rustle(0.1, 0.5, 0.03)                         # the drawer slides open
    pop(b["ring"] - 0.1, 1800, 0.03)
    rustle(b["breathe"] + 0.6, 0.5, 0.035)         # the drawer slides shut
    keys(b["home"] - 1.0); thump(b["home"] - 0.6, 0.1, 70)   # keys, door
    rustle(b["home"] + 0.3, 0.7, 0.04)             # the takeout bag
    for i, at in enumerate((b["yet"] + 0.4, b["yet"] + 1.2)):
        thump(at, 0.09, 48)                        # a heartbeat
        thump(at + 0.25, 0.06, 48)


def cues_ring2(b, click, pop, swoosh, chime, tr):
    def thump(at, vol=0.12, f=55):
        tr.mix(at, 0.35, lambda x: vol * math.sin(2 * math.pi * (f * x + 0.5 * (1 - math.exp(-25 * x)))) * math.exp(-10 * x))

    def buzz(at, n=2):   # a phone vibrating on a wooden table
        for i in range(n):
            tr.mix(at + i * 0.5, 0.35, lambda x: 0.06 * math.sin(2 * math.pi * 180 * x) * (0.6 + 0.4 * math.sin(2 * math.pi * 30 * x)) * min(1, x * 40, (0.35 - x) * 40))

    def rustle(at, d=0.6, vol=0.04):
        tr.mix(at, d, lambda x: vol * rng.uniform(-1, 1) * (0.4 + 0.6 * abs(math.sin(2 * math.pi * 17 * x))) * math.sin(math.pi * x / d))

    rustle(b["dress"] - 0.2, 0.9, 0.035)        # the dress twirls
    buzz(b["never"] - 0.4)                      # the phone interrupts the moment
    thump(b["missed"] + 0.9, 0.08, 90)          # the bedroom door clicks shut
    rustle(b["gone"] - 0.6, 0.5, 0.035)         # the drawer slides open
    for at in (b["gone"] + 0.1, b["gone"] + 0.9):
        thump(at, 0.1, 48); thump(at + 0.25, 0.07, 48)
    buzz(b["friday"] - 0.6, 1)


def cues_ring3(b, click, pop, swoosh, chime, tr):
    def thump(at, vol=0.12, f=55):
        tr.mix(at, 0.35, lambda x: vol * math.sin(2 * math.pi * (f * x + 0.5 * (1 - math.exp(-25 * x)))) * math.exp(-10 * x))

    def rustle(at, d=0.6, vol=0.04):
        tr.mix(at, d, lambda x: vol * rng.uniform(-1, 1) * (0.4 + 0.6 * abs(math.sin(2 * math.pi * 17 * x))) * math.sin(math.pi * x / d))

    def ring(at, n=2):   # an outgoing call's ringback tone
        for i in range(n):
            tr.mix(at + i * 1.0, 0.6, lambda x: 0.03 * (math.sin(2 * math.pi * 440 * x) + math.sin(2 * math.pi * 480 * x)) * min(1, x * 30, (0.6 - x) * 30))

    def birds(at, d=2.5):
        for i in range(5):
            st = at + i * d / 5 + rng.uniform(0, 0.2)
            tr.mix(st, 0.18, lambda x: 0.012 * math.sin(2 * math.pi * (3000 + 1500 * math.sin(2 * math.pi * 12 * x)) * x) * math.sin(math.pi * x / 0.18))

    pop(b["noswipe"] - 1.6, 1400, 0.04)          # Dani's voice note arrives
    birds(b["noswipe"] - 1.2)
    thump(b["love"] + 1.6, 0.09, 80)             # the front door closes
    rustle(b["jacket"] - 0.3, 0.6, 0.05)         # the jacket falls
    for at in (b["sold"] + 0.2, b["sold"] + 1.0):
        thump(at, 0.1, 48); thump(at + 0.25, 0.07, 48)
    ring(b["l9"] - 2.05)
    thump(b["who"] - 0.6, 0.12, 70)              # the front door opens


CUES = {"groupchat-ep1": cues_ep1, "groupchat-ep2": cues_ep2, "groupchat-ep3": cues_ep3, "ring-ep1": cues_ring1, "ring-ep2": cues_ring2, "ring-ep3": cues_ring3}
SCORE = {"groupchat-ep1": lambda b: (b["send"] - 0.05, b["dots"]), "groupchat-ep2": lambda b: (b["l13"] - 0.1, b["l13"] + 0.3),
         "groupchat-ep3": lambda b: (b["banner"] - 0.3, b["l12"])}
SCORE_FN = {"ring-ep1": score_drama, "ring-ep2": lambda tr, b, dur: score_drama(tr, {**b, "iknow": b["never"], "home": b["tell"], "ring": b["yes"], "tellme": b["friday"]}, dur),
            "ring-ep3": lambda tr, b, dur: score_drama(tr, {**b, "iknow": b["jacket"], "home": b["love"], "ring": b["reason"], "tellme": b["who"]}, dur)}

if __name__ == "__main__":
    configure(sys.argv[1] if len(sys.argv) > 1 else "groupchat-ep1")
    data = timeline()
    b, dur = data["beats"], data["duration"]
    music, sfx, amb = Track(dur), Track(dur), Track(dur)
    (SCORE_FN[SPEC["id"]](music, b, dur) if SPEC["id"] in SCORE_FN else score(music, b, dur, *SCORE[SPEC["id"]](b))); room(amb, dur); foley(sfx, b, data["chat"])
    (PUBLIC / "audio").mkdir(parents=True, exist_ok=True)
    write(PUBLIC / f"audio/{SPEC['id']}-music.wav", music.buf)
    write(PUBLIC / f"audio/{SPEC['id']}-sfx.wav", sfx.buf)
    write(PUBLIC / f"audio/{SPEC['id']}-room.wav", amb.buf, 0.5)
