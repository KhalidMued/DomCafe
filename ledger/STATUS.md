# Status

## Current phase
Phase 5 — Agent API and Discord notification in progress

## Current branch
feature/discord-order-notifications

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
- Current branch adds Discord order notifications:
  - `DISCORD_WEBHOOK_URL` configures the target webhook;
  - `DISCORD_NOTIFICATIONS_ENABLED` controls default enablement;
  - `discord_notifications_enabled` setting row can enable/disable notifications at runtime;
  - new public orders send a clean Discord message after commit when configured/enabled;
  - webhook failures are logged and do not fail guest order creation.

## Verification
- Focused Discord notification tests: `5 passed`.
- Full backend tests: `64 passed`.
- Frontend tests: `22 passed`.
- Frontend production build: passed.
- Docker Compose rebuild for backend/frontend/nginx: passed.
- Runtime verification through Nginx passed:
  - temporarily pointed `DISCORD_WEBHOOK_URL` at an isolated local capture container without printing the URL;
  - enabled notifications through local runtime env only;
  - created a temporary public order;
  - verified the capture container received the Discord message;
  - verified the guest note was not included in the notification;
  - deleted the temporary order/order items, restored `.env`, recreated the backend, and removed the capture container.

## What is pending
- Commit, push, and open a PR for this branch.
- Remaining project work after this branch: Phase 6 hardening/final QA, dependency audits, rate-limit polish if not already sufficient, final deployment readiness checks, and final docs/runbook cleanup.

## Notes
- `.env` remains ignored and must not be committed.
- Do not expose local admin credentials, database passwords, JWTs, `AGENT_API_KEY`, Discord webhook URLs, or connection strings.
- Runtime verification scripts should construct secrets in memory without printing them.
- Keep local dev data clean: restore any runtime verification edits immediately after assertions.
