#!/usr/bin/env bash
# One-time setup for the devcontainer: wait for Docker, then run the normal `make setup`
# (sandbox image, backend venv, frontend deps, tinyparse demo repo).
set -euo pipefail

for _ in $(seq 1 60); do
  docker info >/dev/null 2>&1 && break
  sleep 2
done
docker info >/dev/null 2>&1 || { echo "Docker did not start; run 'make setup' once it is up." >&2; exit 1; }

[ -f .env ] || cp .env.example .env
make setup
echo "Setup done. Start the API with: make api"
