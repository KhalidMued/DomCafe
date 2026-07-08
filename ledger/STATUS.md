# Status

## Current phase
Post-MVP hardening — Phase 4 (backend hygiene) from the 2026-07-08 production-readiness audit

## Current branch
feature/phase4-backend-hygiene

## What works
- Phase 2 PR #5 was merged into `main` and local `main` was fast-forwarded.
- Phase 3 PR #6 created the Docker Compose runtime foundation.
- Phase 3 PR #7 hardened env/secret handling.
- Phase 3 PR #8 added PostgreSQL/PgBouncer backup and restore tooling.
- Phase 3 PR #9 added backend health, DB readiness checks, and runtime smoke tests.
- Phase 3 PR #10 added structured backend logging, request IDs, and Nginx access logs. (Correction 2026-07-08: the backend logging/request-ID middleware is no longer present in the current code; only Nginx access logs and uvicorn defaults remain. Tracked as finding M6 in `ledger/AUDIT-2026-07-08.md`.)
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
- PR #36 recorded production `.env` verification and was merged into `main`.
- Phase 7 PR #37 polished cart and order-status pages and was merged into `main`.
- Phase 7 PR #38 restored the main/welcome page closer to the user's attached old simple card and was merged into `main`.
- Phase 7 PR #39 separated the large white DŌM mark from the small orange `Home café` label and was merged into `main`.
- Phase 7 PR #40 fixed the first DŌM wordmark rhythm issue with equal-width spans and a CSS macron overlay and was merged into `main`.
- Phase 7 PR #41 tuned the CSS wordmark lockup and was merged into `main`.
- Phase 7 PR #42 replaced the welcome wordmark/label/tagline block with the user-supplied inline SVG and was merged into `main`.
- Phase 7 PR #43 moved the orange `HOME CAFÉ` label and its orange underline upward within the inline SVG and was merged into `main`.
- Phase 7 PR #44 improved RTL/content-direction resilience and was merged into `main`.
- Phase 7 PR #45 improved small interaction feedback and was merged into `main`.
- Phase 7 PR #46 replaced the `/admin/login` splash header with the approved inline SVG lockup and was merged into `main`.
- Phase 7 PR #47 fixed the initial blank-screen/slow-transition path with a production frontend container, immediate DŌM loading shell, and route-level lazy loading, and was merged into `main`.
- Phase 7 PR #48 added a focused admin navigation header with Dashboard, Orders, Menu, Beans, and Settings links; added a visible Logout button that clears the stored admin token and returns to `/admin/login`; and added a dedicated `/admin/beans` page backed by the existing admin menu/beans API. It was merged into `main`.
- PR #49 recorded Phase 7 completion and the decision to defer optional Three.js. It was merged into `main`.
- PR #50 recorded the final MVP acceptance pass and was merged into `main`.
- PR #51 added the provided DŌM favicon pack to `frontend/public/`, linked browser favicon/touch/manifest metadata from `frontend/index.html`, kept favicon files out of the uploads/drink-photo pipeline, and was merged into `main`.
- The production frontend container was rebuilt after PR #51 merged so Nginx now serves the new favicon, PNG icons, Apple touch icon, and manifest files instead of the old SPA fallback HTML.
- PR #54 added the cart Remove control, centered select chevrons, and disabled textarea resizing; it was merged into `main` and the production frontend container was rebuilt afterward.
- PR #55 replaced the cart page native quantity number input with a custom minus/value/plus stepper, kept the minimum quantity at 1, and aligned the cart quantity badge plus Remove control to the Doum gold/fired-clay color treatment; it was merged into `main` and the production frontend container was rebuilt afterward.
- PR #58 (order progress on the menu plus upload-policy docs) was squash merged into `main`.
- PR #59 added `CLAUDE.md` with the permanent PR-only Git workflow rule and was squash merged into `main`.
- A full production-readiness audit was completed and recorded in `ledger/AUDIT-2026-07-08.md` with a five-phase remediation roadmap.
- Audit Phase 1 (PR #60) was squash merged into `main`: self-healing Compose stack (restart policies, healthchecks, health-gated `depends_on`), the GitHub Actions CI workflow, and the non-root backend image.
- Audit Phase 2 (PR #61) was squash merged into `main`: order enumeration blocked via random `public_code` lookups, real per-client rate limiting through `--proxy-headers`/`real_ip`, security headers restored on `/api/*` and `/uploads/*`, and whitespace-only guest names rejected.
- Audit Phase 3 (PR #62) was squash merged into `main`: order-progress resilience, defensive API error parsing, sessionStorage cart persistence, the quantity-10 cap, and self-hosted Tajawal fonts.
- Current branch implements audit Phase 4 (backend hygiene): the Discord order webhook fires as a fire-and-forget background task instead of blocking the guest's order response (M1); a request-logging middleware adds an `X-Request-ID` response header and logs request id, method, path, status, and duration for every request except the healthcheck-polled `/api/health` (M6); `get_redis()` returns one shared pooled client instead of opening and closing a connection per call (M7); an explicit `default_bean_id: null` in the admin drink PATCH now clears the drink's bean instead of erroring (M9); dead code was swept — the seven unprefixed Phase-0 admin page placeholders, `app/router.tsx`, `app/providers.tsx`, the empty `lib/errors|validators|i18n.ts` files, the empty `components/*` scaffold dirs, the redundant `docker-compose.prod.yml`, the unused `VITE_API_BASE_URL` compose env, and the unused `passlib` dependency (replaced by a direct `bcrypt==5.0.0` pin) (L1); and the triplicated `_as_bool` plus the duplicated drink/bean/category payload builders were consolidated into `app/core/parsing.py` and `app/services/serializers.py` (L2). `_current_admin_dependency` was kept and documented — it is a live test seam, not dead code as the audit first assumed.

## Verification
Verification for `feature/phase4-backend-hygiene` (2026-07-08):

- Backend tests: `75 passed` (71 existing + 4 new in `test_phase9_backend_hygiene.py` covering the `X-Request-ID` header, `as_bool` parsing, explicit-null bean clearing through the PATCH route, and non-blocking Discord scheduling) in a clean `python:3.12-slim` container with the new `bcrypt==5.0.0` pin replacing `passlib`.
- Frontend tests: `36 passed` and production build passed after deleting the twelve dead placeholder files and empty component scaffold dirs — nothing referenced them.
- `docker compose config -q` passed after removing `docker-compose.prod.yml` and the unused `VITE_API_BASE_URL` env.
- Backend rebuilt and healthy; live checks: `X-Request-ID` present on responses; a structured `domcafe.request` log line (request id, method, path, status, duration) appears per request while `/api/health` stays out of the log; `pip show passlib` is empty in the container and `bcrypt 5.0.0` is installed.
- Live rate-limit exercise through the shared Redis client: six wrong admin logins returned exactly `401 ×5` then `429`.
- Live order creation returned HTTP 201 in 0.06s with the Discord notification scheduled in the background; no errors in backend logs. The verification order was cancelled afterwards.

Historical verification for earlier merged work lives in git history of this file.

## Hermes Tools Used
- read_file
- write_file
- patch
- terminal
- git/gh CLI

## Technologies / Services Touched
- Docker Compose (restart policies, healthchecks, depends_on conditions)
- Docker (backend image non-root user, image slimming)
- GitHub Actions (new CI workflow)
- pytest
- Vitest
- Git
- documentation

## What is pending
- The Phase 4 backend hygiene PR from `feature/phase4-backend-hygiene` is open for review and merge into `main`.
- Audit Phase 5 (optional polish) from `ledger/AUDIT-2026-07-08.md`: admin SPA navigation, order-status timestamps, image resize/WebP pipeline, contrast fixes, edge gzip, and order history.
- Three.js is intentionally deferred for a later optional enhancement.

## Known issues
- The 2026-07-08 audit (`ledger/AUDIT-2026-07-08.md`) tracks the full prioritized list. H1–H4, M1–M9 (except M10/M11/M14), L1, and L2 are fixed (Phases 2–4); the remaining findings are the Phase 5 polish items plus the deliberately deferred M10 (localStorage JWT) and M12 (retry/backoff/offline handling).
- Guests with an order in flight at Phase 2 deploy time lose their old `/order/<int id>` tracking link (integer lookups now 404 by design); new orders use unguessable codes.
- Empty guest-name Start action has no visible validation message.
- `/admin` falls back to the public welcome page instead of routing to admin login/dashboard.
- Many menu cards still use the repeated DŌM placeholder image.
- Long menu navigation can be improved after scrolling away from the category chips and review-order link.

## Next recommended task
- Audit Phase 5 (optional polish): admin SPA navigation, order-status transition timestamps, image resize/WebP pipeline, secondary-text contrast, edge gzip for API JSON, and old-photo cleanup on replacement.

## Notes
- `.env` remains ignored and must not be committed.
- Do not expose local admin credentials, database passwords, JWTs, `AGENT_API_KEY`, Discord webhook URLs, tunnel credential JSON files, or connection strings.
- Runtime verification scripts should construct secrets in memory without printing them.
- Keep local dev data clean: restore smoke tests should use a temporary database and drop it after validation.
- The Cloudflare Tunnel uses `protocol: http2` because QUIC connections were unstable on this server/network during setup.
