# Status

## Current phase
User-side order progress on the menu is ready

## Current branch
feature/order-progress-on-menu

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
- PR #54 added the cart Remove control, centered select chevrons, and disabled textarea resizing; it was merged into `main` and the production frontend container was rebuilt afterward.
- PR #55 replaced the cart page native quantity number input with a custom minus/value/plus stepper, kept the minimum quantity at 1, and aligned the cart quantity badge plus Remove control to the Doum gold/fired-clay color treatment; it was merged into `main` and the production frontend container was rebuilt afterward.
- Current branch stores the submitted order id, shows a matching dark/gold order-progress card above the menu category chips when an active submitted order exists, and polls the public order status every 15 seconds until the order reaches `ready` or `cancelled`.

## Verification
- Frontend tests: `30 passed` (`npm test -- --run`).
- Frontend production build: passed (`npm run build`); Vite emitted the new `orderProgressStore` chunk plus updated menu/cart/status route assets.
- Docker stack rebuilt and started successfully with `docker compose up -d --build`.
- Live health check passed on `http://localhost:11080/api/health` with database and Redis reported `ok`.
- Live order-progress verification created order #54 through `/api/orders`; with that order stored as the active submitted order, `/menu` displayed the progress card before the category chips and menu list.
- Browser screenshot verification confirmed the progress card matches the site's dark card, DŌM gold accent, typography, spacing, and menu layout without obvious visual issues.
- Backend tests: `67 passed` (`python -m pytest -q`).
- Docker/live baseline: Nginx app entry responded on `http://localhost:11080`; `/`, `/menu`, `/cart`, `/admin`, and `/api/health` returned HTTP 200 during the audit baseline check.
- Browser dogfood verification covered the welcome page, menu page, cart page, order status page, admin login page, and logged-out protected admin page.
- Guest flow live test succeeded: welcome/name entry, menu add-to-order feedback, cart quantity update, order submission, and order-status display.
- Cloudflare 502 incident check found the tunnel running but the local Nginx origin on `127.0.0.1:11080` stopped; rebuilding/starting the Docker Compose stack restored local `/` and `/api/health` HTTP 200 responses plus public `https://dom.khalidmued.com/` and `/api/health` HTTP 200 responses.
- Pulled the latest `cloudflare/cloudflared:latest` Docker image (`sha256:12ff5c6992a9863db4da270746af7c244bcaee49353039af8104268a18d6c4f0`, version `2026.5.2`) and verified the DomCafe stack plus Cloudflare public `/` and `/api/health` responses returned HTTP 200 afterward.
- Security spot checks: public HTML security headers were present; unauthenticated admin API requests returned HTTP 401 with a generic admin-login-required response and no-store cache behavior.
- Audit report written to `ledger/DOGFOOD-AUDIT-2026-06-03.md` with prioritized PR recommendations.
- Current real admin-uploaded coffee drink photos were committed as curated menu assets, and future admin-panel drink uploads are now treated as ignored runtime data unless explicitly promoted.
- Upload runtime-data policy verification: `docker compose config` passed and `git check-ignore uploads/drinks/manual-test-upload.png` confirmed future generated drink uploads are ignored.
- Docker stack was rebuilt and restarted with `docker compose up -d --build`; `http://localhost:11080/api/health` returned `{"status":"ok","database":"ok","redis":"ok"}`, and a committed drink photo returned HTTP 200 from `/uploads/drinks/...`.

## Hermes Tools Used
- skill_view
- todo
- read_file
- search_files
- terminal
- process
- execute_code
- browser tools
- write_file
- patch

## Technologies / Services Touched
- Docker Compose
- Nginx
- FastAPI
- React
- TypeScript
- Vite
- Vitest
- pytest
- Git
- DomCafe admin drink uploads
- documentation

## What is pending
- PR #57 (`feature/order-progress-on-menu`) is open for review and merge into `main`: https://github.com/KhalidMued/DomCafe/pull/57
- PR #56 (`fix/menu-add-feedback`) is open for review and merge into `main`: https://github.com/KhalidMued/DomCafe/pull/56
- Three.js is intentionally deferred for a later optional enhancement.

## Known issues
- Empty guest-name Start action has no visible validation message.
- `/admin` falls back to the public welcome page instead of routing to admin login/dashboard.
- API 401 responses did not show the same security headers observed on the public HTML response.
- Many menu cards still use the repeated DŌM placeholder image.
- Long menu navigation can be improved after scrolling away from the category chips and review-order link.

## Next recommended task
- Create a focused first-impression usability PR for: empty guest-name feedback, explicit `/admin` routing, and polished logged-out admin protected-page presentation.

## Notes
- `.env` remains ignored and must not be committed.
- Do not expose local admin credentials, database passwords, JWTs, `AGENT_API_KEY`, Discord webhook URLs, tunnel credential JSON files, or connection strings.
- Runtime verification scripts should construct secrets in memory without printing them.
- Keep local dev data clean: restore smoke tests should use a temporary database and drop it after validation.
- The Cloudflare Tunnel uses `protocol: http2` because QUIC connections were unstable on this server/network during setup.
