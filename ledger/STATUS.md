# Status

## Current phase
Phase 4 — Admin Backend and Frontend in progress

## Current branch
feature/admin-catalog-management

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
- Current branch extends admin catalog management by a larger notch:
  - protected category detail editing via `PATCH /api/admin/categories/{category_id}`;
  - protected category availability toggles via `PATCH /api/admin/menu/categories/{category_id}`;
  - admin menu payloads now include categories plus drink category IDs, bean IDs, and ingredients;
  - admin drink editing can reassign category/default bean and edit ingredients;
  - admin menu UI includes category cards with inline edit and availability controls;
  - API docs describe the expanded drink payload and category endpoints.

## Verification
- Backend tests: `39 passed`.
- Frontend tests: `20 passed`.
- Frontend production build: passed.
- Docker Compose rebuild for backend/frontend/nginx: passed.
- Runtime verification through Nginx passed:
  - admin login succeeded without printing secrets;
  - `PATCH /api/admin/categories/{category_id}` updated category details;
  - `PATCH /api/admin/menu/categories/{category_id}` toggled category availability;
  - `PATCH /api/admin/drinks/{drink_id}` updated drink category/default bean/ingredients;
  - `/api/admin/menu` reflected the category and drink catalog updates;
  - original category and drink values were restored immediately.

## What is pending
- Commit, push, and open a PR for the admin catalog-management branch.
- Continue Phase 4 after merge with slightly larger, coherent PR slices where safe.

## Notes
- `.env` remains ignored and must not be committed.
- Do not expose local admin credentials, database passwords, JWTs, or connection strings.
- Runtime verification scripts should construct authorization headers without printing tokens.
- Keep local dev data clean: restore any runtime verification edits immediately after assertions.
