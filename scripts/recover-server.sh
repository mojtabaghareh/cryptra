#!/usr/bin/env bash
# Run on VPS after SSH is back: bash scripts/recover-server.sh
set -euo pipefail
cd /opt/cryptra 2>/dev/null || cd "$(dirname "$0")/.."

echo "==> git pull"
git pull origin main

echo "==> ensure .env exists (do NOT overwrite)"
if [[ ! -f .env ]]; then
  echo "Missing .env — copy from .env.production.example and fill secrets"
  exit 1
fi

echo "==> docker compose build + up"
docker compose -f docker-compose.prod.yml -f docker-compose.caddy.yml build api bot miniapp
docker compose -f docker-compose.prod.yml -f docker-compose.caddy.yml up -d

echo "==> status"
docker compose -f docker-compose.prod.yml -f docker-compose.caddy.yml ps

echo "==> health"
sleep 5
curl -fsS http://127.0.0.1:3000/health || true
curl -fsS https://cryptraa.ir/health || true

echo "==> done"
