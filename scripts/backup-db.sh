#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p /backups/dom-cafe
docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-dom_cafe_user}" "${POSTGRES_DB:-dom_cafe}" > "/backups/dom-cafe/dom_cafe_$(date +%Y%m%d_%H%M%S).sql"
