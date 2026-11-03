#!/bin/bash
# Start one nightly run on the render server.
#   nightly/run.sh [DAY] [--live]
# DAY defaults to tomorrow. Without --live it is a dry run: the plan stays in ~/nightly/runs/<DAY>/out/
# and is NOT handed to the phone engine. Only one run at a time.
set -euo pipefail
cd "$(dirname "$0")/.."

DAY="${1:-$(date -d tomorrow +%F)}"
DRY_RUN=1
[[ "${2:-}" == "--live" || "${1:-}" == "--live" ]] && DRY_RUN=0
[[ "$DAY" == "--live" ]] && DAY="$(date -d tomorrow +%F)"

RUN_DIR="$HOME/nightly/runs/$DAY"
mkdir -p "$RUN_DIR/out/videos"
exec 9>"$HOME/nightly/.lock"
flock -n 9 || { echo "another nightly run is in progress"; exit 1; }

PROMPT="$(cat nightly/brief.md)

DAY=$DAY
RUN_DIR=$RUN_DIR
DRY_RUN=$DRY_RUN"

echo "nightly run DAY=$DAY DRY_RUN=$DRY_RUN started $(date -Is)" | tee "$RUN_DIR/run.log"
START=$(date +%s)
set +e
timeout 7h "$HOME/.local/bin/claude" -p "$PROMPT" --model opus --dangerously-skip-permissions \
  --output-format stream-json --verbose > "$RUN_DIR/session.jsonl" 2> "$RUN_DIR/session.err"
CODE=$?
set -e
echo "finished $(date -Is) exit=$CODE minutes=$(( ($(date +%s) - START) / 60 ))" | tee -a "$RUN_DIR/run.log"
tail -1 "$RUN_DIR/session.jsonl" | python3 -c "
import json, sys
try:
    r = json.loads(sys.stdin.read()); print('usage (API-equivalent \$):', round(r.get('total_cost_usd', 0), 2))
except Exception as e: print('no result line:', e)" | tee -a "$RUN_DIR/run.log"
exit $CODE
