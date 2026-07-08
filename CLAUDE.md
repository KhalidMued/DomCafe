# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## First rule

Read `AGENT.md` before doing any work. It is the original founding spec for this project (brand, schema, phase plan, security rules) and is treated as the project source of truth for *intent*. But it was written before Phase 0 and the implementation has since diverged from it in real, deliberate ways — see "Where the code differs from AGENT.md" below. When the two disagree about what currently exists, trust the code, not the spec.

## Project summary

DŌM Home Café OS is a private home café ordering and control system.

Core flows:

- Guest scans QR code, enters name, views menu, submits drink order, and sees friendly order progress.
- Admin manages orders, drink/category/bean availability, menu copy, settings, and drink photos.
- Agent/Discord flow receives order notifications and can manage orders/menu state through protected APIs.

The project has completed Phases 0–7 from `AGENT.md` (foundation through UI polish) and is now past MVP, doing incremental feature/polish work on top. Check `ledger/STATUS.md` for exactly what has shipped and what the active branch is doing.

## Stack

- Frontend: React 19 + TypeScript + Vite + Tailwind CSS v4 — no router library, no TanStack Query, no Zustand, no React Hook Form/Zod (see below)
- Backend: FastAPI (async), SQLAlchemy 2.0 async ORM, Alembic migrations
- Database: PostgreSQL 16
- Pooling: PgBouncer (transaction mode, backend connects to PgBouncer only)
- Cache/rate limits: Redis (Lua `INCR`/`EXPIRE` fixed-window script)
- Edge/runtime: Nginx inside Docker Compose (only container that publishes a host port)
- Deployment: Docker Compose, Cloudflare Tunnel (`dom.khalidmued.com`)
- Auth: admin JWT (PyJWT + bcrypt via passlib) + agent bearer key (`AGENT_API_KEY`)

Do not introduce .NET into this project.

## Working directory and port

Repository path:

```text
/home/khalid/.hermes/projects/DomCafe
```

Primary local app URL:

```text
http://localhost:11080
```

Only Nginx should publish a host port (`0.0.0.0:11080:80`). Backend, PostgreSQL, PgBouncer, and Redis stay internal to Docker (`expose`, not `ports`).

## Architecture

### Backend layout (actual, not the `AGENT.md` blueprint)

```text
backend/app/
├── main.py                # FastAPI app, exception handlers, /api/health
├── core/
│   ├── config.py          # pydantic-settings Settings, cached via get_settings()
│   ├── errors.py          # GuestApiError + friendly error-shape handlers
│   └── security.py        # JWT + bcrypt + agent-key auth helpers
├── db/
│   ├── session.py         # AsyncSessionLocal / async engine
│   ├── redis.py           # get_redis()
│   └── seed.py            # seed categories/beans/drinks
├── models/                # consolidated, not one file per table
│   ├── base.py            # Base + TimestampMixin
│   ├── menu.py            # Category, Bean, Drink
│   ├── order.py           # Order, OrderItem
│   ├── setting.py
│   └── user.py            # AdminUser
├── schemas/                # public.py, admin.py, agent.py — pydantic request/response models
├── api/
│   ├── public/routes.py    # guest-facing, no auth
│   ├── admin/routes.py     # JWT-protected
│   └── agent/routes.py     # AGENT_API_KEY-protected
├── services/                # business logic per domain (orders, drinks/menu, beans, discord, uploads, auth, dashboard)
└── security/
    └── rate_limit.py        # Redis-backed fixed-window limiter
```

All three routers (`public`, `admin`, `agent`) mount under the `/api` prefix in `main.py`; each router itself carries only a `tags=[...]`, not a path prefix — full paths live on each route decorator inside `routes.py`.

Model IDs are **not** UUIDs as `AGENT.md` originally specified: `Category`/`Bean`/`Drink` use string slugs as primary keys (`String(80)`), `Order`/`OrderItem` use autoincrement `Integer` IDs.

### Frontend layout

