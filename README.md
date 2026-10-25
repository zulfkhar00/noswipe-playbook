# noswipe-videos

Short vertical (1080×1920, 60 fps) 2.5D motion-graphics ads for NoSwipe, drawn as SVG in Remotion. See `AGENTS.md` for the rules every video follows.

| Ad | Composition | Audio project | Length |
|---|---|---|---|
| "I'm his thumb" | `Thumb` | `thumb` | ≈32 s |

## Make or re-render an ad

```bash
npm install
cp .env.example .env            # add ELEVENLABS_API_KEY
python3 generate_elevenlabs_voice.py --project thumb   # takes + character timestamps → public/voice-thumb/
python3 generate_thumb_audio.py                        # trims takes, writes src/thumb/timeline.json, score + SFX
npm run render:thumb                                   # → out/thumb.mp4, two-pass loudness normalised
```

## Code map

- `src/brand/`: brand tokens, cards, pills, logo, avatars, and the characters (the thumb, the guy).
- `src/thumb/`: the "I'm his thumb" ad and its voice-driven timeline.
- `src/lib/space.tsx`: 2.5D planes, perspective camera, depth of field, soft shadows (`Shadow`).
- `src/lib/shots.tsx`: `SwipeCuts` transition and selective motion blur (`MotionBlurWhen`).
- `src/lib/speech.ts`: word timing, captions and lip-sync from the timeline.
- `src/lib/fonts.ts`: bundled brand fonts (no network at render time).
- `audio_kit.py`, `generate_*_audio.py`, `generate_elevenlabs_voice.py`: the audio pipeline.

The engine files in `src/lib/` and `audio_kit.py` started as a copy of the flagd project's engine. Port improvements across by hand.
