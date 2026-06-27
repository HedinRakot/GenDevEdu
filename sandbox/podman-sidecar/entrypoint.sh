#!/bin/sh
set -e

# Runner-Image einmalig in den rootless Store laden (idempotent).
if ! podman image exists localhost/devedu/csharp-runner:local 2>/dev/null; then
  echo "[sidecar] loading runner image…"
  podman load -i /images/csharp-runner.tar
fi

# Docker-kompatiblen Socket bereitstellen (--time=0 ⇒ läuft dauerhaft).
echo "[sidecar] starting podman system service on unix:///podman/podman.sock"
exec podman system service --time=0 unix:///podman/podman.sock
