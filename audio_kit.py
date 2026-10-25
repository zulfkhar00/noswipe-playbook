"""Shared helpers for the episode audio scripts: take duration and silence trimming.

Uses macOS `afinfo` and the ffmpeg build that ships with Remotion, so no extra installs are needed.
"""

from __future__ import annotations

import random
import re
import subprocess
import wave
from pathlib import Path

COMPOSITOR = Path(__file__).parent / "node_modules/@remotion/compositor-darwin-x64"


def probe(path: Path) -> float:
    # macOS afinfo reads wav, m4a and mp3 without extra dependencies.
    out = subprocess.run(["afinfo", str(path)], capture_output=True, text=True, check=True).stdout
    line = next(l for l in out.splitlines() if "estimated duration" in l)
    return float(line.split(":")[1].split()[0])


def ffmpeg(*args: str) -> str:
    env = {"DYLD_LIBRARY_PATH": str(COMPOSITOR)}
    return subprocess.run([str(COMPOSITOR / "ffmpeg"), "-hide_banner", "-nostats", *args],
                          capture_output=True, text=True, env=env, check=True).stderr


def trim(source: Path, target: Path) -> float:
    """Cut the silence before and after a take, keeping a small natural breath on each side.
    Returns the seconds removed from the head (to shift character alignment)."""
    log = ffmpeg("-i", str(source), "-af", "silencedetect=noise=-38dB:d=0.12", "-f", "null", "-")
    starts = [float(l.split("silence_start:")[1]) for l in log.splitlines() if "silence_start:" in l]
    ends = [float(l.split("silence_end:")[1].split("|")[0]) for l in log.splitlines() if "silence_end:" in l]
    total = probe(source)
    head = ends[0] if starts and starts[0] <= 0.05 and ends else 0.0
    tail = starts[-1] if starts and (len(ends) < len(starts) or ends[-1] >= total - 0.05) else total
    begin, finish = max(0.0, head - 0.06), min(total, tail + 0.12)
    ffmpeg("-y", "-i", str(source), "-af", f"atrim={begin:.3f}:{finish:.3f},asetpts=N/SR/TB",
           "-ac", "1", "-ar", "48000", str(target))
    return begin


# Mouth openness per character, for lip-sync from alignment: open vowels wide, lips closed on m/b/p.
_OPEN = {**{c: 0.95 for c in "aA"}, **{c: 0.75 for c in "oOuUeE"}, **{c: 0.6 for c in "iIyY"}, **{c: 0.0 for c in "mMbBpP"},
         **{c: 0.25 for c in "fFvV"}, **{c: 0.4 for c in "wWrRlLhH"}}


def speech_data(align_file: Path, head_cut: float, start: float) -> tuple[list[dict], list[list[float]]]:
    """Word timings (absolute seconds) and mouth keyframes [time, openness] from an alignment file."""
    import json
    al = json.loads(align_file.read_text())
    chars, cs, ce = al["chars"], al["start"], al["end"]
    words, mouth, cur = [], [], None
    for ch, a, b in zip(chars, cs, ce):
        a, b = start + max(0.0, a - head_cut), start + max(0.0, b - head_cut)
        if ch.strip() == "":
            if cur:
                words.append(cur); cur = None
            mouth.append([round(a, 3), 0.0])
            continue
        cur = cur or {"text": "", "start": round(a, 3), "end": round(b, 3)}
        cur["text"] += ch
        cur["end"] = round(b, 3)
        if ch.isalpha():
            mouth.append([round((a + b) / 2, 3), _OPEN.get(ch, 0.35)])
    if cur:
        words.append(cur)
    if mouth:
        mouth.append([round(mouth[-1][0] + 0.08, 3), 0.0])
    return words, mouth


def loudnorm(source: Path, target: Path, lufs: float = -14.0, peak: float = -2.0) -> str:
    """Two-pass loudness normalisation of a rendered video's audio (video stream copied).
    One pass undershoots when short SFX peaks dominate; the measured second pass hits the target."""
    import json
    import re
    log = ffmpeg("-i", str(source), "-vn", "-af", f"loudnorm=I={lufs}:TP={peak}:LRA=11:print_format=json", "-f", "null", "-")
    m = json.loads(re.findall(r"\{[^{}]*\}", log, re.S)[-1])
    af = (f"loudnorm=I={lufs}:TP={peak}:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=false")
    ffmpeg("-y", "-i", str(source), "-c:v", "copy", "-af", af, "-ar", "48000", "-c:a", "aac", "-b:a", "192k", str(target))
    return f"{m['input_i']} LUFS in"



# ---------------------------------------------------------------------------------------------
# Synthesis helpers shared by the ad audio scripts.

RATE = 44_100


def words(start: float, dur: float, text: str) -> list[tuple[str, float]]:
    """Same estimate as src/case/voice.ts: weight by letters, a bit extra for punctuation."""
    parts = [w for w in text.replace('"', "").replace("...", "…").split(" ") if w != "…"]
    weight = lambda w: len(re.sub(r"[^\w']", "", w)) + 2.5 + (4 if re.search(r"[.,?!…]$", w) else 0)
    total = sum(weight(w) for w in parts)
    span = max(0.2, dur - 0.2)
    out, acc = [], 0.0
    for w in parts:
        out.append((w.lower().strip('.,?!…"'), start + 0.08 + acc / total * span))
        acc += weight(w)
    return out


class Track:
    def __init__(self, seconds: float):
        self.n = int(RATE * seconds)
        self.buf = [0.0] * self.n

    def mix(self, start, dur, make):
        first = int(start * RATE)
        for i in range(int(dur * RATE)):
            k = first + i
            if 0 <= k < self.n:
                self.buf[k] += make(i / RATE)


def write(path: Path, buf: list[float], peak_to: float = 0.8) -> None:
    peak = max(1e-9, max(abs(v) for v in buf))
    g = min(1.0, peak_to / peak)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes(b"".join(int(max(-1, min(1, v * g)) * 32767).to_bytes(2, "little", signed=True) for v in buf))
    print(f"wrote {path}")


if __name__ == "__main__":
    import sys
    print(loudnorm(Path(sys.argv[1]), Path(sys.argv[2])))
