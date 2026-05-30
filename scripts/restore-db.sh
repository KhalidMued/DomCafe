#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${1:?Usage: scripts/restore-db.sh /path/to/backup.sql}"
docker compose exec -T postgres psql -U "${POSTGRES_USER:-dom_cafe_user}" "${POSTGRES_DB:-dom_cafe}" < "$1"
