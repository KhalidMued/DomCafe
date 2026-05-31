# Status

## Current phase
Phase 5 — Agent API foundation in progress

## Current branch
feature/agent-order-controls

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
- Current branch starts the dedicated Herms/agent API surface without exposing admin JWT routes:
  - `GET /api/agent/status` returns operational status, `orders_open`, and pending order count;
  - `GET /api/agent/orders/pending` returns active orders for Herms in oldest-first order;
  - `PATCH /api/agent/orders/{order_id}/status` lets Herms move orders through allowed statuses;
  - all `/api/agent/*` routes require the dedicated `AGENT_API_KEY` bearer token.

## Verification
- Focused agent API contract tests: `6 passed`.
- Full backend tests: `51 passed`.
- Frontend tests: `22 passed`.
- Frontend production build: passed.
- Docker Compose rebuild for backend/frontend/nginx: passed.
- Runtime verification through Nginx passed:
  - created a temporary public order without printing secrets;
  - authenticated `/api/agent/*` with `AGENT_API_KEY` without printing it;
  - verified `GET /api/agent/status`;
  - verified `GET /api/agent/orders/pending` included the temporary order;
  - verified `PATCH /api/agent/orders/{order_id}/status` moved the order to `ready`;
  - removed the temporary order and order items from the local dev database after assertions.

## What is pending
- Commit, push, and open a PR for the agent order-control branch.
- Continue with the remaining agent menu/bean routes after merge.

## Notes
- `.env` remains ignored and must not be committed.
- Do not expose local admin credentials, database passwords, JWTs, `AGENT_API_KEY`, or connection strings.
- Runtime verification scripts should construct authorization headers without printing tokens.
- Keep local dev data clean: restore any runtime verification edits immediately after assertions.
