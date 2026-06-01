# Status

## Current phase
Admin/guest typography and admin nav fixes ready

## Current branch
fix/admin-guest-typography-nav

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
- Phase 7 PR #48 added a focused admin navigation header with Dashboard, Orders, Menu, Beans, and Settings links; added a visible Logout button that clears the stored admin token and returns to `/admin/login`; and added a dedicated `/admin/beans` page backed by the existing admin menu/beans API. It was merged into `main`.
- PR #49 recorded Phase 7 completion and the decision to defer optional Three.js. It was merged into `main`.
- PR #50 recorded the final MVP acceptance pass and was merged into `main`.
- PR #51 added the provided DŌM favicon pack to `frontend/public/`, linked browser favicon/touch/manifest metadata from `frontend/index.html`, kept favicon files out of the uploads/drink-photo pipeline, and was merged into `main`.
- The production frontend container was rebuilt after PR #51 merged so Nginx now serves the new favicon, PNG icons, Apple touch icon, and manifest files instead of the old SPA fallback HTML.
- Current branch fixes the guest menu metadata color, applies the enforced brand-serif heading class across admin and guest display headings, replaces the large admin header box with a slim dark top nav, and uses a CSS macron DŌM wordmark in the admin nav.

## Verification
- Frontend tests: `28 passed`.
- Frontend production build: passed; Vite emitted route/admin chunks successfully.
- Docker Compose frontend service was rebuilt/recreated locally for browser verification; stack services are running behind Nginx on `0.0.0.0:11080`.
- Guest menu browser verification at local `/menu`: `22 drinks across 5 sections` renders as `rgb(136, 135, 128)` (`#888780`), category and drink headings report the brand serif font, and visible menu layout remains intact.
- Admin dashboard browser verification at local `/admin/dashboard`: old boxed `.admin-shell-header` and gold `.admin-logout-button` styles are absent; slim top nav renders at 56px with `#2C2C2A` background and `#3a3835` bottom border; active Dashboard tab is gold-filled; Logout is a plain transparent gray text button; admin title uses the brand serif.
- Static grep verification: no old `.admin-shell-header` / `.admin-logout-button` selectors remain, and menu/time/cart metadata selectors no longer use `var(--color-nile-mist)` teal.

## Hermes Tools Used
- skill_view
- terminal
- process
- read_file
- search_files
- write_file
- patch
- execute_code
- todo
- browser tools

## Technologies / Services Touched
- Git / GitHub CLI
- Docker / Docker Compose
- Nginx
- React
- TypeScript
- Vite
- CSS
- documentation

## What is pending
- Open PR for `fix/admin-guest-typography-nav` into `main`.
- Three.js is intentionally deferred for a later optional enhancement.

## Known issues
- No active admin/guest typography or nav issues found after local test/build/browser verification.

## Next recommended task
- Review and merge the admin/guest typography and nav fixes PR, then delete the merged branch.

## Notes
- `.env` remains ignored and must not be committed.
- Do not expose local admin credentials, database passwords, JWTs, `AGENT_API_KEY`, Discord webhook URLs, tunnel credential JSON files, or connection strings.
- Runtime verification scripts should construct secrets in memory without printing them.
- Keep local dev data clean: restore smoke tests should use a temporary database and drop it after validation.
- The Cloudflare Tunnel uses `protocol: http2` because QUIC connections were unstable on this server/network during setup.
