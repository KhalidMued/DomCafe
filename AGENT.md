# DŌM Home Café OS

You are building **DŌM Home Café OS**, a private home café ordering and control system.

Repository:

```text
https://github.com/KhalidMued/DomCafe.git
```

Base server path:

```text
/home/khalid/.hermes/projects/DomCafe
```

The project must be Dockerized, secure, version-controlled through GitHub branches and pull requests, and built in a way that lets the owner learn a proper Git workflow.

---

## 0. First Instruction: Save Project Rules

Create and maintain:

```text
AGENT.md
```

Save these instructions there and follow them throughout the project.

Every future task must begin by reading `AGENT.md`.

---

# 1. Project Rules for Herms

## Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly.
- If uncertain, ask.
- If multiple interpretations exist, present them; do not pick silently.
- If a simpler approach exists, say so.
- Push back when warranted.
- If something is unclear, stop, name what is confusing, and ask.

---

## Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No flexibility/configurability that was not requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask:

```text
Would a senior engineer say this is overcomplicated?
```

If yes, simplify.

---

## Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Do not improve adjacent code, comments, or formatting.
- Do not refactor things that are not broken.
- Match existing style, even if you would do it differently.
- If unrelated dead code is noticed, mention it; do not delete it.

When your changes create orphans:

- Remove imports, variables, functions, or files that your changes made unused.
- Do not remove pre-existing dead code unless asked.

Every changed line should trace directly to the task.

---

## Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

```steps
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Examples:

- “Add validation” → write tests for invalid inputs, then make them pass.
- “Fix a bug” → write a test that reproduces it, then make it pass.
- “Refactor X” → ensure tests pass before and after.

---

# 2. GitHub Workflow

Herms must not push directly to `main`.

For every task:

```text
1. Pull latest main.
2. Create a new feature branch.
3. Make the smallest correct change.
4. Run checks/tests.
5. Commit with a clear message.
6. Push the branch.
7. Open a pull request.
8. Wait for human review and merge.
```

Branch examples:

```text
feature/project-foundation
feature/database-schema
feature/public-menu-api
feature/guest-flow
feature/admin-orders
feature/agent-api-routes
feature/discord-notifications
feature/security-hardening
feature/dom-ui-polish
```

Commit examples:

```text
feat: add project foundation
feat: add database schema and migrations
feat: add guest menu flow
security: add login rate limiting
docs: add deployment runbook
```

Create this PR template:

```text
.github/pull_request_template.md
```

Template content:

```md
## What changed?

## Why?

## How was it tested?

## Screenshots, if UI changed

## Security impact

## Rollback plan
```

The owner will manually review and merge PRs into `main`.

---

# 3. Project Purpose

Build a private home café system.

Guest flow:

```text
Guest scans QR code
→ enters name
→ sees the DŌM digital menu
→ selects drinks and quantity
→ submits order
→ sees friendly live order progress
```

Admin flow:

```text
Admin opens control site
→ views new orders
→ updates status
→ manages categories, drinks, beans, photos, and availability
```

Herms/Discord flow:

```text
New order is created
→ Discord receives notification
→ Herms can read pending orders
→ Herms can update status through protected agent API routes
→ Herms can toggle drink/bean availability
```

---

# 4. Technology Stack

Use:

```text
Frontend: React + TypeScript + Vite + Tailwind CSS
Backend: FastAPI
Database: PostgreSQL
Connection pool: PgBouncer (pgbouncer/pgbouncer:latest)
Cache/rate limit: Redis
Reverse proxy: Nginx inside the Docker Compose stack
Public exposure later: Cloudflare Tunnel
Git workflow: branch per task + PR into main
Realtime MVP: polling every 15 seconds
Admin auth: JWT + bcrypt + login rate limiting
Agent auth: AGENT_API_KEY
Deployment: Docker Compose
```

Do not use .NET for this project. Use FastAPI.

## Port and bind convention

```text
App port: always use an unused host port >= 11000.
Default app entry port for this project: 11080.

Container services must listen internally on 0.0.0.0, not 127.0.0.1, so Docker networking works correctly.

For browser/local access, use:
http://localhost:11080
or
http://<server-ip>:11080

Host binding:
- Use 127.0.0.1:11080 if Cloudflare Tunnel or NPM runs on the same host.
- Use 0.0.0.0:11080 only if an external NPM/rProxy server on the LAN must reach the app.

