# Status

## Current phase
Post-MVP maintenance — the 2026-07-08 production-readiness audit roadmap (Phases 1–5) is complete and merged

## Current branch
fix/pgbouncer-dns-selfheal

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
- Audit Phase 4 (PR #63) was squash merged into `main`: background Discord notifications, request-ID logging middleware, shared Redis client, explicit-null bean clearing, the dead-code sweep, and helper dedup.
- Audit Phase 5 (PR #64) was squash merged into `main`: admin SPA navigation without full page reloads (M11); order status transitions record `received_at`/`preparing_at`/`ready_at`/`cancelled_at` timestamps (M14, migration `20260708_0004`); cancelled progress-track styling, stable list keys, drink-photo alt text, and mid-tone→hint contrast fixes (L6); edge Nginx gzip for API JSON, server-side WebP re-encoding of drink photo uploads capped at 1600px with EXIF stripped, and one grouped dashboard order-count query (L7). L3 (deleting replaced photo files) was deliberately skipped: it conflicts with the curated-photo runtime-data policy, which forbids deleting admin-added photos without explicit confirmation.
- PR #66 (UX fixes) was squash merged into `main`: inline empty-guest-name validation message, `/admin` root redirect to login/dashboard, and the floating "Review order (N)" link on long menus.
- PR #67 (M12 fetch resilience) was squash merged into `main`: 10s abort timeout on every request, exponential-backoff retry for idempotent GETs on network failures and 502/503/504 (never 429), no retry for writes, and a friendly offline fast-fail message.
- PR #68 (L4 login timing oracle) was squash merged into `main`: unknown usernames now burn a throwaway bcrypt verification so login timing cannot enumerate admin accounts.
- Current branch makes PgBouncer self-heal from wedged DNS (incident 2026-07-08: after a postgres restart, every connection failed with `DNS lookup failed: postgres: result=0` for two hours until a manual restart — Compose never restarts unhealthy containers by itself). The pgbouncer image now installs `postgresql-client` and gains two layers: a Compose healthcheck running a real `select 1` through the pooler (visibility + backend `depends_on` now gates on `service_healthy`), and an in-container watchdog (`pgbouncer/watchdog.sh`) that runs the same end-to-end query every 15s and kills PID 1 after 4 consecutive failures so `restart: unless-stopped` replaces the container with a fresh resolver. The ~60s failure budget means a normal postgres restart never triggers it. Documented in `docs/DEPLOYMENT-RUNBOOK.md`.

## Verification
Verification for `fix/pgbouncer-dns-selfheal` (2026-07-08):

- `docker compose config -q` passed; the pgbouncer image rebuilt cleanly (Alpine 3.9 base needs the `postgresql-client` package, not `postgresql16-client`).
- After rebuild `docker compose ps` shows pgbouncer `healthy` and both the pgbouncer process (PID 1) and the watchdog process are running in the container.
- Live outage drill: postgres was stopped; the watchdog logged `end-to-end check failed (1/4)` through `(4/4)` and `restarting container to recover`; the pgbouncer container self-restarted after ~55s (RestartCount 1). Postgres was then started and the full stack recovered to `/api/health` `{"status":"ok"}` within ~5s with no manual intervention — the exact failure that previously required a human restart.
- Tolerance drill: a normal `docker compose restart postgres` caused no pgbouncer restart (RestartCount stayed 1) and health stayed ok.
- `./scripts/check-pgbouncer.sh` passes (application query through the pooler + `SHOW POOLS` visibility).
- No application code changed: backend and frontend containers untouched.

Historical verification for earlier merged work lives in git history of this file.

## Hermes Tools Used
- read_file
- write_file
- patch
- terminal
- git/gh CLI

## Technologies / Services Touched
- PgBouncer (watchdog + healthcheck, image gains postgresql-client)
- Docker Compose (pgbouncer healthcheck, backend depends_on service_healthy)
- Git
- documentation

## What is pending
- Three.js is intentionally deferred for a later optional enhancement.

## Known issues
- The 2026-07-08 audit (`ledger/AUDIT-2026-07-08.md`) tracks the full prioritized list. H1–H4, M1–M9, M11–M14, L1–L2, L4, and L6–L7 are fixed and merged; still open by choice: M10 (localStorage JWT — planned next), L3 (old-photo deletion — planned with a policy-safe design), L5 (PgBouncer plain auth, internal-only), and L8 (harmless in-container `env_file` path).
- Guests with an order in flight at Phase 2 deploy time lose their old `/order/<int id>` tracking link (integer lookups now 404 by design); new orders use unguessable codes.
- Many menu cards still use the repeated DŌM placeholder image.

## Next recommended task
- The PgBouncer self-heal PR from `fix/pgbouncer-dns-selfheal` is open for review and merge into `main`. The agreed follow-up order (2026-07-08): next M10 (move the admin JWT from localStorage to an httpOnly cookie), then L3 (delete replaced generated drink photos while never touching curated/tracked assets). Drink-photo content work still needs the user's photos.

## Notes
- `.env` remains ignored and must not be committed.
- Do not expose local admin credentials, database passwords, JWTs, `AGENT_API_KEY`, Discord webhook URLs, tunnel credential JSON files, or connection strings.
- Runtime verification scripts should construct secrets in memory without printing them.
- Keep local dev data clean: restore smoke tests should use a temporary database and drop it after validation.
- The Cloudflare Tunnel uses `protocol: http2` because QUIC connections were unstable on this server/network during setup.
