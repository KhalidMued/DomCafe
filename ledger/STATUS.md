# Status

## Current phase
Phase 5 — Agent API foundation in progress

## Current branch
feature/agent-menu-controls

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
- Current branch extends the dedicated Herms/agent API surface for menu/catalog commands:
  - `GET /api/agent/menu` returns categories, drinks, and beans for Herms menu lookup;
  - `GET /api/agent/drinks/search?q=...` searches drinks by name;
  - `PATCH /api/agent/drinks/{drink_id}/availability` lets Herms toggle drink availability;
  - `GET /api/agent/beans` returns beans for Herms;
  - `GET /api/agent/beans/search?q=...` searches beans by name/origin;
  - `PATCH /api/agent/beans/{bean_id}/availability` lets Herms toggle bean availability;
  - all `/api/agent/*` routes require the dedicated `AGENT_API_KEY` bearer token.

## Verification
- Focused agent menu/control API contract tests: `8 passed`.
- Full backend tests: `59 passed`.
- Frontend tests: `22 passed`.
- Frontend production build: passed.
- Docker Compose rebuild for backend/frontend/nginx: passed.
- Runtime verification through Nginx passed:
  - authenticated `/api/agent/*` with `AGENT_API_KEY` without printing it;
  - verified `GET /api/agent/menu` returned categories, drinks, and beans;
  - verified drink and bean search endpoints;
  - toggled one drink and one bean availability through agent routes;
  - restored the original availability values immediately after assertions.

## What is pending
- Commit, push, and open a PR for the agent menu-control branch.
- Continue with Discord notification or remaining Phase 5 work after merge.

## Notes
- `.env` remains ignored and must not be committed.
- Do not expose local admin credentials, database passwords, JWTs, `AGENT_API_KEY`, or connection strings.
- Runtime verification scripts should construct authorization headers without printing tokens.
- Keep local dev data clean: restore any runtime verification edits immediately after assertions.
