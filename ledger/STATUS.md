# Status

## Current phase
Post-MVP maintenance — the 2026-07-08 production-readiness audit roadmap (Phases 1–5) is complete and merged

## Current branch
feat/realistic-bean-visuals

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
- PR #69 (PgBouncer DNS self-heal) was squash merged into `main`: end-to-end Compose healthcheck plus an in-container watchdog that restarts the pooler after ~60s of confirmed failure.
- PR #70 (M10 admin JWT hardening) was squash merged into `main`: the login response no longer returns the JWT; it sets an `HttpOnly`, `SameSite=Strict` `dom_admin_jwt` cookie scoped to `/api` plus a non-secret readable `dom_admin_session` hint cookie the SPA uses to gate admin pages; a new `POST /api/admin/logout` clears both; `require_admin` accepts the cookie or the existing `Authorization: Bearer` header; the frontend dropped all localStorage token handling and token parameters from admin API calls; `ADMIN_COOKIE_SECURE` (default false, because admin access includes plain-HTTP LAN/Tailscale paths) adds the `Secure` attribute for HTTPS-only setups. `docs/API.md` and `docs/SECURITY.md` document the new flow.
- PR #71 (L3 replaced-photo cleanup) was squash merged into `main` with a policy-safe design: after a photo upload commits, the previously referenced file is deleted only if it matches the exact server-generated pattern for that same drink (`<drink_id>-<32-hex>.webp`) and no other drink row still references the URL. Curated assets never qualify — `placeholder.jpg`, the tracked `.png` photos, and any hand-named file fall outside the pattern — so the curated-photo runtime-data policy is preserved. Deletion is best-effort (logged on failure, upload still succeeds). Documented in `docs/API.md` and `docs/SECURITY.md`, including the one caveat: a generated `.webp` later promoted to a tracked curated asset would still be deleted from the working tree on replacement (recoverable via `git checkout`).
- PR #72 (CI actions Node 24 bump) was squash merged into `main`: `actions/checkout` v4→v5, `actions/setup-python` v5→v6, `actions/setup-node` v4→v5, removing the Node 20 deprecation warnings.
- PR #73 (L5 PgBouncer SCRAM) was squash merged into `main`: `auth_type` moved from `plain` to `scram-sha-256`, so backend→PgBouncer and PgBouncer→PostgreSQL authentication are both challenge–response and the database password no longer crosses the Docker network in clear text; the entrypoint also chmods the generated `userlist.txt` to `0600`.
- PR #74 (L8 dead dotenv path) was squash merged into `main`: removed the dead `env_file="../.env"` dotenv source from `Settings.model_config` — it resolved nowhere in-container and was masked by Compose's `env_file:` environment injection, which is the only supported configuration path and is now stated in a comment. This closed the final finding of the 2026-07-08 audit.
- The user uploaded real photos for all remaining drinks through the admin panel (2026-07-09): all 22 drinks now have real photos (16 new WebP uploads, 6 pre-existing curated PNGs), zero placeholder cards remain, and the L3 cleanup kept the uploads directory one-file-per-drink throughout the session.
- PR #75 (curated drink photos) was squash merged into `main`: promoted the 16 new drink photos to Git-tracked curated assets (`git add -f`, ~1.6 MB total) per the runtime-data policy, and removed the superseded orphaned `cortado-c205a2f8….png` (user-confirmed; no drink referenced it). Caveat now in effect for all curated `.webp` photos: replacing one via the admin panel deletes the working-tree file (documented in `docs/SECURITY.md`; recoverable with `git checkout`).
- A full backup was taken after the photo work merged (2026-07-09): database dumps plus the `uploads/` directory now live under the canonical `/backups/dom-cafe` location (created with correct ownership), and the latest dump was proven restorable via a smoke restore into a temporary database (22 drinks, 0 placeholders, 16 orders) that was dropped afterward.
- PR #77 (Three.js drifting-beans welcome background) was squash merged into `main` (2026-07-11): a sparse field of 22 low-poly 3D beans drifting slowly behind the welcome card with gentle pointer parallax, gated on WebGL + `prefers-reduced-motion`, welcome page only, lazy chunk, full dispose/cleanup.
- Current branch replaces the placeholder bean visuals with photoreal roasted beans (user-requested, 2026-07-11). The pinched-sphere geometry and flat orange `MeshStandardMaterial`s looked plastic; now a self-authored CC0 GLB (`frontend/public/models/coffee-bean.glb`, ~210 KB, generated by `scripts/generate-coffee-bean-glb.py`) provides a sculpted bean (S-curved crease, chaff line, wrinkles, asymmetry) with baked 512² albedo/normal/ORM textures. Rendering moved to two `THREE.InstancedMesh` batches (one draw call each) with per-instance warm-brown tint, non-uniform scale, and rotation variation; materials are matte `MeshPhysicalMaterial` (`metalness 0`, `specularIntensity 0.35`, roughness-map driven) under a warm hemisphere/key/rim rig plus a dim `RoomEnvironment` PMREM env map and ACES filmic tone mapping. The model is fetched then parsed via `GLTFLoader.parse` with a graceful empty-background fallback on failure, and beans fade in over 1.6 s. Motion, parallax, gating, visibility-pause, and the card design are unchanged.