```text
frontend/src/
├── App.tsx              # THE actual router — hand-rolled pathname matching + history.pushState, no library
├── app/router.tsx        # Phase-0 placeholder, unused — do not add routes here
├── pages/admin/           # Admin*Page.tsx are real and lazy-loaded from App.tsx
│                          # DashboardPage.tsx/OrdersPage.tsx/BeansPage.tsx/etc. (no "Admin" prefix) are
│                          # 1-line Phase-0 placeholders, unused — don't edit them expecting effect
├── pages/public/          # WelcomePage, MenuPage, CartPage, OrderStatusPage
├── store/                 # cartStore.ts, orderProgressStore.ts — plain module-level state + a Set<listener>
│                          # pub/sub (subscribe/emit), not Zustand/Redux
├── lib/api.ts             # typed fetch wrappers + response types, no TanStack Query
├── lib/{errors,validators,i18n}.ts
└── styles/globals.css
```

When adding a page or route, wire it into `App.tsx`'s `CurrentRoute` (pathname `if` chain) and add a `lazy()` import at the top — that is the only place routing actually happens.

### Where the code differs from AGENT.md

`AGENT.md` is the original founding prompt/spec and is still correct about brand tokens, tone, phase history, and security intent, but several concrete implementation choices changed during build-out:

- No React Router, TanStack Query, Zustand, or React Hook Form/Zod — plain hand-rolled routing and pub/sub stores instead (see above).
- Model primary keys are string slugs (menu entities) or autoincrement ints (orders), not UUIDs.
- Backend models are consolidated into `models/menu.py` and `models/order.py` rather than one file per table.
- `security/` holds only `rate_limit.py`; JWT/bcrypt/agent-key logic lives in `core/security.py`, not a `security/auth.py` + `security/jwt.py` split.

Don't "fix" the code to match `AGENT.md`'s file layout — the spec is aspirational scaffolding from before Phase 0, the code is what's real.

## Development principles

Follow these defaults unless the user explicitly says otherwise:

1. Think before coding.
2. State assumptions when they matter.
3. Prefer the smallest correct change.
4. Do not add speculative features.
5. Do not refactor unrelated code.
6. Match existing style.
7. Remove only orphans created by your own change.
8. Verify with real commands before reporting success.
9. If a requested change has multiple plausible meanings, ask before choosing.

## Git workflow

Permanent rule — never violate this without the user explicitly saying otherwise in the moment:

- Never commit directly to `main`.
- Always create a new feature or fix branch from the latest `main`, commit changes there, push the branch, and open (or update) a Pull Request into `main`.
- Never merge the Pull Request yourself.
- Never push directly to `main`.
- Never delete the branch after creating the PR.
- Assume the user will always review, squash merge, and delete the branch themselves unless they explicitly tell you otherwise.

Standard flow:

```text
1. Fetch latest main.
2. Create a new branch from the latest main.
3. Make the smallest correct change.
4. Run relevant checks.
5. Commit with a clear conventional message.
6. Push the branch.
7. Open or update a pull request into main.
8. Stop. Wait for the user to review, merge, and delete the branch.
```

For DomCafe, after a PR is created or updated, verify GitHub state with `gh pr view` or equivalent. If conflicts appear, merge/rebase latest `origin/main`, resolve locally, test, push, and re-check mergeability — but still do not merge or delete the branch yourself.

## Common commands

From repo root:

```bash
docker compose config
docker compose up -d --build
curl http://localhost:11080/api/health
./scripts/check-pgbouncer.sh
```

