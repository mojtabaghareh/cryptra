#!/usr/bin/env bash
# Run Prisma generate + push + seed against DATABASE_URL
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

echo "→ db:generate"
pnpm db:generate
echo "→ db:push"
pnpm db:push
echo "→ db:seed"
pnpm db:seed || echo "(seed optional / already applied)"
echo "✓ database ready"
