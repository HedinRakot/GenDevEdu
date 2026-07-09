#!/bin/sh
set -e

# Runner-Image einmalig in den rootless Store laden (idempotent).
if ! podman image exists localhost/devedu/csharp-runner:local 2>/dev/null; then
  echo "[sidecar] loading runner image…"
  podman load -i /images/csharp-runner.tar
fi

# Docker-kompatiblen Socket bereitstellen (--time=0 ⇒ läuft dauerhaft).
echo "[sidecar] starting podman system service on unix:///podman/podman.sock"
podman system service --time=0 unix:///podman/podman.sock &
SERVICE_PID=$!

# Podman erzeugt den Socket mit 0600 (nur uid 1000). Das Backend läuft als
# eigener User und greift über die Gruppe 1000 zu ⇒ auf 0660 lockern,
# sobald der Socket existiert (sonst SocketException 13: Permission denied).
i=0
while [ ! -S /podman/podman.sock ] && [ "$i" -lt 150 ]; do
  i=$((i+1))
  sleep 0.2
done
chmod 660 /podman/podman.sock
echo "[sidecar] socket permissions relaxed to 0660 (group access for backend)"

wait $SERVICE_PID
