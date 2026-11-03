"""Generate a still with Nano Banana Pro (Gemini 3 Pro Image) for the AI-visuals experiment.

    python3 ai/gen_image.py OUT.png "prompt" [--ref ref1.png ...] [--aspect 9:16] [--size 2K]

Reads GEMINI_API_KEY from .env (git-ignored). Reference images keep characters consistent
across shots. Outputs go to ai/out/ (git-ignored).
"""
import argparse, base64, json, mimetypes, ssl, sys, urllib.request
from pathlib import Path

import certifi

ROOT = Path(__file__).resolve().parent.parent
MODEL = "gemini-3-pro-image"


def key() -> str:
    for line in (ROOT / ".env").read_text().splitlines():
        if line.startswith("GEMINI_API_KEY="):
            return line.split("=", 1)[1].strip()
    sys.exit("GEMINI_API_KEY missing from .env")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("out"); ap.add_argument("prompt")
    ap.add_argument("--ref", nargs="*", default=[]); ap.add_argument("--aspect", default="9:16"); ap.add_argument("--size", default="2K")
    a = ap.parse_args()
    parts = [{"inline_data": {"mime_type": mimetypes.guess_type(r)[0] or "image/png", "data": base64.b64encode(Path(r).read_bytes()).decode()}} for r in a.ref]
    parts.append({"text": a.prompt})
    body = {"contents": [{"parts": parts}], "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": a.aspect, "imageSize": a.size}}}
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent", data=json.dumps(body).encode(),
                                 headers={"x-goog-api-key": key(), "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, context=ssl.create_default_context(cafile=certifi.where()), timeout=300) as r:
            res = json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"Gemini {e.code}: {e.read().decode()[:400]}")
    for c in res.get("candidates", []):
        for p in c.get("content", {}).get("parts", []):
            d = p.get("inline_data") or p.get("inlineData")
            if d:
                Path(a.out).parent.mkdir(parents=True, exist_ok=True)
                Path(a.out).write_bytes(base64.b64decode(d["data"]))
                print("wrote", a.out)
                return
    sys.exit(f"no image returned: {json.dumps(res)[:400]}")


if __name__ == "__main__":
    main()
