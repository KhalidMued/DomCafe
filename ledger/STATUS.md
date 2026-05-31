# Status

## Current phase
Phase 4 — Admin Backend and Frontend in progress

## Current branch
feature/admin-drink-photo-upload

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
- Phase 4 admin dashboard summary is implemented and merged via PR #15:
  - `GET /api/admin/dashboard` requires a bearer admin token.
  - Dashboard summary returns counts for new/preparing/ready orders, orders open state, available drinks, and available beans.
  - `/admin/dashboard` loads those counts using the stored admin token.
  - Dashboard shows an admin-login-required state when no admin token is stored.
  - Local `feature/admin-dashboard-summary` branch was deleted after merge; remote feature branches were already deleted by the owner.
- Phase 4 admin orders page is implemented and merged via PR #16:
  - `GET /api/admin/orders` requires a bearer admin token.
  - The endpoint returns the 50 most recent orders with guest name, friendly status label, item count, and created time.
  - `/admin/orders` loads recent orders using the stored admin token.
  - Admins can change each order status from the orders page using the existing protected status API.
  - Local/remote `feature/admin-orders-page` branches were deleted after merge.
- Phase 4 admin menu management is implemented and merged via PR #17:
  - `GET /api/admin/menu` requires a bearer admin token and returns orders-open state, drinks, and beans.
  - Admin can toggle orders open/closed.
  - Admin can toggle drink availability.
  - Admin can toggle bean availability.
  - `/admin/menu` exposes the above controls with DŌM styling.
  - Local `feature/admin-menu-management` branch was deleted after merge; the remote branch was already deleted.
- Phase 4 admin drink photo upload is implemented on this branch:
  - `POST /api/admin/uploads/drink-photo` requires a bearer admin token.
  - Admin can upload JPEG, PNG, or WebP drink photos up to 5 MB.
  - Uploads are verified as real images, stored under `/uploads/drinks/`, and applied to the selected drink.
  - `/admin/menu` includes a replacement photo picker per drink.
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
- Frontend API client calls the Phase 2 public API routes and current Phase 4 admin routes.
- Cart/session state stores the guest name locally and keeps selected drinks in memory.
- Order status page polls every 15 seconds and cleans up its timer on unmount.
- DŌM design tokens are applied as CSS variables.
- Guest UI uses mobile-first, dark, quiet DŌM styling.
- Frontend unit tests pass for welcome, menu/cart submission, polling cleanup, admin login, admin dashboard summary, admin orders, admin menu management, and admin drink photo upload.
- Frontend production build passes.
- Backend tests pass, including admin login, admin dashboard summary, admin orders list, admin order status, admin menu management, and admin drink photo upload contract tests.
- Docker Compose backend/frontend rebuild passes.
- Health endpoint returns OK through Nginx.
- Migrations apply and seed data inserts inside Docker.
- Browser verification through Nginx completed a guest flow: welcome → menu → cart → order status.
- Admin login was verified through Nginx inside Docker without printing credentials or tokens.
- Admin menu management was verified through Nginx inside Docker: admin menu returned 22 drinks and 1 bean; orders-open, one drink, and one bean were toggled off and restored.
- Admin drink photo upload was verified through Nginx inside Docker: upload returned a `/uploads/drinks/` URL and Nginx served the uploaded JPEG.

## What is pending
- Human review/merge of the admin drink photo upload PR.
- Remaining Phase 4 scope: deeper edit forms for full drink/bean/settings content management.

## Known issues
- No active blocker.
- The frontend container still runs Vite dev server in Docker; production serving hardening remains a later deployment concern.
- Browser verification showed a Vite HMR websocket warning through Nginx in development mode; the guest flow still completed successfully.

## Next recommended task
After the admin drink photo upload PR is merged, delete the merged branch and continue Phase 4 with a focused drink edit form or bean/settings management slice from latest `main`.
