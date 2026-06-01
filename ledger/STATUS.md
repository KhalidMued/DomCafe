# Status

## Current phase
Phase 7 — UI Polish in progress

## Current branch
fix/admin-navigation-usability

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
- Current branch adds a focused admin navigation header with Dashboard, Orders, Menu, Beans, and Settings links; adds a visible Logout button that clears the stored admin token and returns to `/admin/login`; and adds a dedicated `/admin/beans` page backed by the existing admin menu/beans API.

## Verification
- Admin route inspection: `/admin/dashboard`, `/admin/orders`, `/admin/menu`, and `/admin/settings` already existed; `/admin/beans` had only an unused placeholder file and no active route before this branch.
- Frontend tests: `28 passed`.
- Frontend production build: passed.
- Docker Compose rebuild/restart for frontend/Nginx path: passed.
- Local `/api/health` through Nginx: HTTP 200 with database and Redis OK.
- Local `/admin/dashboard` route through Nginx: HTTP 200.
- Local `/admin/beans` route through Nginx: HTTP 200.
- Local guest `/` route through Nginx: HTTP 200.
- Browser admin smoke check: protected admin pages show Dashboard, Orders, Menu, Beans, Settings, and Logout controls.
- Browser Beans smoke check: Beans navigation opens `/admin/beans`, shows the Beans heading, Add bean action, and existing bean management API results when authorized.
- Browser logout smoke check: Logout clears `dom_admin_token`, redirects to `/admin/login`, and leaves the admin login form visible.

## Hermes Tools Used
- skill_view
- terminal
- process
- read_file
- write_file
- patch
- search_files
- browser tools

## Technologies / Services Touched
- Git / GitHub CLI
- Docker / Docker Compose
- Nginx
- React
- Vite
- PostgreSQL
- Redis
- documentation

## What is pending
- Open a PR for `fix/admin-navigation-usability` into `main` and merge after review.
- Remaining Phase 7 work after this branch: optional lightweight Three.js welcome component only if it stays simple and performant.

## Notes
- `.env` remains ignored and must not be committed.
- Do not expose local admin credentials, database passwords, JWTs, `AGENT_API_KEY`, Discord webhook URLs, tunnel credential JSON files, or connection strings.
- Runtime verification scripts should construct secrets in memory without printing them.
- Keep local dev data clean: restore smoke tests should use a temporary database and drop it after validation.
- The Cloudflare Tunnel uses `protocol: http2` because QUIC connections were unstable on this server/network during setup.
