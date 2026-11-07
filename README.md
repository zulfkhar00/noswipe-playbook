# noswipe-playbook

The creative half of noswipe's short-video system. Every night an unattended Claude Code session on the render
server reads the stats, decides what to post the coming day, writes and renders the videos (Remotion, 1080x1920,
60 fps masters) and hands a plan to [edge-phone-agent](https://github.com/zulfkhar00/edge-phone-agent), which posts
them from a phone. The same repo holds the formats, stories, rules and the content playbook the session learns into.
Instagram @tinyloveshows is the live account. noswipe.app is a demand test: there is no product yet.

## Past one-off ads

<!-- The scenario-writer agent (.claude/agents/scenario-writer.md) reads this table to avoid repeating personas and hooks. Keep it current. -->

| Ad | Format | Composition | Audio project | Persona / topic | Frame-1 hook |
|---|---|---|---|---|---|
| "I'm his thumb" | one-off (The Thumb) | `Thumb` | `thumb` | his swiping thumb quits | bandaged thumb slaps a resignation letter on the phone |
| "After Midnight" | receipt | `AfterMidnight` | `receipt --episode after-midnight` | the 1 AM swiper, bedroom; example date Maya | phone prints his dating app receipt at 1 AM |
| "Next Stop: Nothing" | receipt | `NextStop` | `receipt --episode next-stop` | the commute swiper, train; example date Jess | phone prints his receipt on the train |
| "Between Sets" | receipt (with a printer-stall twist) | `BetweenSets` | `receipt --episode between-sets` | the gym guy who swipes on every rest; example date Priya | phone prints his receipt on a gym bench, rest timer on the wall |
| "Friday Night, Live" | Pre-Game | `FridayNightLive` | `pregame --episode friday-night-live` | the couch swiper, Friday night; example date Maya | LIVE couch shot, scoreboard "Date plans 0 · Pizza 3" |
| "Seat 14B" | Safety Card | `Seat14B` | `safety --episode seat-14b` | the passenger still swiping at 1 AM on a night flight; example date Maya | safety-card cover "Safety briefing / for dating apps" over the cabin, 14B on his phone |

Formats and their rules are in `FORMATS.md`; results go in `FORMAT_LAB.md`. New ads start with the **scenario-writer** agent.

## The system

```
 render server (IONOS VM, Ubuntu, 4 vCPU / 4 GB, Tailscale 100.102.103.115, user studio)
   cron 08:30 UTC (00:30 PT) -> nightly/run.sh --live
     merge origin/deploy -> claude -p (Opus, brief.md) -> Sonnet subagents -> renders -> ~/outbox/<day>/
     push branch nightly -> GitHub CI -> merged into main
   ~/feedback/  stats.db engine.db research.db accounts.json   <- pushed by the Pi every 10 min
   ~/outbox/<day>/ plan.json + videos/                          -> pulled (and deleted) by the Pi every 10 min
 Raspberry Pi + phone (edge-phone-agent): imports the plan, posts at the planned times, reads stats 1h ... 48h
 healthchecks.io: run.sh pings /start and /<exit code>; a night that fails, never starts or never ends emails the user
```

- The Pi starts every connection (SSH/rsync over Tailscale); this server never reaches the Pi.
- The contract with the phone side is `plan.json` (format: brief.md section 6 and the edge-phone-agent README).
  Rules the engine enforces: captions one line of plain ASCII, first 30 caption characters unique forever (stats
  are matched by them), only accounts with `"use": "noswipe"` in `accounts.json`, posts within each account's `posts_per_day`.
- Timing: the 00:30 run plans the **same** Pacific day (run.sh picks today before 06:00 PT, tomorrow otherwise) and
  never re-plans a day that already has a finished live plan. A run takes about 75 min; first post is 12:30.

## The nightly run

`nightly/run.sh [DAY] [--live]` (without `--live` it is a dry run: the plan stays in `~/nightly/runs/<DAY>/out/`).
1. Takes a lock, pings healthchecks (`~/nightly/health.url`), merges `origin/deploy` into the local `nightly` branch
   (`npm ci` when the lock file changed).
2. Starts `claude -p "<nightly/brief.md> + DAY, RUN_DIR, DRY_RUN" --model opus --dangerously-skip-permissions`,
   7 h timeout, transcript in `RUN_DIR/session.jsonl`. Runs on the Claude subscription (no API key).
3. The session, following `nightly/brief.md`: **read** (handoff, rules, ledger, stats DBs) -> **learn**
   (`learn.md`, `nightly/judge_vs_stats.py`) -> **decide** (`decision.md`: episodes and 2-3 hook variants each to
   fill capacity) -> **make** (subagents) -> **render** one at a time -> **plan** (`out/plan.json`, then
   `~/outbox/.<DAY>.part` renamed to `~/outbox/<DAY>`) -> **record** (append to `nightly/LEDGER.json`, update
   `STORIES.md` / `FORMAT_LAB.md` / `CONTENT_PLAYBOOK.md`, commit on `nightly`) -> `summary.md`.
4. run.sh pushes `nightly`, logs minutes and API-equivalent cost, pings healthchecks with the exit code.

Output per night: `~/nightly/runs/<DAY>/` (`learn.md`, `decision.md`, `summary.md`, scripts, stills, review strips,
logs, `out/`). Cron log: `~/nightly/cron.log`.

Subagents (`.claude/agents/`, all Sonnet; the Opus session only reads, decides and unblocks):

| Agent | Job |
|---|---|
| `scenario-writer` | Pitches 5 ideas for a new season/format/episode, then writes the chosen script + JSON spec |
| `episode-maker` | Builds one episode: spec, Remotion code, audio, hook variants (input prop `hook` = "a"/"b"/"c", only the first ~3 s differ), checks stills, fixes |
| `blind-checker` | Fresh-eyes check from stills and on-screen text only; scores clarity (must be >= 7), hook per variant, satisfaction, want-next |

Hard limits (from the brief): never post or push from the session, never edit `.env` or the harness
(`nightly/brief.md`, `nightly/run.sh`, `nightly/*.py`, `.claude/`, `.github/`), only ElevenLabs as a paid API,
videos at most 60 s, one render at a time (4 GB RAM), bundled fonts only.

## Knowledge files (read and updated by the run)

| File | Holds |
|---|---|
| `~/nightly/content-handoff.md` (server only, not in git) | Product, formats, rules: the source of truth |
| `AGENTS.md` | Rules every video follows: clarity first, honest claims, no app logos/UI, ad-safe layout (nothing critical in top 270 px / bottom 670 px), voice, fonts |
| `CONTENT_PLAYBOOK.md` | What gets watched: hook, watch time, spread; tagged `ours` / `ref` / `general`. Reference examples are added by the user only |
| `STORIES.md` | The story account: seasons, casts, continuity rules |
| `FORMATS.md`, `FORMAT_LAB.md` | Direct-ad formats; results table and the double-down / iterate / kill rule |
| `nightly/LEDGER.json` | Every post ever planned: id, day, account, format, season, episode, hook, caption, video, blind-checker scores |
| "Past one-off ads" above | Past one-off ads, so the scenario-writer doesn't repeat personas and hooks |

## Code map

- `src/index.ts` -> `src/root.tsx`: registers every composition (`npx remotion compositions src/index.ts` lists them).
- `src/stories/<season>/`: story seasons (`world.tsx` shared look and cast, `epN.tsx` episodes, `*.timeline.json`
  voice/beat timing). Seasons: across, swipes, dryer, alley, groupchat, ring.
- `src/receipt/`, `src/pregame/`, `src/safety/`, `src/thumb/`: direct-ad formats.
- `src/brand/`: brand tokens, cards, pills, logo, characters. `src/account/`: account assets.
- `src/lib/`: `space.tsx` (2.5D planes, camera, depth of field, `Shadow`), `shots.tsx` (`SwipeCuts`, `MotionBlurWhen`),
  `speech.ts` (word timing, captions, lip-sync from timelines), `motion.ts`, `fonts.ts` (bundled fonts in
  `public/fonts`; no network at render time).
- `specs/`: JSON episode specs (`specs/stories/` for seasons).
- Audio: `generate_elevenlabs_voice.py --project <p>` (ElevenLabs takes with character timestamps into
  `public/voice-<p>/`), `generate_<format>_audio.py` (trim takes, write the timeline, compose score and SFX in code),
  `audio_kit.py` (shared helpers, two-pass loudness normalisation of the final mix).
- `ai/`: experiments with Gemini images (`GEMINI_API_KEY`) and Kling video on fal.ai (`FAL_KEY`). Not used by the run.
- `src/lib/` and `audio_kit.py` started as a copy of the flagd project's engine; port improvements by hand.

## Setup

Render server (Ubuntu): Node 22, `npm ci`, Python 3, system ffmpeg, Claude Code at `~/.local/bin/claude` logged in
to the subscription, Tailscale, a GitHub deploy key with write access (`~/.ssh/github_noswipe`, host alias
`github-noswipe`). Then:
```bash
git clone github-noswipe:zulfkhar00/noswipe-playbook.git ~/noswipe-videos && cd ~/noswipe-videos
git checkout nightly && npm ci
cp .env.example .env                       # ELEVENLABS_API_KEY=...
echo "https://hc-ping.com/<uuid>" > ~/nightly/health.url && chmod 600 ~/nightly/health.url
mkdir -p ~/outbox ~/feedback               # the Pi fills feedback/ and empties outbox/
crontab -e   # PATH=/home/studio/.local/bin:/usr/local/bin:/usr/bin:/bin
             # 30 8 * * * cd /home/studio/noswipe-videos && nightly/run.sh --live >> /home/studio/nightly/cron.log 2>&1
```
Add the Pi's SSH public key to `~/.ssh/authorized_keys`. `/etc/cron.d/render-cleanup` (root, hourly) deletes old
renders and temp files.

Make an episode by hand (Mac or server):
```bash
npm ci && cp .env.example .env
npx remotion studio src/index.ts                                    # preview
python3 generate_elevenlabs_voice.py --project <p> && python3 generate_<format>_audio.py <spec-id>
npx remotion render src/index.ts <Comp> out/<id>-raw.mp4 --props='{"hook":"a"}' --concurrency=2
python3 audio_kit.py out/<id>-raw.mp4 out/<id>.mp4
nightly/run.sh 2026-12-01                                           # a full dry run (uses subscription quota)
```

## Operate

```bash
ssh studio@100.102.103.115
tail ~/nightly/cron.log                    # one line per run: started / finished exit=N minutes=M usage
cat ~/nightly/runs/<DAY>/summary.md        # what it made and why; decision.md, learn.md for detail
claude -p /usage                           # subscription usage (session / week)
```

## CI/CD

- **CI** (`.github/workflows/ci.yml`, pushes to `main`/`nightly` and PRs): `tsc --noEmit`, compile Python,
  `nightly/check_ledger.py` (unique ids and 30-char caption keys, typeable captions, checker scores on engine posts),
  `bash -n nightly/run.sh`, every composition registers.
- **Code to the server**: green `main` moves `deploy`; run.sh merges `origin/deploy` into `nightly` before each run
  (on a conflict it runs on the current code and logs a warning).
- **Night's work back**: the server pushes `nightly`; when green, CI merges it into `main` and moves `deploy`. A
  night that touched the harness, or a merge conflict, opens a pull request instead, and later nights stay unmerged
  until it is resolved.

## Contributing

- People work on `main` (or PRs into it); the server's checkout lives on `nightly`. Don't edit the server checkout
  while a run is going (00:30-02:30 PT).
- Changing the harness (`nightly/brief.md`, `nightly/run.sh`, `nightly/*.py`, `.claude/`) changes what every night
  does: keep the brief short and explicit, and keep its hard limits.
- New formats follow `AGENTS.md`/handoff rules: a new look per format, brand only at the brand moments, honest
  claims, clarity in the first 3 s, at most 60 s.
- Never commit `.env`, `out/`, rendered audio (`public/audio/`, `public/voice-*-trimmed/`) or `ai/out/`.
