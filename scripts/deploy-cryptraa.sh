#!/usr/bin/env bash
# Deploy Cryptra on VPS for cryptraa.ir (IP 5.75.205.142)
# Run ON THE SERVER after: git clone && cp .env.production.example .env && edit secrets
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DOMAIN="${DOMAIN:-cryptraa.ir}"
EMAIL="${EMAIL:-admin@cryptraa.ir}"

if [[ ! -f .env ]]; then
  echo "Missing .env — run: cp .env.production.example .env && nano .env"
  exit 1
fi

echo "→ Domain: $DOMAIN"
echo "→ Pull latest"
git pull origin main || true

echo "→ Build & start (prod + caddy)"
export DOMAIN EMAIL
docker compose -f docker-compose.prod.yml -f docker-compose.caddy.yml up -d --build

echo "→ Wait for api..."
sleep 8

echo "→ DB migrate (best-effort)"
docker compose -f docker-compose.prod.yml exec -T api \
  sh -c 'command -v pnpm >/dev/null && pnpm db:generate && pnpm db:push || echo skip-db' \
  || echo "(run db manually if needed)"

echo "→ Menu button"
if command -v node >/dev/null 2>&1; then
  node scripts/set-menu-button.mjs || echo "setup:menu failed — set TELEGRAM_* in .env"
else
  echo "Install node on host or run: docker compose exec api node ..."
fi

echo "→ Health"
curl -fsS "https://${DOMAIN}/health" || curl -fsS "http://127.0.0.1:3000/health" || true
echo
echo "Done. Open https://${DOMAIN} and Telegram Mini App."
