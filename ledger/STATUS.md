# Status

## Current phase
Phase 6 — Security and deployment hardening in progress

## Current branch
security/rate-limit-critical-actions

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
- Current branch adds Nginx edge limits plus Redis-backed backend fallback fixed-window limits for high-risk write endpoints:
  - `/api/admin/login` allows 5 attempts per client IP/source address per minute;
  - `/api/orders` allows 10 attempts per client IP/source address per minute;
  - over-limit requests return HTTP 429;
  - backend fallback rate limiting ignores spoofable forwarded headers and fails open if Redis is unavailable, while the Nginx edge limits remain active.

## Verification
- Focused backend rate-limit tests: `3 passed`.
- Full backend tests: `67 passed`.
- Frontend tests: `22 passed`.
- Frontend production build: passed.
- Docker Compose rebuild for backend/frontend/nginx: passed.
- Nginx config test (`nginx -t`) passed.
- Runtime verification through Nginx passed:
  - `/api/admin/login` returned five HTTP 401 responses, then HTTP 429 on the sixth attempt from the same source address;
  - `/api/orders` returned ten HTTP 400 validation/service responses for a missing drink, then HTTP 429 on the eleventh attempt from the same source address;
  - temporary Redis rate-limit keys were deleted after verification;
  - `/api/health` returned HTTP 200 with database and Redis OK.

## What is pending
- Commit, push, and open a PR for this rate-limit hardening branch.
- Remaining Phase 6 work after this branch: dependency audits (`pip-audit` and `npm audit`), PgBouncer pool health check, final deployment readiness checks, and final docs/runbook cleanup.

## Notes
- `.env` remains ignored and must not be committed.
- Do not expose local admin credentials, database passwords, JWTs, `AGENT_API_KEY`, Discord webhook URLs, or connection strings.
- Runtime verification scripts should construct secrets in memory without printing them.
- Keep local dev data clean: restore any runtime verification edits immediately after assertions.