## Verification
Verification for `feat/realistic-bean-visuals` (2026-07-11):

- Frontend suite: `npm test -- --run` — 56 passed (the existing gating/fallback tests cover the rewritten component unchanged).
- `npm run build` passes; three + GLTFLoader stay entirely in the lazy `WelcomeBeans` chunk (614 kB / 157 kB gz); the eager `index` chunk is unchanged (~201 kB / 63 kB gz).
- Full Docker stack rebuilt; `/api/health` ok; `/models/coffee-bean.glb` serves `200` (214 KB) through the edge Nginx.
- Headless Chromium (Playwright) against `http://localhost:11080`: 22 instances across 2 batches confirmed live in-page, fade-in completes, beans render as recognizable roasted coffee beans (crease/chaff visible) at 1440×900 and 390×844; with `prefers-reduced-motion: reduce` emulated, no beans layer and no canvas mount at all. Before/after/mobile/reduced-motion screenshots committed under `docs/screenshots/`.
- Model asset license documented in `frontend/public/models/README.md` (self-authored, CC0); `git check-ignore` confirms the new `frontend/public/models/` path is tracked (not caught by the uploads ignore rules).

Verification for `feat/threejs-welcome-beans` (2026-07-11):

- Frontend suite: `npm test -- --run` — 56 passed (5 new in `welcome-beans.test.tsx`: WebGL/reduced-motion gating, WebGL-failure fallback renders no canvas without crashing, welcome page renders fully with no beans layer when WebGL is absent).
- `npm run build` passes; Three.js lands entirely in the lazy `WelcomeBeans` chunk (512 kB / 129 kB gz) and the eager `index` chunk is unchanged (~201 kB / 63 kB gz), so first paint is unaffected.
- Docker frontend container rebuilt; `/api/health` ok; the page HTML and the `WelcomeBeans` chunk both serve `200` through the edge Nginx.
- Headless Chromium (Playwright) against `http://localhost:11080`: canvas mounts behind the card, two screenshots 3 s apart show beans in different positions (animation live), zero console/page errors, and after submitting a name and landing on `/menu` the canvas is fully removed (welcome-page-only rule).
- `npm audit --audit-level=high`: `three`/`@types/three` introduce no advisories; the reported vite/undici/esbuild dev-tooling advisories pre-date this branch on `main` (vite pinned at 7.3.3) and are noted as a follow-up.

Verification for `chore/status-ledger-sync` (2026-07-09):

