# Status

## Current phase
Phase 2 — Public Guest API

## Current branch
feature/public-guest-api

## What works
- Phase 1 PR #4 was merged into `main` and local `main` was fast-forwarded.
- Local `feature/backend-foundation` was deleted after confirming it was merged into `main`.
- Phase 2 branch exists from latest `main`.
- Public settings API exists at `GET /api/settings/public`.
- Public menu API exists at `GET /api/menu` and returns active categories with available drinks.
- Guest order creation API exists at `POST /api/orders`.
- Guest order status API exists at `GET /api/orders/{order_id}`.
- Friendly public error shape is used for invalid guest order input.
- Discord notification service remains a placeholder for a later phase.
- Alembic Phase 2 migration adds `settings` plus guest note/order item snapshot fields.
- Docker Compose build and runtime verification pass.
- Health endpoint returns OK through Nginx.
- Migrations apply inside the backend container.
- Seed data inserts inside the backend container: categories=5, beans=1, drinks=22.
- `GET /api/menu` through Nginx returns categories=5 and drinks=22.
- `POST /api/orders` through Nginx creates a test order.
- `GET /api/orders/{order_id}` through Nginx returns the test order with friendly status text.
- Backend tests pass locally.
- Alembic offline SQL generation passes.

## What is pending
- PR review and merge for Phase 2.

## Known issues
- No active blocker.

## Next recommended task
Open and review the Phase 2 pull request, then merge before starting Phase 3 — Guest Frontend.
