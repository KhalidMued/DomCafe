# Changelog

## Unreleased
- Fire the Discord order notification as a background task so it no longer delays the guest's order response.
- Add request logging middleware with an `X-Request-ID` response header (request id, method, path, status, duration; healthcheck path excluded).
- Share one pooled Redis client instead of opening a connection per rate-limit or health check.
- Allow clearing a drink's default bean with an explicit `default_bean_id: null` in the admin PATCH.
- Sweep dead code: Phase-0 frontend placeholders, empty component scaffolds, redundant `docker-compose.prod.yml`, unused `VITE_API_BASE_URL` env, and the unused `passlib` dependency (replaced by a direct `bcrypt` pin).
- Consolidate the triplicated `_as_bool` helper and duplicated menu payload builders into shared modules.
- Keep the menu order-progress card through transient poll failures and clear it only on a confirmed 404; the order-status page also stops polling on 404.
- Parse non-JSON API error responses defensively with a new `ApiError` (status-aware, friendly 429 message).
- Persist the guest cart to `sessionStorage` so page refreshes keep the order in progress.
- Cap drink quantity at the backend maximum of 10 in the cart stepper and menu adds.
- Self-host the Tajawal brand font (arabic+latin subsets, `font-display: swap`, immutable caching), removing the render-blocking Google Fonts import.
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
