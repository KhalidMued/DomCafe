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
