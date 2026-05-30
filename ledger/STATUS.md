# Status

## Current phase
Phase 4 — Admin Backend and Frontend in progress

## Current branch
feature/admin-dashboard-summary

## What works
- Phase 2 PR #5 was merged into `main` and local `main` was fast-forwarded.
- Local `feature/public-guest-api` was deleted after confirming it was merged into `main`.
- Phase 3 PR #6 was merged into `main`.
- Phase 3 status PR #8 was merged into `main`; merged local/remote Phase 3 branches were deleted.
- Phase 4 admin auth foundation is implemented and merged via PR #10:
  - `POST /api/admin/login` accepts username/password.
  - Valid admin credentials return a bearer JWT.
  - Invalid credentials return `401` with a friendly message.
  - Seed creates the default admin user from environment settings when missing.
  - Local and remote `feature/admin-auth-foundation` branches were deleted after merge.
- Phase 4 admin order status API is implemented and merged via PR #11:
  - `PATCH /api/admin/orders/{order_id}/status` requires a bearer admin token.
  - Admin can update order status to `new`, `received`, `preparing`, `ready`, or `cancelled`.
  - Guest order status reflects admin updates.
  - Local and remote `feature/admin-order-status-api` branches were deleted after merge.
- Phase 4 admin login frontend is implemented and merged via PR #12:
  - `/admin/login` renders a dark DŌM admin sign-in form.
  - Successful login calls `POST /api/admin/login`, stores the bearer token locally, and opens the `/admin/dashboard` shell.
  - Invalid credentials show the backend’s friendly rejection message.
  - Local and remote `feature/admin-login-frontend` branches were deleted after merge.
- Phase 4 admin dashboard summary is implemented:
  - `GET /api/admin/dashboard` requires a bearer admin token.
  - Dashboard summary returns counts for new/preparing/ready orders, orders open state, available drinks, and available beans.
  - `/admin/dashboard` loads those counts using the stored admin token.
  - Dashboard shows an admin-login-required state when no admin token is stored.
- Uploaded brand PDFs were inspected for visual direction:
  - Dark Nubian Night surfaces.
  - Doum Gold accents.
  - Palm Dust text.
  - Quiet editorial spacing.
  - Warm, unhurried copy.
- Guest frontend pages are implemented:
  - `/` welcome/name page.
  - `/menu` public menu page with sticky category tabs and drink cards.
  - `/cart` review and submit page.
  - `/order/{order_id}` friendly order status page.
- Frontend API client calls the Phase 2 public API routes.
- Cart/session state stores the guest name locally and keeps selected drinks in memory.
- Order status page polls every 15 seconds and cleans up its timer on unmount.
- DŌM design tokens are applied as CSS variables.
- Guest UI uses mobile-first, dark, quiet DŌM styling.
- Frontend unit tests pass for welcome, menu/cart submission, polling cleanup, admin login, and admin dashboard summary.
- Frontend production build passes.
- Backend tests pass, including admin login, admin dashboard summary, and admin order status contract tests.
- Docker Compose backend rebuild passes.
- Health endpoint returns OK through Nginx.
- Migrations apply and seed data inserts inside Docker.
- Browser verification through Nginx completed a guest flow: welcome → menu → cart → order status.
- Admin login was verified through Nginx inside Docker without printing credentials or tokens.
- Admin login frontend was visually verified through Nginx at `/admin/login`.
- Admin dashboard summary API was verified through Nginx without printing credentials or tokens.
- Admin dashboard no-token state was visually verified through Nginx at `/admin/dashboard`.
- Admin status update was verified through Nginx inside Docker: admin set an order to `preparing`, and the guest status endpoint returned `preparing` with friendly copy.

## What is pending
- Human review/merge of the admin dashboard summary PR.
- Remaining Phase 4 scope: admin orders page UI/status controls, menu/bean/settings management, and photo upload.

## Known issues
- No active blocker.
- The frontend container still runs Vite dev server in Docker; production serving hardening remains a later deployment concern.
- Browser verification showed a Vite HMR websocket warning through Nginx in development mode; the guest flow still completed successfully.

## Next recommended task
After the admin dashboard summary PR is merged, delete the merged branch and continue Phase 4 with the smallest next admin orders page UI/status-controls slice from latest `main`.
