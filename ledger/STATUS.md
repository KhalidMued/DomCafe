# Status

## Current phase
Phase 1 — Backend Foundation

## Current branch
feature/backend-foundation

## What works
- Latest `main` was pulled after PR #1 merged.
- Local `feature/project-foundation` was deleted after confirming it was merged into `main`.
- Phase 1 backend branch exists from latest `main`.
- FastAPI health endpoint checks PostgreSQL and Redis.
- SQLAlchemy models exist for categories, beans, drinks, orders, order items, and admin users.
- Alembic environment and initial Phase 1 migration exist.
- Seed builder loads DŌM categories, beans, and drinks from `docs/dom_hermes_agent_v1_2.json`.
- PgBouncer image wrapper creates a runtime `userlist.txt` from environment variables.
- AsyncPG is configured for PgBouncer transaction pooling.
- Docker Compose build and runtime verification pass.
- Health endpoint returns OK through Nginx.
- Migrations apply inside the backend container.
- Seed data inserts inside the backend container: categories=5, beans=1, drinks=22.
- Backend contract tests pass locally.
- Alembic offline SQL generation passes.

## What is pending
- PR review and merge for Phase 1.

## Known issues
- GitHub REST/API PR creation requires authenticated `gh`; now available in this environment.

## Next recommended task
Open and review the Phase 1 pull request, then merge before starting Phase 2 — Public Guest API.
