# Status

## Current phase
Phase 4 — Admin Backend and Frontend in progress

## Current branch
feature/admin-beans-settings

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
- Current branch extends admin management by a larger notch:
  - protected bean detail editing via `PATCH /api/admin/beans/{bean_id}`;
  - protected cafe settings read/update via `GET/PATCH /api/admin/settings`;
  - admin menu bean edit UI for name, origin, process, and tasting notes;
  - `/admin/settings` frontend page for cafe name, welcome message, and orders-open;
  - dashboard link to settings;
  - API docs for bean editing and settings management.

## Verification
- Backend tests: `34 passed`.
- Frontend tests: `18 passed`.
- Frontend production build: passed.
- Docker Compose rebuild for backend/frontend/nginx: passed.
- Runtime verification through Nginx passed:
  - admin login succeeded without printing secrets;
  - `PATCH /api/admin/settings` updated cafe settings;
  - `/api/settings/public` reflected the settings update;
  - `PATCH /api/admin/beans/{bean_id}` updated bean details;
  - `/api/menu` reflected the bean update;
  - original settings and bean values were restored immediately.

## What is pending
- Commit and PR for the admin beans/settings branch.
- Continue Phase 4 after merge with slightly larger, coherent PR slices where safe.

## Notes
- `.env` remains ignored and must not be committed.
- Do not expose local admin credentials, database passwords, JWTs, or connection strings.
- Runtime verification scripts should construct authorization headers without printing tokens.
- Keep local dev data clean: restore any runtime verification edits immediately after assertions.
