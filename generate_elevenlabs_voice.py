"""Render an episode's narration with ElevenLabs text-to-speech.

    python3 generate_elevenlabs_voice.py --list-voices      # voices on your account
    python3 generate_elevenlabs_voice.py --project thumb             # all missing lines
    python3 generate_elevenlabs_voice.py --project thumb --only 6 12 --force   # redo lines

Reads ELEVENLABS_API_KEY (required), ELEVENLABS_VOICE_ID and ELEVENLABS_MODEL from the environment
or from cartoon-3d-pilot/.env. Each project module supplies LINES, RECORDED (where the takes go)
and optional VOICE_ID / VOICE_OVERRIDES; its own audio script then trims the takes and lays out the timeline.
A full episode costs roughly one character of quota per character of script (~800).
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import ssl
import sys
import urllib.error
import urllib.request
from pathlib import Path

import importlib

ROOT = Path(__file__).parent
PROJECTS = {"thumb": "generate_thumb_audio", "receipt": "generate_receipt_audio", "pregame": "generate_pregame_audio", "story": "generate_story_audio"}

API = "https://api.elevenlabs.io/v1"
DEFAULT_VOICE = "R9RZPy40Zzy1wNxrgQpj"  # "Witty McGee": the NoSwipe narrator.
DEFAULT_MODEL = "eleven_multilingual_v2"

# Baseline delivery; lower stability = more expressive. Projects tune lines via VOICE_OVERRIDES.
DEFAULT = {"stability": 0.38, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True, "speed": 1.06}


def load_env() -> None:
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text().splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def context() -> ssl.SSLContext:
    # Managed Macs may use an HTTPS proxy trusted only by the macOS keychain. Verification stays on.
    try:
        import truststore
        return truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    except ImportError:
        return ssl.create_default_context()


def request(path: str, key: str, body: dict | None = None) -> bytes:
    req = urllib.request.Request(f"{API}{path}", data=json.dumps(body).encode() if body else None,
                                 headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "*/*"},
                                 method="POST" if body else "GET")
    try:
        with urllib.request.urlopen(req, context=context(), timeout=120) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs {e.code}: {e.read().decode(errors='replace')[:400]}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--list-voices", action="store_true")
    ap.add_argument("--only", type=int, nargs="*", help="line numbers to render")
    ap.add_argument("--force", action="store_true", help="overwrite existing takes")
    ap.add_argument("--voice", default=None)
    ap.add_argument("--project", choices=sorted(PROJECTS), required=True)
    ap.add_argument("--episode", default=None, help="episode id, for projects driven by specs/<id>.json")
    args = ap.parse_args()
    load_env()
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("Set ELEVENLABS_API_KEY in cartoon-3d-pilot/.env first.")
    if args.list_voices:
        for v in json.loads(request("/voices", key))["voices"]:
            labels = ", ".join(f"{k}: {x}" for k, x in (v.get("labels") or {}).items())
            print(f"{v['voice_id']}  {v['name']:<22} {labels}")
        return
    project = importlib.import_module(PROJECTS[args.project])
    if hasattr(project, "configure"):
        if not args.episode:
            sys.exit(f"--project {args.project} needs --episode")
        project.configure(args.episode)
    LINES, RECORDED = project.LINES, project.RECORDED
    overrides = getattr(project, "VOICE_OVERRIDES", {})
    # Multi-voice stories cast a voice per line (LINE_VOICES: line number -> voice id).
    line_voices = getattr(project, "LINE_VOICES", {})
    # A project can pin its own narrator (e.g. a different brand); otherwise the .env default applies.
    voice = args.voice or getattr(project, "VOICE_ID", None) or os.environ.get("ELEVENLABS_VOICE_ID") or DEFAULT_VOICE
    model = os.environ.get("ELEVENLABS_MODEL") or DEFAULT_MODEL
    RECORDED.mkdir(parents=True, exist_ok=True)
    texts = [t for _, t in LINES]
    for n, text in enumerate(texts, 1):
        if args.only and n not in args.only:
            continue
        target = RECORDED / f"line-{n:02d}.mp3"
        others = [RECORDED / f"line-{n:02d}{ext}" for ext in (".wav", ".m4a")]
        if not args.force and (target.exists() or any(o.exists() for o in others)):
            print(f"line-{n:02d} exists, skipping (use --force to redo)")
            continue
        body = {
            "text": text,
            "model_id": model,
            "voice_settings": {**DEFAULT, **overrides.get(n, {})},
            # Neighbouring lines keep the intonation continuous across separate takes.
            # (Skipped when lines have different speakers, so one voice's intonation doesn't bleed into another's.)
            "previous_text": None if line_voices else " ".join(texts[max(0, n - 3):n - 1]) or None,
            "next_text": None if line_voices else (texts[n] if n < len(texts) else None),
        }
        # The with-timestamps endpoint returns the audio plus per-character timing, which drives exact
        # caption timing and lip-sync downstream (saved as line-NN.align.json beside the take).
        res = json.loads(request(f"/text-to-speech/{line_voices.get(n, voice)}/with-timestamps?output_format=mp3_44100_128", key, body))
        audio = base64.b64decode(res["audio_base64"])
        target.write_bytes(audio)
        al = res.get("normalized_alignment") or res.get("alignment") or {}
        target.with_suffix(".align.json").write_text(json.dumps({"chars": al.get("characters", []),
            "start": al.get("character_start_times_seconds", []), "end": al.get("character_end_times_seconds", [])}))
        print(f"line-{n:02d} {len(audio) // 1024} KB  {text}")


if __name__ == "__main__":
    main()
