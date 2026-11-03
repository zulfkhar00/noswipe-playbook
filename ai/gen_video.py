"""Animate a start frame with Kling on fal.ai (queue API) for the AI-visuals experiment.

    python3 ai/gen_video.py MODEL START.png OUT.mp4 "prompt" [--duration 3] [--resolution 1080p]

MODEL is v3 (fal-ai/kling-video/v3/pro/image-to-video) or v4 (kling/v4/image-to-video).
Reads FAL_KEY from .env (git-ignored); the start frame is sent inline as a data URI.
"""
from __future__ import annotations
import argparse, base64, json, ssl, sys, time, urllib.request
from pathlib import Path

import certifi

ROOT = Path(__file__).resolve().parent.parent
MODELS = {"v3": "fal-ai/kling-video/v3/pro/image-to-video", "v4": "kling/v4/image-to-video"}
CTX = ssl.create_default_context(cafile=certifi.where())


def key() -> str:
    for line in (ROOT / ".env").read_text().splitlines():
        if line.startswith("FAL_KEY="):
            return line.split("=", 1)[1].strip()
    sys.exit("FAL_KEY missing from .env")


def call(url: str, body: dict | None = None) -> dict:
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Authorization": "Key " + key(), "Content-Type": "application/json"}, method="POST" if body is not None else "GET")
    try:
        with urllib.request.urlopen(req, context=CTX, timeout=120) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"fal {e.code}: {e.read().decode()[:400]}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("model", choices=MODELS); ap.add_argument("start"); ap.add_argument("out"); ap.add_argument("prompt")
    ap.add_argument("--duration", type=int, default=3); ap.add_argument("--resolution", default="1080p")
    a = ap.parse_args()
    uri = "data:image/png;base64," + base64.b64encode(Path(a.start).read_bytes()).decode()
    body = {"start_image_url": uri, "prompt": a.prompt}
    if a.model == "v3":
        body.update({"duration": str(a.duration), "generate_audio": False, "negative_prompt": "blur, distort, low quality, extra fingers, text, subtitles"})
    else:
        body.update({"duration": a.duration, "resolution": a.resolution})
    sub = call(f"https://queue.fal.run/{MODELS[a.model]}", body)
    status_url, response_url = sub["status_url"], sub["response_url"]
    t0 = time.time()
    while True:
        st = call(status_url)
        if st.get("status") == "COMPLETED":
            break
        if time.time() - t0 > 900:
            sys.exit(f"timed out; request {sub.get('request_id')}")
        time.sleep(8)
    res = call(response_url)
    url = res["video"]["url"]
    with urllib.request.urlopen(url, context=CTX, timeout=300) as r:
        Path(a.out).parent.mkdir(parents=True, exist_ok=True)
        Path(a.out).write_bytes(r.read())
    print(f"wrote {a.out} in {time.time() - t0:.0f}s")


if __name__ == "__main__":
    main()