- Documentation-only change to this ledger; no code or runtime behavior touched. Facts recorded (PR #75 merged, backup in `/backups/dom-cafe`, smoke restore) were verified live earlier the same day.

Verification for `content/curated-drink-photos` (2026-07-09):

- Database survey: all 22 drinks reference a real photo (16 `.webp`, 6 curated `.png`), zero placeholders; every referenced URL exists on disk and no generated files are orphaned (only `placeholder.jpg` and the deliberately removed duplicate PNG were unreferenced).
- Sample new photos serve `200 image/webp` through the edge Nginx.
- `git check-ignore` behavior preserved: only the 16 photos were force-added; future generated uploads remain ignored.

Verification for `fix/l8-env-file-path` (2026-07-09):

- Backend container rebuilt; `/api/health` reports `ok` for database and Redis.
- In-container settings probe confirms values still come from the Compose-injected environment (non-default `jwt_secret`, `.env`-driven Discord flag, correct PgBouncer database URL) — nothing was actually reading the dead dotenv path.
- Backend suite in the container: `88 passed` plus the two known-flaky live-container failures documented under the L3 verification (they pass in clean CI).

Verification for `fix/l5-pgbouncer-scram` (2026-07-09):

- `docker compose config -q` passed; PgBouncer container rebuilt and reported healthy; backend restarted and `/api/health` reports `ok` for database and Redis (asyncpg authenticating via SCRAM).
- `SHOW CONFIG` through the stats user confirms the live `auth_type` is `scram-sha-256` (changed from the `md5`/`plain` default).
- `./scripts/check-pgbouncer.sh` passed (application query through PgBouncer plus `SHOW POOLS` visibility), `/api/menu` serves DB-backed data through the edge, `userlist.txt` inside the container is `-rw-------`, and the DNS watchdog process is still running.

Verification for `fix/l3-replaced-photo-cleanup` (2026-07-09; `ci/bump-actions-node24` was verified by its own green CI run without the Node 20 deprecation warning):

- Backend tests: new `tests/test_phase12_photo_cleanup.py` (7 tests: pattern matching incl. traversal/hostile URLs, generated-file deletion, curated `.png` kept, placeholder kept, shared-reference kept, missing-file tolerated) plus the existing upload suites — `13 passed` for the three upload-related files, `88 passed` overall in the backend container. Two known-flaky failures (`test_invalid_order_input_returns_friendly_error_shape`, `test_admin_login_rejects_invalid_credentials`) reproduce identically against unmodified `main` code in the live container (event-loop/Redis reuse), unrelated to this change.
- Live flow through the edge Nginx with credentials sourced in-memory (never printed): cookie login, then uploading a photo for `hot_latte` (placeholder-backed) left `placeholder.jpg` on disk; a second upload deleted the first generated `.webp` and kept only the new one; all 7 curated `.png` files and `git status uploads/` remained clean. Test data was fully reverted (drink restored to placeholder, test `.webp` removed).
- Backend container rebuilt; `/api/health` reports `ok`.

Historical verification for earlier merged work lives in git history of this file.

## Hermes Tools Used
- read_file
- write_file
- patch
- terminal
- git/gh CLI

## Technologies / Services Touched
- Three.js (GLTFLoader + InstancedMesh + MeshPhysicalMaterial + RoomEnvironment PBR rendering)
- Python (NumPy / Pillow / trimesh via uv venv) for procedural GLB asset generation
- React 19 / Vite (lazy chunk, public asset serving)
- Vitest + Testing Library (existing gating/fallback tests)
- Playwright headless Chromium (live visual verification, reduced-motion emulation)
- Docker Compose / Nginx (stack rebuild, edge serving checks)
- documentation

## What is pending
- Nothing — the photoreal bean visuals are on this branch awaiting PR review.

## Known issues
- The 2026-07-08 audit (`ledger/AUDIT-2026-07-08.md`) is fully closed: every finding (H1–H4, M1–M14, L1–L8) is fixed and merged.
- Guests with an order in flight at Phase 2 deploy time lose their old `/order/<int id>` tracking link (integer lookups now 404 by design); new orders use unguessable codes.

## Next recommended task
- Routine care: periodic `./scripts/backup-db.sh` plus an uploads rsync after meaningful content changes. Optional hygiene follow-up: bump vite past 7.3.3 (and refresh the lockfile) to clear the pre-existing Windows-oriented dev-tooling `npm audit` advisories (vite/undici/esbuild).

## Notes
- `.env` remains ignored and must not be committed.
- Do not expose local admin credentials, database passwords, JWTs, `AGENT_API_KEY`, Discord webhook URLs, tunnel credential JSON files, or connection strings.
- Runtime verification scripts should construct secrets in memory without printing them.
- Keep local dev data clean: restore smoke tests should use a temporary database and drop it after validation.
- The Cloudflare Tunnel uses `protocol: http2` because QUIC connections were unstable on this server/network during setup.
