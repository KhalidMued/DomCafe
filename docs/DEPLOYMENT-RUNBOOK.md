# Deployment Runbook

See `AGENT.md` for project rules and source requirements.

## Docker Compose entrypoint

DomCafe is served through the Compose `nginx` service on host port `11080`.

Only Nginx publishes a host port:

```text
0.0.0.0:11080:80
```

Backend, PostgreSQL, PgBouncer, and Redis must stay Docker-internal and must not publish host ports.

Verify the effective Compose config before deployment changes:

```bash
docker compose config
```

## Cloudflare Tunnel

The production/dev public hostname is:

```text
https://dom.khalidmued.com
```

Traffic path:

```text
Cloudflare Tunnel -> http://127.0.0.1:11080 -> DomCafe Nginx -> frontend/backend
```

The `domcafe` tunnel ID is:

```text
d79a9dd8-ff7b-48e1-82a8-f290d6b50f76
```

System service config lives at:

```text
/etc/cloudflared/config.yml
```

Expected config shape:

```yaml
tunnel: d79a9dd8-ff7b-48e1-82a8-f290d6b50f76
credentials-file: /etc/cloudflared/d79a9dd8-ff7b-48e1-82a8-f290d6b50f76.json
protocol: http2

ingress:
  - hostname: dom.khalidmued.com
    service: http://127.0.0.1:11080
  - service: http_status:404
```

`protocol: http2` is intentional. QUIC connections were unstable on this server/network during setup, while HTTP/2 registered stable Cloudflare edge connections.

Do not commit or print the tunnel credentials JSON file.

Validate ingress rules:

```bash
sudo cloudflared --config /etc/cloudflared/config.yml tunnel ingress validate
```

Check service state:

```bash
sudo systemctl status cloudflared --no-pager
sudo journalctl -u cloudflared -n 80 --no-pager -l
```

Expected service state:

```text
Active: active (running)
protocol=http2
```

Restart after config changes:

```bash
sudo systemctl restart cloudflared
```

## PgBouncer pool health

PgBouncer runs as an internal-only Compose service on port `6432`; it must not publish a host port.

The app database user is configured as a PgBouncer `stats_users` entry so operators can run read-only pool visibility checks without granting admin-console privileges.

Run the PgBouncer health check after database, pooler, or backend deployment changes:

```bash
./scripts/check-pgbouncer.sh
```

Expected result:

```text
PgBouncer health OK
Verified application query through PgBouncer and pool visibility via SHOW POOLS.
```

The script verifies both:

- application queries can pass through PgBouncer to PostgreSQL; and
- `SHOW POOLS` exposes the expected application database pool.

### DNS-staleness self-healing

PgBouncer's embedded DNS resolver can wedge permanently after the postgres container restarts (observed 2026-07-08: every connection failed with `DNS lookup failed: postgres: result=0` until a manual container restart). Two layers now handle this automatically:

- A container healthcheck runs a real `select 1` through PgBouncer every 15s, so `docker compose ps` shows `unhealthy` when the path to PostgreSQL is broken, and the backend's `depends_on` waits for a healthy pooler at startup.
- An in-container watchdog (`pgbouncer/watchdog.sh`) runs the same end-to-end query and, after 4 consecutive failures (~60s), kills the pgbouncer process so `restart: unless-stopped` replaces the container with a fresh resolver. The budget is wide enough that a normal postgres restart does not trigger it. Watchdog activity appears in `docker logs` under the `domcafe-pgbouncer-watchdog:` prefix.

A prolonged PostgreSQL outage will cycle the PgBouncer container roughly once a minute until PostgreSQL returns; this is expected and recovers without intervention.

## Backups and restore smoke tests

Create a database backup:

```bash
./scripts/backup-db.sh
```

By default, backups are written under:

```text
/backups/dom-cafe
```

For local or non-root verification, override the destination:

```bash
BACKUP_DIR=/tmp/domcafe-backups ./scripts/backup-db.sh
```

Restore into the configured application database only when intentionally rolling back or recovering data:

```bash
./scripts/restore-db.sh /path/to/backup.sql
```

For readiness checks, test restore into a temporary database instead of overwriting the application database, then drop the temporary database after validation.

## Uploaded drink photos

Admin-panel drink photo uploads are runtime data, not ordinary source code. The Compose stack persists them through the shared `./uploads:/app/uploads` mount used by the backend and Nginx.

Keep the repo policy simple:

- committed files under `uploads/drinks/` are intentional curated menu assets;
- new admin-panel uploads are ignored by Git by default;
- promote a new curated menu asset explicitly with `git add -f uploads/drinks/<file>`;
- back up the `uploads/` directory together with the database because drink rows store `/uploads/drinks/...` photo URLs.

For a server backup, copy both database and upload data before major deployment changes:

```bash
./scripts/backup-db.sh
rsync -a uploads/ /backups/dom-cafe/uploads/
```

Longer term, the same runtime-data boundary can move from the local filesystem mount to object storage such as Cloudflare R2/S3 without changing the public URL contract stored in menu rows.

## Phase 6 readiness checklist

Before declaring the deployment ready, verify:

```bash
docker compose config
uvx pip-audit -r backend/requirements.txt
cd frontend && npm audit --audit-level=high && cd ..
PYTHONPATH=backend pytest backend/tests
cd frontend && npm test && npm run build && cd ..
docker compose up -d --build
./scripts/check-pgbouncer.sh
curl -I https://dom.khalidmued.com
curl https://dom.khalidmued.com/api/health
```

Expected readiness state:

- only Nginx publishes `0.0.0.0:11080->80/tcp`;
- backend, PostgreSQL, PgBouncer, and Redis have no host port bindings;
- login and order creation rate-limit tests pass;
- dependency audits report no known Python vulnerabilities and zero high/critical frontend vulnerabilities;
- backup creation succeeds and restore has been tested against a temporary database;
- PgBouncer accepts application traffic and exposes pool visibility through `SHOW POOLS`;
- Cloudflare Tunnel is `active`, `enabled`, and serves `https://dom.khalidmued.com`.

## Smoke checks

After restarting the stack or tunnel, verify:

```bash
curl -I https://dom.khalidmued.com
curl https://dom.khalidmued.com/api/health
```

Expected results:

```text
HTTP/2 200
{"status":"ok","database":"ok","redis":"ok"}
```
