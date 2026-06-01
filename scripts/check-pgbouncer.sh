#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

compose() {
  docker compose "$@"
}

require_container() {
  local service="$1"
  local id
  id="$(compose ps -q "$service")"
  if [ -z "$id" ]; then
    echo "ERROR: service '$service' is not running" >&2
    exit 1
  fi
}

require_container postgres
require_container pgbouncer

app_db="$(compose exec -T postgres sh -lc 'printf %s "$POSTGRES_DB"')"

select_result="$(compose exec -T postgres sh -lc 'PGPASSWORD="$POSTGRES_PASSWORD" psql -h pgbouncer -p 6432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "select 1"')"
if [ "$select_result" != "1" ]; then
  echo "ERROR: PgBouncer SELECT check failed" >&2
  exit 1
fi

pool_output="$(compose exec -T postgres sh -lc 'PGPASSWORD="$POSTGRES_PASSWORD" psql -h pgbouncer -p 6432 -U "$POSTGRES_USER" -d pgbouncer -tAc "SHOW POOLS;"')"
if ! printf '%s\n' "$pool_output" | grep -q "$app_db"; then
  echo "ERROR: PgBouncer SHOW POOLS did not include the application database" >&2
  exit 1
fi

printf 'PgBouncer health OK\n'
printf 'Verified application query through PgBouncer and pool visibility via SHOW POOLS.\n'
