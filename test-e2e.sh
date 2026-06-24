#!/usr/bin/env bash
#
# test-e2e.sh — run the Playwright E2E suite against the deployed app.
#
# Runs the official Playwright Docker image (browsers preinstalled) so the host
# needs neither Node nor browsers. Uses host networking + an /etc/hosts entry for
# devedu.localhost so the container can reach the Traefik ingress on port 80.
#
#   BASE_URL   override target (default http://devedu.localhost)
#
set -euo pipefail
cd "$(dirname "$0")"

BASE_URL="${BASE_URL:-http://devedu.localhost}"
PW_IMAGE="mcr.microsoft.com/playwright:v1.48.0-noble"

note() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }

note "Target: $BASE_URL"
note "Running Playwright in Docker ($PW_IMAGE)..."

# --add-host ensures devedu.localhost resolves to the host loopback inside the
# container; --network host lets it reach the Traefik ingress bound on :80.
docker run --rm \
  --network host \
  --add-host devedu.localhost:127.0.0.1 \
  -e BASE_URL="$BASE_URL" \
  -e CI=1 \
  -v "$PWD/e2e:/work" \
  -w /work \
  "$PW_IMAGE" \
  bash -lc 'npm install --no-audit --no-fund && npx playwright test'

note "Done. HTML report: e2e/playwright-report/index.html"
