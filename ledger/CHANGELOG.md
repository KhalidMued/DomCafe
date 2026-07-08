# Changelog

## Unreleased
- Look up guest orders by a random unguessable `public_code` instead of the sequential integer id, blocking order enumeration (migration `20260708_0003` backfills existing orders).
- Restore real per-client rate limiting: uvicorn `--proxy-headers`, Nginx overwrites `X-Forwarded-For`, and Cloudflare Tunnel visitors are keyed by `CF-Connecting-IP` via the Nginx `real_ip` module.
- Move security headers to `nginx/conf.d/security-headers.inc` and include them in every location, restoring them on `/api/*` and `/uploads/*` responses.
- Reject whitespace-only guest names by stripping before validation.
- Add `restart: unless-stopped` and healthchecks to all Docker Compose services, with health-gated `depends_on` ordering so the backend waits for healthy Postgres/Redis.
- Add a GitHub Actions CI workflow running backend pytest, frontend vitest and build, and Docker Compose config validation on every pull request.
- Run the backend container as a non-root user (UID 1001) and copy only the seed brand JSON into the image instead of the whole `docs/` directory.
- Record the 2026-07-08 production-readiness audit in `ledger/AUDIT-2026-07-08.md`.
- Add Nginx edge limits and Redis-backed backend fallback rate limits for admin login and guest order creation.
- Document current security controls and rate-limit behavior.
- Add Phase 0 project foundation.
