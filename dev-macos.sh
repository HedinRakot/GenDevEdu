#!/usr/bin/env bash
#
# dev-macos.sh — lokale Entwicklungsumgebung für macOS + iOS.
#
# Kein Kubernetes: MongoDB läuft als Podman-Container, das .NET-Backend
# nativ via `dotnet run` (Port 8080), die Expo-App im iOS-Simulator oder
# auf einem echten Gerät.
#
# Zwei Modi:
#   Standard   Backend bindet localhost:8080 — App-Default aus
#              mobile/src/config/env.ts, funktioniert für den iOS-Simulator
#              (teilt sich das Host-Loopback). Keine weitere Config nötig.
#   --lan      Backend bindet 0.0.0.0:8080 (im WLAN erreichbar) und
#              mobile/.env.local wird auf die LAN-IP des Macs gesetzt.
#              Nötig für echte Geräte (Expo Go / Dev-Build) — der Simulator
#              funktioniert damit ebenso.
#
# Befehle:
#   ./dev-macos.sh up [--lan]   Mongo-Container + Backend starten (Default)
#   ./dev-macos.sh ios [--lan]  Expo im iOS-Simulator öffnen (setzt `up` voraus)
#   ./dev-macos.sh status       Zeigt, was läuft
#   ./dev-macos.sh logs         Folgt dem Backend-Log
#   ./dev-macos.sh down         Backend stoppen + Mongo-Container anhalten
#
# Voraussetzungen: dotnet 10 SDK, Node/npm, Podman (Machine), Xcode + Simulator.
# Echtes Gerät: Mac + iPhone im selben WLAN, Firewall lässt Port 8080 zu.
#
set -euo pipefail
cd "$(dirname "$0")"

MONGO_CONTAINER="devedu-mongo"
MONGO_VOLUME="devedu-mongo-data"
MONGO_IMAGE="docker.io/library/mongo:7"
MONGO_PORT="27017"
BACKEND_PORT="8080"
STATE_DIR=".dev-macos"
BACKEND_LOG="${STATE_DIR}/backend.log"
BACKEND_PID="${STATE_DIR}/backend.pid"
ENV_LOCAL="mobile/.env.local"
ENV_EXAMPLE="mobile/.env.example"

# Health-Check läuft immer über localhost (auch bei 0.0.0.0-Bindung erreichbar).
HEALTH_URL="http://localhost:${BACKEND_PORT}"

note()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
ok()    { printf '\033[1;32m[ok]\033[0m %s\n' "$*"; }
warn()  { printf '\033[1;33m[!]\033[0m %s\n' "$*"; }
die()   { printf '\033[1;31m[x]\033[0m %s\n' "$*" >&2; exit 1; }

mkdir -p "$STATE_DIR"

# --- Argumente: --lan-Flag herauslösen ---------------------------------------
LAN=0
ARGS=()
for a in "$@"; do
  case "$a" in
    --lan) LAN=1 ;;
    *)     ARGS+=("$a") ;;
  esac
done
set -- "${ARGS[@]+"${ARGS[@]}"}"