Never expose backend, PostgreSQL, PgBouncer, Redis, or internal services publicly.
```

## Dependency freshness

```text
Do not use outdated, deprecated, or known-compromised packages.
Before adding a dependency, check it is actively maintained.
Prefer well-maintained packages with recent releases.
Flag any dependency with known CVEs and propose an alternative.
```

---

# 5. Project Directory Structure

Base path: `/home/khalid/.hermes/projects/Dom-Cafe`

Create this structure if it does not exist:

```tree
DomCafe/
├── AGENT.md
├── README.md
├── docker-compose.yml
├── docker-compose.prod.yml
├── env.example
├── .gitignore
├── .github/
│   └── pull_request_template.md
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT-RUNBOOK.md
│   ├── SECURITY.md
│   ├── Project-Blueprint.md
│   ├── PRD.md
│   └── USER-GUIDE.md
├── ledger/
│   ├── STATUS.md
│   ├── CHANGELOG.md
│   └── ROLLBACK-PLAN.md
├── logo/
├── certs/
├── secrets/
│   └── .gitkeep
├── scripts/
│   ├── dev-up.sh
│   ├── dev-down.sh
│   ├── logs.sh
│   ├── backup-db.sh
│   ├── restore-db.sh
│   └── create-branch.sh
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│       └── domcafe.conf
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── api/
│   │   ├── services/
│   │   ├── security/
│   │   └── db/
│   └── migrations/
└── uploads/
    └── drinks/
