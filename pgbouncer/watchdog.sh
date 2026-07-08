#!/bin/sh
# PgBouncer's embedded DNS resolver can wedge permanently after the postgres
# container restarts (observed 2026-07-08: every connection failed with
# "DNS lookup failed: postgres: result=0" for two hours until a manual
# container restart). Docker Compose never restarts a container on its own
# just because a healthcheck fails, so this watchdog runs a real query
# through PgBouncer and kills PID 1 (pgbouncer) after sustained failure;
# `restart: unless-stopped` then brings up a fresh process with a fresh
# resolver. The failure budget (4 x 15s) is wide enough that a normal
# postgres restart never triggers a pointless kill.

INTERVAL_SECONDS=15
FAILURES_BEFORE_RESTART=4

failures=0
while sleep "$INTERVAL_SECONDS"; do
  if PGPASSWORD="$DATABASES_PASSWORD" PGCONNECT_TIMEOUT=5 \
    psql -h 127.0.0.1 -p "${PGBOUNCER_LISTEN_PORT:-6432}" \
      -U "$DATABASES_USER" -d "$DATABASES_DBNAME" -tAc 'select 1' >/dev/null 2>&1; then
    failures=0
  else
    failures=$((failures + 1))
    echo "domcafe-pgbouncer-watchdog: end-to-end check failed ($failures/$FAILURES_BEFORE_RESTART)" >&2
    if [ "$failures" -ge "$FAILURES_BEFORE_RESTART" ]; then
      echo "domcafe-pgbouncer-watchdog: restarting container to recover" >&2
      kill 1
      exit 0
    fi
  fi
done
