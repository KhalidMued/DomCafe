# Status

## Current phase
Phase 4 — Admin Backend and Frontend in progress

## Current branch
feature/admin-create-archive-catalog

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
- Current branch extends admin catalog management by another coherent notch:
  - protected create endpoints for categories, beans, and drinks;
  - protected archive endpoints for categories, beans, and drinks that mark items unavailable instead of hard-deleting;
  - admin menu UI add forms for categories, beans, and drinks;
  - admin menu UI archive actions for categories, beans, and drinks;
  - API docs describe create/archive catalog endpoints.

## Verification
- Backend tests: `45 passed`.
- Frontend tests: `22 passed`.
- Frontend production build: passed.
- Docker Compose rebuild for backend/frontend/nginx: passed.
- Runtime verification through Nginx passed:
  - admin login succeeded without printing secrets;
  - `POST /api/admin/categories`, `POST /api/admin/beans`, and `POST /api/admin/drinks` created runtime catalog rows;
  - `/api/admin/menu` reflected the created category, bean, and drink;
  - `DELETE /api/admin/categories/{category_id}`, `DELETE /api/admin/drinks/{drink_id}`, and `DELETE /api/admin/beans/{bean_id}` archived rows by marking them unavailable;
  - runtime verification rows were removed directly from the local dev database after assertions.

## What is pending
- Commit, push, and open a PR for the admin create/archive catalog branch.
- Continue Phase 4 after merge with slightly larger, coherent PR slices where safe.

## Notes
- `.env` remains ignored and must not be committed.
- Do not expose local admin credentials, database passwords, JWTs, or connection strings.
- Runtime verification scripts should construct authorization headers without printing tokens.
- Keep local dev data clean: restore any runtime verification edits immediately after assertions.