```

Important:

```text
secrets/ must never be committed.
.env must never be committed.
env.example must be committed.
uploads/ should be backed up.
```

---

# 6. Docker and Network Setup

Use Docker Compose.

Services:

```text
frontend
backend
postgres
pgbouncer
redis
nginx
```

Include PgBouncer from Phase 0. Use image `pgbouncer/pgbouncer:latest`.

Configure PgBouncer in transaction pooling mode between the backend and PostgreSQL.

Backend connects to PgBouncer, not directly to PostgreSQL.

Only expose the app through Nginx.

Recommended ports:

```text
Nginx app entry: 11080
Default host binding: 127.0.0.1:11080 if Cloudflare Tunnel or NPM runs on the same host
LAN host binding: 0.0.0.0:11080 only if an external NPM/rProxy server on the LAN must reach the app
Frontend internal: container only
Backend internal: container only
PgBouncer internal: container only
PostgreSQL: internal only
Redis: internal only
```

Containers must listen internally on `0.0.0.0` so Docker networking works. Host binding should be as narrow as possible.

Do not expose backend, PostgreSQL, PgBouncer, or Redis publicly.

Nginx routes:

```text
/          → frontend
/api/      → backend
/uploads/  → uploaded drink photos
```

Cloudflare Tunnel will be configured later and should point to the reverse proxy/Nginx entry, usually:

```text
http://localhost:11080
```

The app must work locally before any Cloudflare or public domain setup.

---

# 7. Nginx Requirements

The internal Nginx container should:

- Serve the React frontend.
- Reverse proxy `/api/*` to FastAPI.
- Serve `/uploads/*` safely.
- Support SPA fallback for React Router.
- Set basic security headers.
- Limit upload body size.
- Avoid caching API routes.
- Allow caching static frontend assets.
- Not expose internal services.

Recommended security headers:

```text
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Do not add an overly strict CSP until the UI and assets are stable. Mention CSP as future hardening.

---

# 8. Environment Variables

Create `env.example`.

Use:

```env
APP_NAME=DomCafe
APP_ENV=development
APP_BASE_URL=http://localhost:11080

FRONTEND_ORIGIN=http://localhost:11080

POSTGRES_DB=dom_cafe
POSTGRES_USER=dom_cafe_user
POSTGRES_PASSWORD=change_me
DATABASE_URL=postgresql+asyncpg://dom_cafe_user:change_me@postgres:5432/dom_cafe

REDIS_URL=redis://redis:6379/0

JWT_SECRET=change_me_long_random
JWT_EXPIRES_MINUTES=1440

ADMIN_DEFAULT_USERNAME=admin
ADMIN_DEFAULT_PASSWORD=change_me

AGENT_API_KEY=change_me_long_random_agent_key

DISCORD_WEBHOOK_URL=
DISCORD_NOTIFICATIONS_ENABLED=false

UPLOAD_DIR=/app/uploads
MAX_UPLOAD_MB=5

ORDER_POLLING_SECONDS=15
```

Production secrets must be long, random, and not committed.

---

# 9. Brand Source of Truth

Use the uploaded DOM brand files as references:

```text
dom_brand_identity.pdf
dom_brand_story.pdf
dom_menu.pdf
dom_print_assets.pdf
dom_hermes_agent_v1_2.json
```

Primary source for digital UI and copy tone:

```text
dom_hermes_agent_v1_2.json
```

Use it for:

- Brand name
- Tagline
- Color tokens
- Typography direction
- Voice and tone
- Digital menu UI behavior
- Copy blocks
- Layout rules

Important — two clear rules:

**Rule 1 — Brand tokens: USE these from the JSON.**

The `design_tokens.colors` block in `dom_hermes_agent_v1_2.json` is the authoritative source for the Tailwind config and CSS variables.

Map them directly:

```text
nubian_night  #2C2C2A  → var(--color-nubian-night)
doum_gold     #BA7517  → var(--color-doum-gold)
palm_dust     #F1EFE8  → var(--color-palm-dust)
nile_mist     #5DCAA5  → var(--color-nile-mist)
fired_clay    #D85A30  → var(--color-fired-clay)
mid_tone      #888780  → var(--color-mid-tone)
hint          #B4B2A9  → var(--color-hint)
light_rule    #D3D1C7  → var(--color-light-rule)
```

The `voice`, `tagline`, `copy_blocks`, and `digital_menu_ui_rules` blocks must also be used directly when generating UI copy and layout behavior.

**Rule 2 — Sample menu items: DO NOT USE these from the JSON.**

The JSON’s `menu.categories` and `menu.items` are brand concept samples only.

Do not use them as seed data.

Use the operational seed menu defined in Section 15 of this prompt instead.

---

# 10. DŌM Brand Requirements

Brand:

```text
Name: DŌM
Type: Home Café
Tagline: Slow coffee. Deep roots.
```

Preserve the macron over the O:

```text
DŌM
```

Do not remove it in the main wordmark or major headings.

Brand meaning:

```text
DŌM is inspired by the Doum palm and Nubian heritage.
It should feel slow, rooted, warm, quiet, and intentional.
```

Tone:

```text
Warm
Unhurried
Grounded
Friendly
Certain without arrogance
```

Language rules:

- Use short sentences.
- Use concrete images.
- Avoid trendy coffee jargon.
- Avoid urgency.
- Avoid over-explanation.
- Avoid exaggerated marketing language.

Good copy:

```text
Welcome to DŌM. Take your time.
Your order was received.
Your drink is being prepared.
Your drink is ready — we’ll bring it to you shortly.
```

Bad copy:

```text
Your premium beverage experience is being crafted with artisanal excellence.
```

---

# 11. Design Tokens

Implement these as CSS variables and Tailwind theme tokens.

```text
Nubian Night  #2C2C2A
Doum Gold     #BA7517
Palm Dust     #F1EFE8
Nile Mist     #5DCAA5
Fired Clay    #D85A30
Mid Tone      #888780
Hint          #B4B2A9
Light Rule    #D3D1C7
```

Usage:

```text
Nubian Night: primary dark background, headlines, dark surfaces
Doum Gold: accent lines, active states, CTAs, macron mark feel
Palm Dust: text on dark, light card backgrounds
Nile Mist: refreshing/highlight moments
Fired Clay: warm cues and friendly alert accents
Mid Tone: secondary text
Hint: placeholders and tertiary text
Light Rule: borders and dividers
```

---

# 12. Typography and RTL

Arabic and RTL support is required, but the MVP can default to English with bilingual-ready structure.

Requirements:

- Use font loading in the app so the approved Arabic fonts render even if the client device does not have them.
- Default Arabic font: Tajawal.
- Fallback fonts:
  1. Cairo
  2. Almarai
- Build components so RTL can be enabled later cleanly.
- Avoid hard-coded left/right layout where logical CSS can be used.
- Store Arabic-capable fields where useful, but do not overbuild translations unless requested.

Suggested typography direction:

```text
Display: very wide tracking, light weight, for DŌM wordmark moments
Headings: wide tracking, calm, minimal
Body: readable 14–16px, line-height around 1.7
Labels: uppercase, small, letter-spaced
```

---

# 13. UI Requirements

The UI should follow the DOM brand mood:

```text
Minimal
Dark by default
Warm
Editorial
Quiet
Premium
Home café, not food delivery app
```

Digital menu rules:

```text
Single-scroll vertical feed
Sticky horizontal category tabs
Active tab has Doum Gold underline
Category sections are spacious
Cards are elegant and quiet
Photos are required for every drink
Tap item/card to expand details
Show bean used
Show available/unavailable state
Show temperature options
Show milk options when applicable
```

Guest-facing pages must be mobile-first.

Admin pages can be desktop/tablet friendly.

---

# 14. Three.js Requirements

Three.js is optional and decorative only.

Allowed ideas:

```text
Soft floating DŌM logo mark in the background
Gentle animated bean/palm-inspired object
Small interactive menu card tilt effect
Subtle rotating 3D coffee cup sleeve on the welcome page
```

Rules:

- Use Three.js only on the welcome page.
- Lazy load it.
- It must not block page load.
- If WebGL fails, show a static fallback.
- Do not use Three.js on menu, cart, or order tracking.
- Menu, cart, and order tracking must remain fast and mobile-first.

Use only if it can be done simply. If it complicates the first MVP, create a placeholder component and mark it as future enhancement.

---

# 15. MVP Menu Categories and Seed Drinks

Use these operational categories, not the DOM sample menu categories.

Categories:

```text
Espresso Bar
Filter Bar
Cold Bar
Capsule Bar
Special Menu
```

Seed drinks:

```text
Espresso Bar:
- Espresso
- Americano
- Cortado
- Cappuccino
- Flat White
- Hot Latte
- Iced Latte
- Spanish Latte
- Vanilla Latte
- Caramel Latte

Filter Bar:
- V60
- Chemex
- Batch Brew

Cold Bar:
- Iced V60
- Iced Chemex
- Cold Brew

Capsule Bar:
- Nespresso Espresso
- Nespresso Americano
- Decaf Capsule

Special Menu:
- Matcha Latte
- Hot Chocolate
- Tea
```

Do not include prices in MVP.

Do not include small plates in MVP.

Every seed drink must have a placeholder `photo_url`.

Use this value for all seed drinks:

```text
/uploads/drinks/placeholder.jpg
```

During Phase 0, create a simple gray placeholder image at:

```text
uploads/drinks/placeholder.jpg
```

A plain 800×600 gray rectangle with the text “DŌM” centered is sufficient.

Generate it programmatically (Python Pillow or similar) as part of the foundation setup.

Admin must be able to replace photos later.

---

# 16. Database Schema

Use PostgreSQL with Alembic migrations.

## categories

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## beans

```sql
CREATE TABLE beans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    origin VARCHAR(150),
    process VARCHAR(100),
    roast_level VARCHAR(100),
    tasting_notes JSONB DEFAULT '[]',
    recommended_for JSONB DEFAULT '[]',
    available BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## drinks

```sql
CREATE TABLE drinks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id),
    default_bean_id UUID REFERENCES beans(id),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    ingredients JSONB DEFAULT '[]',
    photo_url TEXT NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    temperature_options JSONB DEFAULT '[]',
    milk_options JSONB DEFAULT '[]',
    estimated_time_minutes INTEGER DEFAULT 4,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

No equipment/tool field.

No price field.

Admin selects default bean for each drink.

Guest sees bean but does not choose the bean in MVP.

## orders

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_name VARCHAR(100) NOT NULL,
    guest_note TEXT,
    status VARCHAR(50) DEFAULT 'new',
    order_number SERIAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_at TIMESTAMP,
    preparing_at TIMESTAMP,
    ready_at TIMESTAMP,
    cancelled_at TIMESTAMP
);
```

Allowed statuses:

```text
new
received
preparing
ready
cancelled
```

Guest-facing status labels:

```text
new = Your order was sent to the bar.
received = Your order was received.
preparing = Your drink is being prepared.
ready = Your drink is ready — we’ll bring it to you shortly.
cancelled = This order was cancelled. Please check with the coffee bar.
```

Admin controls the status.

Guest only sees the current status and progress.

## order_items

```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    drink_id UUID NOT NULL REFERENCES drinks(id),
    drink_name_snapshot VARCHAR(150) NOT NULL,
    category_name_snapshot VARCHAR(100),
    bean_name_snapshot VARCHAR(150),
    photo_url_snapshot TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    temperature VARCHAR(20),
    milk_option VARCHAR(50),
    item_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Snapshots are required so old orders remain accurate after menu edits.

## settings

```sql
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Example settings:

```text
cafe_name = DŌM
welcome_message = Welcome to DŌM. Take your time.
orders_open = true
discord_notifications_enabled = true
brand_mode = dark
```

## admin_users

```sql
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);
```

Indexes:

```sql
CREATE INDEX idx_drinks_category_id ON drinks(category_id);
CREATE INDEX idx_drinks_available_active ON drinks(available, is_active);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

## Query optimization rules

```text
Never SELECT * in production queries — select only the columns needed.
Use LIMIT on all list queries that could grow unbounded.
Avoid N+1 queries — use joins or eager loading where appropriate.
Admin orders list: always filter by status or date range, never full table scan.
Menu query: filter by is_active=true and available=true at the DB level, not in Python.
Use EXPLAIN ANALYZE during development to verify index usage on heavy queries.
```

---

# 17. Guest Pages

## `/`

Welcome page.

Guest sees:

```text
DŌM
Slow coffee. Deep roots.
Welcome to DŌM. Take your time.
[Name input]
[Start]
```

Behavior:

```text
Save guest name locally.
Redirect to /menu.
```

Optional Three.js component only here.

## `/menu`

Main visual menu.

Show:

- Sticky category tabs.
- Category sections.
- Drink cards.
- Drink photos.
- Drink name.
- Description.
- Bean used.
- Availability.
- Temperature options.
- Milk options.
- Add to order button.

## `/cart`

Review page.

Show:

- Guest name.
- Selected drinks.
- Quantities.
- Temperature.
- Milk option.
- Item notes.
- General order note.
- Submit button.

## `/order/:orderId`

Live order tracking page.

Show:

- Order number.
- Guest name.
- Ordered items.
- Current status.
- Friendly progress bar.

Polling:

```text
GET /api/orders/:orderId every 15 seconds
```

Guest cannot update the status.

---

# 18. Admin Pages

## `/admin/login`

Username/password login.

## `/admin/dashboard`

Show:

```text
New orders count
Preparing orders count
Ready orders count
Orders open/closed
Available drinks count
Available beans count
Quick links
```

## `/admin/orders`

Show live order cards.

Each card:

```text
Order number
Guest name
Order time
Items
Quantity
Temperature
Milk option
Notes
Current status
```

Buttons:

```text
Mark Received
Start Preparing
Mark Ready
Cancel Order
```

## `/admin/menu`

Admin can:

```text
View all drinks
Filter by category
Toggle availability
Edit drink
Archive drink
Add new drink
```

## `/admin/drinks/new`

Fields:

```text
name
category
description
ingredients
default bean
photo
available
temperature options
milk options
estimated time
display order
```

Validation:

```text
Photo is required.
Name is required.
Category is required.
Description is required.
```

## `/admin/drinks/:id/edit`

Same fields as new drink.

## `/admin/beans`

Admin can:

```text
Add bean
Edit bean
Mark bean available/unavailable
Set tasting notes
Set recommended uses
```

Fields:

```text
name
origin
process
roast level
tasting notes
recommended for
available
display order
```

## `/admin/settings`

Fields:

```text
cafe name
welcome message
orders open/closed
discord notifications enabled
```

---

# 19. Public API Routes

## Get public settings

```http
GET /api/settings/public
```

Response:

```json
{
  "cafe_name": "DŌM",
  "welcome_message": "Welcome to DŌM. Take your time.",
  "orders_open": true
}
```

## Get public menu

```http
GET /api/menu
```

Return active categories and available drinks.

Each drink includes:

```json
{
  "id": "drink-id",
  "name": "Spanish Latte",
  "description": "A smooth espresso milk drink with a sweet finish.",
  "ingredients": ["espresso", "milk", "condensed milk"],
  "bean": {
    "id": "bean-id",
    "name": "Albal Brazilian",
    "origin": "Brazil",
    "tasting_notes": ["chocolate", "nuts", "caramel"]
  },
  "photo_url": "/uploads/drinks/spanish-latte.jpg",
  "available": true,
  "temperature_options": ["hot", "iced"],
  "milk_options": ["whole milk", "low-fat milk", "oat milk"],
  "estimated_time_minutes": 4
}
```

## Create order

```http
POST /api/orders
```

Request:

```json
{
  "guest_name": "Ahmed",
  "guest_note": "We are sitting outside.",
  "items": [
    {
      "drink_id": "drink-id",
      "quantity": 2,
      "temperature": "iced",
      "milk_option": "whole milk",
      "item_note": "Less sweet please."
    }
  ]
}
```

Backend behavior:

```text
1. Check orders_open.
2. Validate guest name.
3. Validate at least one item.
4. Validate drink exists.
5. Validate drink is active and available.
6. Validate selected temperature is allowed.
7. Validate selected milk option is allowed.
8. Create order.
9. Create order item snapshots.
10. Trigger Discord notification if enabled.
11. Return order id and order number.
```

Response:

```json
{
  "order_id": "order-id",
  "order_number": 12,
  "status": "new",
  "message": "Your order was sent to the bar."
}
```

## Get order status

```http
GET /api/orders/:orderId
```

Response:

```json
{
  "id": "order-id",
  "order_number": 12,
  "guest_name": "Ahmed",
  "status": "preparing",
  "status_label": "Your drink is being prepared.",
  "items": [
    {
      "drink_name": "Iced Spanish Latte",
      "quantity": 2,
      "temperature": "iced",
      "milk_option": "whole milk",
      "item_note": "Less sweet please.",
      "bean_name": "Albal Brazilian",
      "photo_url": "/uploads/drinks/spanish-latte.jpg"
    }
  ],
  "created_at": "2026-05-29T15:20:00Z"
}
```

---

# 20. Admin API Routes

All admin routes require JWT auth.

```http
POST   /api/admin/login
GET    /api/admin/dashboard
GET    /api/admin/orders
PATCH  /api/admin/orders/:orderId/status

GET    /api/admin/categories
POST   /api/admin/categories
PATCH  /api/admin/categories/:categoryId
DELETE /api/admin/categories/:categoryId

GET    /api/admin/drinks
POST   /api/admin/drinks
PATCH  /api/admin/drinks/:drinkId
DELETE /api/admin/drinks/:drinkId
PATCH  /api/admin/drinks/:drinkId/availability

POST   /api/admin/uploads/drink-photo

GET    /api/admin/beans
POST   /api/admin/beans
PATCH  /api/admin/beans/:beanId
DELETE /api/admin/beans/:beanId
PATCH  /api/admin/beans/:beanId/availability

GET    /api/admin/settings
PATCH  /api/admin/settings
```

Delete behavior:

```text
Do not hard delete drinks/categories/beans.
Archive them or set is_active=false / available=false where appropriate.
```

---

# 21. Agent-Specific API Routes

All agent routes require:

```http
Authorization: Bearer AGENT_API_KEY
```

Create clean agent-specific routes. Herms should not use admin JWT.

```http
GET   /api/agent/status
GET   /api/agent/orders/pending
PATCH /api/agent/orders/:orderId/status

GET   /api/agent/menu
GET   /api/agent/drinks/search?q=spanish
PATCH /api/agent/drinks/:drinkId/availability

GET   /api/agent/beans
GET   /api/agent/beans/search?q=colombia
PATCH /api/agent/beans/:beanId/availability
```

Herms examples:

```text
Show pending orders.
Mark Ahmed's order as preparing.
Mark order 12 as ready.
Make Spanish Latte unavailable.
Enable Cold Brew.
Show available beans.
Mark Colombian bean unavailable.
```

---

# 22. Discord Notification

When a new order is created and Discord notifications are enabled, send a webhook message:

```text
☕ New DŌM order

Order #12
Guest: Ahmed

Items:
- 2x Iced Spanish Latte
  Milk: Whole milk
  Note: Less sweet

Status: New
```

Keep the tone clean and useful.

Do not include secrets.

Buttons are not required for MVP.

---

# 23. Security Requirements

## Public guest protection

Implement:

```text
Rate limit order creation.
Validate all input.
Limit guest name length.
Limit notes length.
Limit quantity.
Limit order item count.
Block unavailable drinks.
Do not expose internal errors.
```

Suggested limits:

```text
guest_name: max 50 chars
guest_note: max 300 chars
item_note: max 200 chars
quantity: 1–10
order items: max 10 per order
```

## Admin protection

Implement:

```text
JWT admin login
bcrypt password hashing
login rate limiting
protected admin routes
role-ready structure, even if only admin exists
```

For MVP:

```text
admin role only
```

## Agent protection

Implement:

```text
AGENT_API_KEY auth for /api/agent/*
Do not expose admin routes to the agent.
Do not log AGENT_API_KEY.
```

## SQL injection immunity

Use ORM/query parameterization. Never build SQL through string concatenation with user input.

## Upload security

For drink photos:

```text
Allow only safe image types.
Limit file size.
Normalize filenames.
Store under uploads/drinks.
Never execute uploaded files.
Return only safe public path.
```

## Dependency security

```text
Do not install packages with known CVEs.
Do not use deprecated or unmaintained libraries.
Pin dependency versions in requirements.txt and package.json.
Run pip-audit (Python) and npm audit (Node) during Phase 6 hardening.
Flag and resolve any high or critical severity findings before deployment.
```

---

# 24. Friendly Error Handling

Backend error shape:

```json
{
  "error": true,
  "code": "DRINK_UNAVAILABLE",
  "message": "Sorry, this drink is currently unavailable. Please choose another one."
}
```

Guest-facing errors:

```text
Menu failed:
We couldn’t load the menu right now. Please refresh or check with the coffee bar.

Orders closed:
The coffee bar is not taking orders right now. Please check again shortly.

Drink unavailable:
Sorry, this drink is currently unavailable. Please choose another one.

Order submit failed:
We couldn’t send your order. Please try again.

Status refresh failed:
We’re having trouble refreshing your order status. We’ll try again shortly.
```

Never show guests:

```text
stack traces
SQL errors
JWT details
internal exception messages
```

---

# 25. Logging

Backend logs should include:

```text
request id
method
path
status code
duration
error code if any
```

Do not log:

```text
passwords
JWTs
AGENT_API_KEY
Authorization headers
raw secrets
```

For MVP, log to container stdout.

Later, the owner may connect logs to Graylog.

---

# 26. Frontend State and UX

Use:

```text
TanStack Query for API fetching/caching.
Zustand or simple context for cart/session state.
React Hook Form + Zod for forms.
Skeleton loaders for loading states.
Friendly toast/inline errors.
Exponential backoff retry on failed requests.
```

Avoid memory leaks:

```text
Clean polling timers on unmount.
Do not create repeated intervals.
Use query refetch intervals carefully.
```

Order status polling:

```text
Every 15 seconds.
Stop or reduce polling after ready/cancelled.
```

## Offline and slow connection handling

```text
Detect when the user is offline (navigator.onLine + online/offline events).
Show a clear, friendly offline banner — do not silently fail.
Queue or block order submission when offline — do not allow a guest to submit into a void.
Resume gracefully when connection is restored.
```

## Retry with exponential backoff

```text
Apply to: menu fetch, order status polling, order submission retry.
Strategy: retry up to 3 times with delays of 1s, 2s, 4s.
Do not retry 4xx client errors — only retry on network failure or 5xx.
Show a loading/retrying state to the user during retries.
After max retries, show a friendly error with a manual retry button.
```

## Performance on slow connections

```text
Use skeleton loaders for all data-fetching states — never blank screens.
Lazy load non-critical components (Three.js, admin charts).
Compress images served from /uploads — use WebP where possible.
Avoid blocking render on non-essential API calls.
Keep initial bundle size lean — split admin and guest bundles.
```

---

# 27. Backend Structure

Use this backend structure:

```tree
backend/app/
├── main.py
├── core/
│   ├── config.py
│   ├── errors.py
│   └── logging.py
├── db/
│   ├── session.py
│   └── seed.py
├── models/
│   ├── category.py
│   ├── bean.py
│   ├── drink.py
│   ├── order.py
│   ├── order_item.py
│   ├── setting.py
│   └── admin_user.py
├── schemas/
├── api/
│   ├── public/
│   ├── admin/
│   └── agent/
├── services/
│   ├── orders.py
│   ├── drinks.py
│   ├── beans.py
│   ├── discord.py
│   └── uploads.py
└── security/
    ├── auth.py
    ├── passwords.py
    ├── jwt.py
    ├── rate_limit.py
    └── agent_key.py
```

---

# 28. Frontend Structure

Use this frontend structure:

```tree
frontend/src/
├── app/
│   ├── router.tsx
│   └── providers.tsx
├── pages/
│   ├── public/
│   │   ├── WelcomePage.tsx
│   │   ├── MenuPage.tsx
│   │   ├── CartPage.tsx
│   │   └── OrderStatusPage.tsx
│   └── admin/
│       ├── LoginPage.tsx
│       ├── DashboardPage.tsx
│       ├── OrdersPage.tsx
│       ├── MenuManagerPage.tsx
│       ├── DrinkFormPage.tsx
│       ├── BeansPage.tsx
│       └── SettingsPage.tsx
├── components/
│   ├── ui/
│   ├── menu/
│   ├── orders/
│   ├── admin/
│   └── three/
├── lib/
│   ├── api.ts
│   ├── errors.ts
│   ├── validators.ts
│   └── i18n.ts
├── store/
│   └── cartStore.ts
└── styles/
    └── globals.css
```

---

# 29. Backup and Deployment Scripts

Create scripts:

```text
scripts/dev-up.sh
scripts/dev-down.sh
scripts/logs.sh
scripts/backup-db.sh
scripts/restore-db.sh
scripts/create-branch.sh
```

Backup location recommendation:

```text
/backups/dom-cafe/
```

Do not rely only on Docker volumes.

---

# 30. Documentation Requirements

Create and update:

```text
docs/API.md
docs/ARCHITECTURE.md
docs/DEPLOYMENT-RUNBOOK.md
docs/SECURITY.md
docs/Project-Blueprint.md
docs/PRD.md
docs/USER-GUIDE.md
ledger/STATUS.md
ledger/CHANGELOG.md
ledger/ROLLBACK-PLAN.md
README.md
```

Docs should be concise and practical.

`ledger/STATUS.md` must always show:

```text
Current phase
Current branch
What works
What is pending
Known issues
Next recommended task
```

---

# 31. Build Phases

Do the project in phases. Open one PR per phase or per coherent task.

## Phase 0 — Foundation

```text
Create project structure.
Create AGENT.md.
Create docs skeleton.
Create Docker Compose skeleton.
Create env.example.
Create PR template.
Create README.
Open PR: feature/project-foundation.
```

Verify:

```text
Repo structure exists.
Docker files exist.
Docs exist.
No secrets committed.
```

## Phase 1 — Backend Foundation

```text
FastAPI app.
PostgreSQL connection.
Redis connection.
Alembic.
Models.
Migrations.
Seed categories, beans, and drinks.
Health endpoint.
```

Verify:

```text
docker compose up works.
health endpoint returns OK.
migrations apply.
seed data inserts.
```

## Phase 2 — Public Guest API

```text
Public settings API.
Public menu API.
Create order API.
Get order status API.
Friendly errors.
Discord service placeholder.
```

Verify:

```text
GET /api/menu works.
POST /api/orders works.
GET /api/orders/:id works.
Invalid input returns friendly errors.
```

## Phase 3 — Guest Frontend

```text
Welcome page.
Menu page.
Cart page.
Order status page with 15-second polling.
DOM design tokens.
Mobile-first styling.
```

Verify:

```text
Guest can complete order flow.
Status page polls correctly.
UI follows DŌM brand direction.
```

## Phase 4 — Admin Backend and Frontend

```text
Admin login.
JWT auth.
Dashboard.
Orders page.
Status controls.
Menu management.
Bean management.
Settings page.
Photo upload.
```

Verify:

```text
Admin can log in.
Admin can update order status.
Guest sees updated status.
Admin can manage drinks and beans.
Photo required for drinks.
```

## Phase 5 — Agent and Discord

```text
AGENT_API_KEY middleware.
Agent routes.
Discord webhook for new orders.
Pending order retrieval.
Status update through agent routes.
Drink/bean availability through agent routes.
```

Verify:

```text
Agent key required.
Pending orders route works.
Status update route works.
Discord webhook sends new order notification if configured.
```

## Phase 6 — Security and Deployment Hardening

```text
Nginx hardening.
Rate limits.
Input validation review.
Upload security.
Dependency audit (pip-audit + npm audit).
Backup scripts.
Deployment runbook.
Cloudflare Tunnel notes.
PgBouncer pool health check.
```

Verify:

```text
Only Nginx app port exposed on 0.0.0.0:11080.
Backend/db/pgbouncer/redis not public.
Login is rate limited.
Order creation is rate limited.
Backups work and restore has been tested.
No high/critical CVEs in dependencies.
PgBouncer is accepting connections and pooling correctly.
```

## Phase 7 — UI Polish

Only after the system works.

```text
Refine DŌM visuals.
Add optional Three.js welcome component if simple.
Improve animations.
Improve empty states.
Improve RTL readiness.
```

Verify:

```text
No slowdown on mobile.
No broken layout.
Three.js fallback works.
```

---

# 32. Local Development Commands

Expected setup:

```bash
cd /home/khalid/.hermes/projects/DomCafe
cp env.example .env
docker compose up -d --build
```

Migrations:

```bash
docker compose exec backend alembic upgrade head
```

Seed:

```bash
docker compose exec backend python -m app.db.seed
```

Logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
```

App:

```text
http://localhost:11080
```

Note: containers bind internally on `0.0.0.0`, but browser/local access should use `http://localhost:11080` or `http://<server-ip>:11080`. Use host binding `0.0.0.0:11080` only when an external NPM/rProxy server on the LAN must reach the app.

---

# 33. Cloudflare Tunnel and NPM Notes

Do not configure Cloudflare Tunnel in the first MVP task unless explicitly asked.

The app should be ready to sit behind:

```text
Cloudflare Tunnel
→ NPM/main reverse proxy
→ DomCafe internal Nginx on localhost:11080
→ frontend/backend
```

NPM may be used later as the main homelab reverse proxy.

The internal app Nginx remains useful because it keeps app routing version-controlled inside Git.

---

# 34. Final Success Criteria

The MVP is successful when:

```text
1. The app runs with Docker Compose.
2. Guest can enter name and view menu.
3. Every drink has a photo.
4. Guest can place an order.
5. Admin can see the order.
6. Admin can mark received/preparing/ready.
7. Guest sees status update through polling.
8. Admin can manage drinks, beans, categories, and settings.
9. Agent API routes are protected by AGENT_API_KEY.
10. Discord notification works when webhook is configured.
11. Nginx serves the frontend and proxies API.
12. No backend/db/redis public exposure.
13. GitHub workflow uses feature branches and PRs, not direct main pushes.
14. DŌM brand style is visible and consistent.
15. Friendly errors are shown to users.
```

---

# 35. Start Now

Begin with **Phase 0 — Foundation**.

Before coding:

```text
1. Read this prompt.
2. State your assumptions.
3. State the planned branch name.
4. State success criteria.
5. Create the branch.
6. Implement only Phase 0.
7. Run verification.
8. Commit and push.
9. Open a pull request.
10. Update ledger/STATUS.md.
```

Do not start Phase 1 until Phase 0 is reviewed and merged.
