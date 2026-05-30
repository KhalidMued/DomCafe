# Status

## Current phase
Phase 3 — Guest Frontend

## Current branch
feature/guest-frontend

## What works
- Phase 2 PR #5 was merged into `main` and local `main` was fast-forwarded.
- Local `feature/public-guest-api` was deleted after confirming it was merged into `main`.
- Phase 3 branch exists from latest `main`.
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
- Frontend unit tests pass for welcome, menu/cart submission, and polling cleanup.
- Frontend production build passes.
- Backend tests still pass.
- Docker Compose rebuild passes.
- Health endpoint returns OK through Nginx.
- Migrations apply and seed data inserts inside Docker.
- Browser verification through Nginx completed a guest flow: welcome → menu → cart → order status.

## What is pending
- Commit, push, and open Phase 3 pull request.

## Known issues
- No active blocker.
- The frontend container still runs Vite dev server in Docker; production serving hardening remains a later deployment concern.

## Next recommended task
Open the Phase 3 pull request for review and merge before starting Phase 4 — Admin Backend and Frontend.
