#!/bin/sh
set -e

: "${DATABASES_USER:?DATABASES_USER is required}"
: "${DATABASES_PASSWORD:?DATABASES_PASSWORD is required}"

PG_CONFIG_DIR=/etc/pgbouncer
mkdir -p "$PG_CONFIG_DIR"
# The secret is stored plain in the auth file (readable only by the pgbouncer
# user); with auth_type=scram-sha-256 PgBouncer still challenges clients via
# SCRAM and answers PostgreSQL's SCRAM challenge upstream, so the password
# never crosses the wire in clear text.
printf '"%s" "%s"\n' "$DATABASES_USER" "$DATABASES_PASSWORD" > "$PG_CONFIG_DIR/userlist.txt"
chmod 600 "$PG_CONFIG_DIR/userlist.txt"
export PGBOUNCER_AUTH_FILE="$PG_CONFIG_DIR/userlist.txt"

/usr/local/bin/domcafe-pgbouncer-watchdog.sh &

exec /opt/pgbouncer/entrypoint.sh
