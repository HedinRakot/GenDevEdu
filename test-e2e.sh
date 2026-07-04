#!/usr/bin/env bash
#
# test-e2e.sh — run the Playwright + Clerk E2E suite against the Expo-Web app.
#
# Unlike the old Vite-targeting suite, these tests drive the React-Native-Web
# build and authenticate through Clerk, so they need a running Expo-Web server,
# a reachable backend, and Clerk testing credentials. There is no Docker step —
# Playwright runs on the host (browsers via `npx playwright install`).
#
# Required environment (see e2e/README.md):
#   BASE_URL                 Expo-Web URL (default http://localhost:8081)
#   CLERK_PUBLISHABLE_KEY    Clerk testing instance publishable key
#   CLERK_SECRET_KEY         Clerk testing instance secret key
#   E2E_LEARNER_EMAIL/_PASSWORD   credentials of a learner test user
#   E2E_AUTHOR_EMAIL/_PASSWORD    credentials of an instructor test user
#
# Prerequisites (separate terminals):
#   kubectl -n devedu port-forward svc/backend 8080:8080
#   (cd mobile && npx expo start --web)
#
set -euo pipefail
cd "$(dirname "$0")/e2e"

BASE_URL="${BASE_URL:-http://localhost:8081}"

note() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }

note "Target: $BASE_URL"
note "Installing E2E deps + browsers (first run only)…"
npm install --no-audit --no-fund
npx playwright install --with-deps chromium

note "Running Playwright (Clerk auth)…"
BASE_URL="$BASE_URL" npx playwright test

note "Done. HTML report: e2e/playwright-report/index.html"