Migrations / seed (inside the running stack):

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.db.seed
```

Frontend:

```bash
cd frontend
npm test -- --run       # vitest, single run
npm run build             # tsc && vite build
npm run dev                # vite dev server
```

Backend:

```bash
PYTHONPATH=backend python -m pytest -q
PYTHONPATH=backend python -m pytest backend/tests/test_phase4_admin_orders_list.py -q   # single file
```

Backend test files are one per phase/feature (`backend/tests/test_phaseN_*.py`) — match that naming when adding backend tests for a new capability.

Backups:

```bash
./scripts/backup-db.sh
./scripts/restore-db.sh /path/to/backup.sql
```

Use restore only when intentionally recovering data. For smoke checks, restore into a temporary database and drop it after validation.

## Runtime data and uploads

Admin-panel drink photo uploads are runtime data, not normal source code.

Current policy:

- `uploads/drinks/placeholder.jpg` and already tracked curated drink photos are source-controlled intentionally.
- Future generated admin uploads under `uploads/drinks/*` are ignored by Git by default.
- Promote a future curated menu asset only deliberately, e.g. `git add -f uploads/drinks/<file>`.
- Database rows store `/uploads/drinks/...` URLs, so backups must include both the database and `uploads/` directory.
- Longer term, uploads may move to object storage such as Cloudflare R2/S3 while preserving the public URL contract.

Do not delete user-added drink photos unless the user explicitly confirms they are disposable.

## UI and brand expectations

DomCafe should feel like a fast, simple, premium dark home-café app.

Important UI constraints:

- Full RTL and Arabic support matter.
- Use the Tajawal font where applicable, with Cairo/Almarai fallbacks.
- Keep first-screen performance light.
- Avoid decorative blobs/orbits and unnecessary Three.js before MVP/performance acceptance (Three.js has been deliberately deferred — see `ledger/STATUS.md` PR #49).
- The welcome screen should remain the simple dark card style unless asked otherwise.
- For welcome wordmark work, preserve the existing convention from project history: visible D/O/M spans, normal `O` with CSS macron overlay, D-only negative margin for D→O tightening, and tight centered logo/tagline lockup.

Brand tokens (from `AGENT.md` / `docs/dom_hermes_agent_v1_2.json`, mapped to CSS variables):

```text
nubian_night  #2C2C2A   primary dark background, headlines
doum_gold     #BA7517   accent lines, active states, CTAs
palm_dust     #F1EFE8   text on dark, light card backgrounds
nile_mist     #5DCAA5   refreshing/highlight moments
fired_clay    #D85A30   warm cues, friendly alert accents
mid_tone      #888780   secondary text
hint          #B4B2A9   placeholders, tertiary text
light_rule    #D3D1C7   borders and dividers
```

`AGENT.md`'s `menu.categories`/`menu.items` sample data is brand-concept only — never use it as seed data; the operational seed menu is the Espresso/Filter/Cold/Capsule/Special Bar list in `AGENT.md` §15 / `backend/app/db/seed.py`.

For visual UI changes, rebuild/run the Docker stack and verify the live app, preferably with browser/screenshot evidence.

## Security rules

Never commit or print secrets:

- `.env`
- admin credentials
- database passwords
- JWT secrets
- `AGENT_API_KEY`
- Discord webhook URLs
- Cloudflare tunnel credential JSON files
- connection strings

Security expectations:

- Validate input on backend boundaries.
- Keep admin routes protected by JWT.
- Keep agent routes protected by the agent bearer key.
- Preserve login/write rate limits (Nginx `limit_req` for `/api/admin/login` and `/api/orders`, plus Redis-backed backend fallback limits — see `nginx/conf.d/domcafe.conf` and `backend/app/security/rate_limit.py` / `backend/app/core/security.py`).
- Do not expose backend/Postgres/PgBouncer/Redis directly to the host or internet.
- Uploaded files must remain size-limited, type-checked, renamed server-side, and served only as static files.

## Testing expectations

Choose checks based on the change:

- Frontend UI/logic: `cd frontend && npm test -- --run`; usually also `npm run build`.
- Backend/API/db: `PYTHONPATH=backend python -m pytest -q`.
- Docker/runtime: `docker compose config`, `docker compose up -d --build`, health check, and targeted curl/browser checks.
- Upload/storage policy: verify `git check-ignore` for future generated uploads and verify committed assets still serve through Nginx.

Do not claim success from static inspection alone when runtime behavior changed.

## Documentation and ledger

Keep docs in sync with behavior changes:

- API behavior: `docs/API.md`
- Deployment/runtime operations: `docs/DEPLOYMENT-RUNBOOK.md`
- Security posture: `docs/SECURITY.md`
- Project status and verification: `ledger/STATUS.md`

When recording usage in `ledger/STATUS.md`, use the existing two sections:

```md
## Hermes Tools Used
## Technologies / Services Touched
```

Record only tools/services actually used or touched.

## PR quality bar

Every PR should explain:

- What changed
- Why
- How it was tested
- Screenshots if UI changed
- Security impact
- Rollback plan

Before final response, confirm:

- working tree status
- relevant tests/checks
- PR URL/state if a PR was created or updated
- any known blocker or skipped verification
