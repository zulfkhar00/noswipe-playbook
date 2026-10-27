# noswipe-videos

Short vertical (1080×1920, 60 fps) 2.5D motion-graphics ads for NoSwipe, drawn as SVG in Remotion. See `AGENTS.md` for the rules every video follows.

<!-- The scenario-writer agent (.claude/agents/scenario-writer.md) reads this table to avoid repeating personas and hooks. Keep it current. -->

| Ad | Format | Composition | Audio project | Persona / topic | Frame-1 hook |
|---|---|---|---|---|---|
| "I'm his thumb" | one-off (The Thumb) | `Thumb` | `thumb` | his swiping thumb quits | bandaged thumb slaps a resignation letter on the phone |
| "After Midnight" | receipt | `AfterMidnight` | `receipt --episode after-midnight` | the 1 AM swiper, bedroom; example date Maya | phone prints his dating app receipt at 1 AM |
| "Next Stop: Nothing" | receipt | `NextStop` | `receipt --episode next-stop` | the commute swiper, train; example date Jess | phone prints his receipt on the train |
| "Between Sets" | receipt (with a printer-stall twist) | `BetweenSets` | `receipt --episode between-sets` | the gym guy who swipes on every rest; example date Priya | phone prints his receipt on a gym bench, rest timer on the wall |
| "Friday Night, Live" | Pre-Game | `FridayNightLive` | `pregame --episode friday-night-live` | the couch swiper, Friday night; example date Maya | LIVE couch shot, scoreboard "Date plans 0 · Pizza 3" |

Formats and their rules are in `FORMATS.md`; results go in `FORMAT_LAB.md`. New ads start with the **scenario-writer** agent.

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
