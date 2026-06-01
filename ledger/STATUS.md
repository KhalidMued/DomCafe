# Status

## Current phase
Phase 7 — UI Polish in progress; production environment verification completed

## Current branch
docs/production-env-verification

## What works
- Phase 2 PR #5 was merged into `main` and local `main` was fast-forwarded.
- Phase 3 PR #6 created the Docker Compose runtime foundation.
- Phase 3 PR #7 hardened env/secret handling.
- Phase 3 PR #8 added PostgreSQL/PgBouncer backup and restore tooling.
- Phase 3 PR #9 added backend health, DB readiness checks, and runtime smoke tests.
- Phase 3 PR #10 added structured backend logging, request IDs, and Nginx access logs.
- Phase 3 PR #11 added Postgres persistent volume plus Redis-backed app caching.
- Phase 3 PR #12 added production deployment docs and operational runbook.
- Phase 4 PR #13 added the public ordering backend foundation.
- Phase 4 PR #14 added the public ordering frontend.
- Phase 4 PR #15 added the admin authentication and dashboard foundation.
- Phase 4 PR #16 added admin order management.
- Phase 4 PR #17 added admin menu availability management.
- Phase 4 PR #18 added protected admin drink photo uploads.
- Phase 4 PR #19 added protected admin drink copy/options editing.
- Phase 4 PR #20 added protected bean detail editing and cafe settings management.
- Phase 4 PR #21 added protected category editing, category availability, and expanded drink catalog editing.
- Phase 4 PR #22 added protected create/archive endpoints and `/admin/menu` UI controls for categories, beans, and drinks.
- Phase 5 PR #23 added the dedicated Herms/agent order-control API surface.
- Phase 5 PR #24 added the dedicated Herms/agent menu/bean lookup and availability-control API surface.
- Phase 5 PR #25 added Discord order notifications and was merged into `main`.
- Phase 6 PR #26 made the Docker Compose Nginx entrypoint reachable over the private Tailscale network by binding only Nginx to `0.0.0.0:11080:80`; backend, PostgreSQL, PgBouncer, and Redis remain internal-only with no host port bindings.
- Phase 6 PR #27 added Nginx edge limits plus Redis-backed backend fallback fixed-window limits for high-risk write endpoints and was merged into `main`.
- Phase 6 PR #28 allowed the Cloudflare Tunnel hostname `dom.khalidmued.com` through the Vite dev server host allowlist and was merged into `main`.
- Phase 6 PR #29 documented the Cloudflare Tunnel service setup, verification commands, and network exposure model and was merged into `main`.
- Phase 6 PR #30 resolved dependency audit findings and was merged into `main`.
- Phase 6 PR #31 added the PgBouncer health check and was merged into `main`.
- Phase 6 PR #32 completed final Phase 6 readiness checks and was merged into `main`.
- Phase 7 PR #33 added the initial welcome hero polish and was merged into `main`.
- Phase 7 PR #34 fixed the welcome-page overlap from the screenshot and was merged into `main`.
- Phase 7 PR #35 polished menu cards and the empty-menu state and was merged into `main`.
- The runtime `.env` exists locally, is not committed, and now has file permissions `600`.
- Runtime environment verification confirmed `APP_ENV=production`, `APP_BASE_URL=https://dom.khalidmued.com`, `FRONTEND_ORIGIN=https://dom.khalidmued.com`, Discord notifications enabled, and required secret keys present without printing secret values.
- Docker Compose config validates with Nginx as the only host-published service at `0.0.0.0:11080->80`; backend, frontend, PostgreSQL, PgBouncer, and Redis have no published host ports.
- After secret rotation, the existing PostgreSQL role password was aligned to the new `.env` secret without printing it, and PgBouncer/backend were restarted.
- Local, Tailscale, and Cloudflare health checks all return `{"status":"ok","database":"ok","redis":"ok"}`.
- Local, Tailscale, and Cloudflare home routes all return HTTP 200.
- PgBouncer health check passes through `./scripts/check-pgbouncer.sh`.
- A safe Discord webhook test message was sent successfully with HTTP 204 and no webhook URL or secret value printed.

## Verification
- `git status --short --branch`: clean before this docs-only update; PR #35 verified merged.
- `gh pr status`: no open PRs before this docs-only update.
- `.env` existence check: present; contents not printed.
- `.env` permissions: `600`.
- `docker compose config --format json`: valid; parsed without printing config or secrets.
- Runtime published port check: only `nginx` publishes a host port, `0.0.0.0:11080->80`.
- `docker compose up -d`: stack restarted after the `.env` update.
- `curl http://127.0.0.1:11080/api/health`: OK.
- `curl http://100.105.229.98:11080/api/health`: OK.
- `curl https://dom.khalidmued.com/api/health`: OK.
- Local, Tailscale, and domain `/` routes: HTTP 200.
- Safe Discord webhook test: HTTP 204.

## What is pending
- Open a docs-only PR for `docs/production-env-verification` into `main` and merge after review.
- Remaining Phase 7 work after this docs-only branch: cart/status visual polish, broader RTL review, and optional lightweight Three.js welcome component only if it stays simple and performant.

## Notes
- `.env` remains ignored and must not be committed.
- Do not expose local admin credentials, database passwords, JWTs, `AGENT_API_KEY`, Discord webhook URLs, tunnel credential JSON files, or connection strings.
- Runtime verification scripts should construct secrets in memory without printing them.
- Keep local dev data clean: restore smoke tests should use a temporary database and drop it after validation.
- The Cloudflare Tunnel uses `protocol: http2` because QUIC connections were unstable on this server/network during setup.