lan_ip() { ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1"; }

# --- preflight ---------------------------------------------------------------
preflight() {
  command -v dotnet >/dev/null || die "dotnet SDK nicht gefunden (brew install --cask dotnet-sdk)."
  command -v node   >/dev/null || die "node nicht gefunden (brew install node)."
  command -v podman >/dev/null || die "podman nicht gefunden (brew install podman)."
}

ensure_podman_machine() {
  if ! podman info >/dev/null 2>&1; then
    note "Podman-Machine ist nicht bereit — starte sie."
    podman machine start || die "Konnte Podman-Machine nicht starten (podman machine init && podman machine start)."
  fi
}

# Setzt EXPO_PUBLIC_API_BASE_URL in mobile/.env.local (legt Datei bei Bedarf an).
sync_env_local_api() {
  local url="$1"
  if [ ! -f "$ENV_LOCAL" ]; then
    [ -f "$ENV_EXAMPLE" ] && cp "$ENV_EXAMPLE" "$ENV_LOCAL" || : > "$ENV_LOCAL"
  fi
  # bestehende (auch auskommentierte) API-URL-Zeilen entfernen, dann neu setzen
  grep -vE '^[[:space:]]*#?[[:space:]]*EXPO_PUBLIC_API_BASE_URL=' "$ENV_LOCAL" > "${ENV_LOCAL}.tmp" || true
  printf 'EXPO_PUBLIC_API_BASE_URL=%s\n' "$url" >> "${ENV_LOCAL}.tmp"
  mv "${ENV_LOCAL}.tmp" "$ENV_LOCAL"
  ok "${ENV_LOCAL}: EXPO_PUBLIC_API_BASE_URL=${url}"
}

# --- MongoDB (Podman-Container) ----------------------------------------------
start_mongo() {
  ensure_podman_machine
  if podman ps --format '{{.Names}}' | grep -qx "$MONGO_CONTAINER"; then
    ok "MongoDB-Container '$MONGO_CONTAINER' läuft bereits."
  elif podman ps -a --format '{{.Names}}' | grep -qx "$MONGO_CONTAINER"; then
    note "Starte vorhandenen MongoDB-Container '$MONGO_CONTAINER'."
    podman start "$MONGO_CONTAINER" >/dev/null
  else
    note "Erzeuge MongoDB-Container auf localhost:${MONGO_PORT} (Image: $MONGO_IMAGE)."
    podman volume inspect "$MONGO_VOLUME" >/dev/null 2>&1 || podman volume create "$MONGO_VOLUME" >/dev/null
    podman run -d --name "$MONGO_CONTAINER" \
      -p "127.0.0.1:${MONGO_PORT}:27017" \
      -v "${MONGO_VOLUME}:/data/db" \
      --restart=unless-stopped \
      "$MONGO_IMAGE" >/dev/null
    ok "MongoDB gestartet."
  fi
}

# --- Backend (.NET, nativ) ---------------------------------------------------
backend_running() {
  [ -f "$BACKEND_PID" ] && kill -0 "$(cat "$BACKEND_PID")" 2>/dev/null
}

start_backend() {
  if backend_running; then
    ok "Backend läuft bereits (PID $(cat "$BACKEND_PID"))."
    return
  fi
  if [ "$LAN" -eq 1 ]; then
    local ip; ip="$(lan_ip)"
    note "LAN-Modus: Backend bindet 0.0.0.0:${BACKEND_PORT} → im WLAN unter http://${ip}:${BACKEND_PORT}"
    ( cd backend && exec env ASPNETCORE_URLS="http://0.0.0.0:${BACKEND_PORT}" ASPNETCORE_ENVIRONMENT=Development \
        dotnet run --no-launch-profile ) >"$BACKEND_LOG" 2>&1 &
  else
    note "Starte Backend (dotnet run) → ${HEALTH_URL}, Log: ${BACKEND_LOG}"
    # launchSettings-Profil 'http' bindet localhost:8080, Env=Development.
    ( cd backend && exec dotnet run --launch-profile http ) >"$BACKEND_LOG" 2>&1 &
  fi
  echo $! > "$BACKEND_PID"

  note "Warte auf das Backend (der erste net10-Build kann 1-2 Min dauern)..."
  for _ in $(seq 1 120); do
    if curl -s -o /dev/null "${HEALTH_URL}/api/courses" 2>/dev/null; then
      ok "Backend antwortet."
      return
    fi
    if ! backend_running; then
      warn "Backend-Prozess ist beendet. Letzte Log-Zeilen:"
      tail -n 25 "$BACKEND_LOG" || true
      die "Backend konnte nicht starten."
    fi
    sleep 2
  done
  warn "Backend antwortet nach 240s noch nicht — läuft evtl. noch der Build. Prüfe: ./dev-macos.sh logs"
}

# --- iOS (Simulator / Gerät) -------------------------------------------------
run_ios() {
  command -v xcrun >/dev/null || die "Xcode/Simulator nicht gefunden (Xcode aus dem App Store installieren)."
  backend_running || warn "Backend läuft nicht — zuerst './dev-macos.sh up' ausführen (App startet sonst im Offline-Modus)."
  [ -d mobile/node_modules ] || ( note "Installiere npm-Abhängigkeiten..."; cd mobile && npm install )
  if [ "$LAN" -eq 1 ]; then
    sync_env_local_api "http://$(lan_ip):${BACKEND_PORT}"
    note "LAN-Modus: für ein echtes Gerät QR-Code scannen (Expo Go) oder Dev-Build bauen:"
    note "  Gerät (Dev-Build, alle Native-Module):  (cd mobile && npx expo run:ios --device)"
    ( cd mobile && exec npx expo start )
  else
    note "Öffne Expo im iOS-Simulator (managed workflow, Expo Go / Dev-Client)."
    note "Alternativ für einen vollständigen nativen Build: (cd mobile && npm run ios)"
    ( cd mobile && exec npx expo start --ios )
  fi
}

# --- Steuerung ---------------------------------------------------------------
cmd_up() {
  preflight
  start_mongo
  start_backend
  local api_url="${HEALTH_URL}"
  [ "$LAN" -eq 1 ] && api_url="http://$(lan_ip):${BACKEND_PORT}"
  [ "$LAN" -eq 1 ] && sync_env_local_api "${api_url}"
  cat <<EOF

$(ok "Umgebung bereit.")
  Backend-API : ${api_url}/api
  MongoDB     : mongodb://localhost:${MONGO_PORT}  (Container '${MONGO_CONTAINER}')
  Backend-Log : ${BACKEND_LOG}
EOF
  if [ "$LAN" -eq 1 ]; then
    cat <<EOF

LAN-Modus aktiv — App auf echtem Gerät (Mac + iPhone im selben WLAN):
  • Expo Go:   ./dev-macos.sh ios --lan   → QR-Code mit der iPhone-Kamera scannen
  • Dev-Build: (cd mobile && npx expo run:ios --device)
  Firewall muss Port ${BACKEND_PORT} zulassen (Systemeinstellungen → Netzwerk → Firewall).

Stoppen:  ./dev-macos.sh down
EOF
  else
    cat <<EOF

Nächster Schritt — App im iOS-Simulator öffnen:
    ./dev-macos.sh ios

Für ein echtes Gerät stattdessen:  ./dev-macos.sh up --lan
Stoppen:  ./dev-macos.sh down
EOF
  fi
}

cmd_down() {
  if backend_running; then
    note "Stoppe Backend (PID $(cat "$BACKEND_PID"))."
    kill "$(cat "$BACKEND_PID")" 2>/dev/null || true
    rm -f "$BACKEND_PID"
  else
    note "Backend läuft nicht."
  fi
  if podman ps --format '{{.Names}}' 2>/dev/null | grep -qx "$MONGO_CONTAINER"; then
    note "Halte MongoDB-Container an (Daten bleiben im Volume '${MONGO_VOLUME}')."
    podman stop "$MONGO_CONTAINER" >/dev/null || true
  fi
  ok "Gestoppt."
}

cmd_status() {
  if backend_running; then ok "Backend läuft (PID $(cat "$BACKEND_PID")) — Port ${BACKEND_PORT}"; else warn "Backend läuft nicht."; fi
  if podman ps --format '{{.Names}}' 2>/dev/null | grep -qx "$MONGO_CONTAINER"; then
    ok "MongoDB-Container läuft."
  else
    warn "MongoDB-Container läuft nicht."
  fi
}

cmd_logs() {
  [ -f "$BACKEND_LOG" ] || die "Kein Backend-Log gefunden. Zuerst './dev-macos.sh up'."
  note "Folge ${BACKEND_LOG} (Ctrl-C zum Beenden)."
  tail -f "$BACKEND_LOG"
}

case "${1:-up}" in
  up)     cmd_up ;;
  ios)    run_ios ;;
  down)   cmd_down ;;
  status) cmd_status ;;
  logs)   cmd_logs ;;
  *) die "Unbekannter Befehl: ${1}. Nutze: up | ios | down | status | logs  (optional: --lan)" ;;
esac
