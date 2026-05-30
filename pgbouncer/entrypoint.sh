#!/bin/sh
set -e

: "${DATABASES_USER:?DATABASES_USER is required}"
: "${DATABASES_PASSWORD:?DATABASES_PASSWORD is required}"

PG_CONFIG_DIR=/etc/pgbouncer
mkdir -p "$PG_CONFIG_DIR"
printf '"%s" "%s"\n' "$DATABASES_USER" "$DATABASES_PASSWORD" > "$PG_CONFIG_DIR/userlist.txt"
export PGBOUNCER_AUTH_FILE="$PG_CONFIG_DIR/userlist.txt"

exec /opt/pgbouncer/entrypoint.sh
