FROM pgbouncer/pgbouncer:latest
USER root
RUN apk add --no-cache postgresql-client
USER postgres
COPY --chmod=755 entrypoint.sh /usr/local/bin/domcafe-pgbouncer-entrypoint.sh
COPY --chmod=755 watchdog.sh /usr/local/bin/domcafe-pgbouncer-watchdog.sh
ENTRYPOINT ["/usr/local/bin/domcafe-pgbouncer-entrypoint.sh"]
