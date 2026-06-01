#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

backup_dir="${BACKUP_DIR:-/backups/dom-cafe}"
mkdir -p "$backup_dir"

backup_file="$backup_dir/dom_cafe_$(date +%Y%m%d_%H%M%S).sql"
docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-dom_cafe_user}" "${POSTGRES_DB:-dom_cafe}" > "$backup_file"
printf '%s\n' "$backup_file"
