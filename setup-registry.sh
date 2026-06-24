#!/usr/bin/env bash
#
# setup-registry.sh — one-time setup so the k3s cluster can pull locally-built images.
#
# Starts a local Docker registry on localhost:5000 and configures k3s/containerd to
# use it as a mirror, then restarts k3s. Requires sudo (writes /etc/rancher/k3s and
# restarts the k3s service). Idempotent: skips the k3s restart if nothing changed.
#
set -euo pipefail

REGISTRY_NAME="registry"
REGISTRY_PORT="5000"
REGISTRIES_YAML="/etc/rancher/k3s/registries.yaml"

note() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[!]\033[0m %s\n' "$*"; }

# --- 1. Local Docker registry container ---------------------------------------
if docker ps --format '{{.Names}}' | grep -qx "$REGISTRY_NAME"; then
  note "Registry container '$REGISTRY_NAME' already running."
elif docker ps -a --format '{{.Names}}' | grep -qx "$REGISTRY_NAME"; then
  note "Starting existing registry container '$REGISTRY_NAME'."
  docker start "$REGISTRY_NAME" >/dev/null
else
  note "Creating registry container on localhost:${REGISTRY_PORT}."
  docker run -d --restart=always -p "127.0.0.1:${REGISTRY_PORT}:5000" \
    --name "$REGISTRY_NAME" registry:2 >/dev/null
fi

# --- 2. k3s registries.yaml (containerd mirror) -------------------------------
DESIRED="$(cat <<'EOF'
mirrors:
  "localhost:5000":
    endpoint:
      - "http://localhost:5000"
EOF
)"

needs_restart=0
if sudo test -f "$REGISTRIES_YAML" && \
   [ "$(sudo cat "$REGISTRIES_YAML")" = "$DESIRED" ]; then
  note "registries.yaml already up to date."
else
  note "Writing $REGISTRIES_YAML (sudo)."
  sudo mkdir -p "$(dirname "$REGISTRIES_YAML")"
  printf '%s\n' "$DESIRED" | sudo tee "$REGISTRIES_YAML" >/dev/null
  needs_restart=1
fi

# --- 3. Restart k3s so containerd picks up the mirror -------------------------
if [ "$needs_restart" -eq 1 ]; then
  note "Restarting k3s (sudo) so containerd reloads the registry config."
  sudo systemctl restart k3s
  note "Waiting for the node to become Ready..."
  for _ in $(seq 1 30); do
    if sudo k3s kubectl get nodes 2>/dev/null | grep -q ' Ready '; then
      note "Node is Ready."
      break
    fi
    sleep 2
  done
else
  note "No k3s restart needed."
fi

note "Registry setup complete. Next: ./deploy.sh"
