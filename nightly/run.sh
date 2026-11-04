#!/bin/bash
# Start one nightly run on the render server.
#   nightly/run.sh [DAY] [--live]
# DAY defaults to tomorrow in Pacific time (the phone and its posting rounds live there; this server runs on UTC).
# Without --live it is a dry run: the plan stays in ~/nightly/runs/<DAY>/out/
# and is NOT handed to the phone engine. Only one run at a time.
set -euo pipefail
cd "$(dirname "$0")/.."
export POST_TZ="America/Los_Angeles"
tomorrow() { TZ="$POST_TZ" date -d tomorrow +%F; }

DAY="${1:-$(tomorrow)}"
DRY_RUN=1
[[ "${2:-}" == "--live" || "${1:-}" == "--live" ]] && DRY_RUN=0
[[ "$DAY" == "--live" ]] && DAY="$(tomorrow)"

RUN_DIR="$HOME/nightly/runs/$DAY"
mkdir -p "$RUN_DIR/out/videos"
exec 9>"$HOME/nightly/.lock"
flock -n 9 || { echo "another nightly run is in progress"; exit 1; }
LOG="$RUN_DIR/run.log"
: > "$LOG"

# CD: bring in reviewed code first (CI moves origin/deploy after green checks). Tonight's run goes on with the
# current code if anything here fails.
git checkout -q nightly
if timeout 120 git fetch -q origin deploy 2>>"$LOG"; then
  BEFORE=$(git rev-parse HEAD)
  if git merge -q --no-edit origin/deploy >>"$LOG" 2>&1; then
    echo "code: merged origin/deploy ($(git rev-parse --short origin/deploy)) into nightly" | tee -a "$LOG"
    if ! git diff --quiet "$BEFORE" HEAD -- package-lock.json; then
      npm ci --no-audit --no-fund >>"$LOG" 2>&1 || echo "WARN: npm ci failed" | tee -a "$LOG"
    fi
  else
    git merge --abort 2>/dev/null
    echo "WARN: could not merge origin/deploy (conflict?): running on the current code" | tee -a "$LOG"
  fi
else
  echo "WARN: could not fetch origin/deploy: running on the current code" | tee -a "$LOG"
fi

PROMPT="$(cat nightly/brief.md)

DAY=$DAY
RUN_DIR=$RUN_DIR
DRY_RUN=$DRY_RUN"

echo "nightly run DAY=$DAY DRY_RUN=$DRY_RUN started $(date -Is)" | tee -a "$LOG"
START=$(date +%s)
set +e
timeout 7h "$HOME/.local/bin/claude" -p "$PROMPT" --model opus --dangerously-skip-permissions \
  --output-format stream-json --verbose > "$RUN_DIR/session.jsonl" 2> "$RUN_DIR/session.err"
CODE=$?
set -e
# back up tonight's commits (episodes, ledger) to GitHub; CI checks them and merges them into main
timeout 120 git push -q origin nightly >>"$LOG" 2>&1 && echo "code: pushed nightly" | tee -a "$LOG" \
  || echo "WARN: could not push nightly" | tee -a "$LOG"
echo "finished $(date -Is) exit=$CODE minutes=$(( ($(date +%s) - START) / 60 ))" | tee -a "$LOG"
tail -1 "$RUN_DIR/session.jsonl" | python3 -c "
import json, sys
try:
    r = json.loads(sys.stdin.read()); print('usage (API-equivalent \$):', round(r.get('total_cost_usd', 0), 2))
except Exception as e: print('no result line:', e)" | tee -a "$LOG"
exit $CODE
