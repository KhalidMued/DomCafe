# API

Base URL in local development:

```text
http://localhost:11080/api
```

## Health

```http
GET /api/health
```

Returns backend, database, and Redis health.

## Public guest routes

### Public settings

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

### Public menu

```http
GET /api/menu
```

Returns active categories and available drinks. Each drink includes its default bean, photo URL, temperature options, milk options, and estimated time.

### Create guest order

```http
POST /api/orders
Content-Type: application/json
```

Rate limit: 10 attempts per client IP/source address per minute. Extra attempts return `429`.

Request:

```json
{
  "guest_name": "Ahmed",
  "guest_note": "We are sitting outside.",
  "items": [
    {
      "drink_id": "spanish_latte",
      "quantity": 2,
      "temperature": "iced",
      "milk_option": "whole milk",
      "item_note": "Less sweet please."
    }
  ]
}
```

Response:

```json
{
  "order_id": "k3TqX9-w2ZbYpLmA",
  "order_number": 1,
  "status": "new",
  "message": "Your order was sent to the bar."
}
```

`order_id` is a random, unguessable public code; keep it to check the order status. `order_number` is the human-friendly sequential number shown to staff.

Leading and trailing whitespace in `guest_name` is stripped before validation; whitespace-only names are rejected.

### Get guest order status

```http
GET /api/orders/{order_code}
```

`order_code` is the `order_id` public code returned by order creation; sequential integer ids are not accepted. Returns guest-safe order details, item snapshots, and a friendly status label. The `id` field in the response is the same public code.

## Admin routes

### Admin login

```http
POST /api/admin/login
Content-Type: application/json
```

Rate limit: 5 attempts per client IP/source address per minute. Extra attempts return `429`.

A successful login responds `{"ok": true}` and sets two cookies instead of returning the JWT in the body:

- `dom_admin_jwt` — the admin JWT, `HttpOnly`, `SameSite=Strict`, scoped to `/api`, so page scripts can never read it. Set `ADMIN_COOKIE_SECURE=true` to add the `Secure` attribute when admin access is HTTPS-only.
- `dom_admin_session` — a non-secret `1`, readable by the SPA, used only to decide whether to render admin pages or the login screen.

### Admin logout

```http
POST /api/admin/logout
```

Clears both session cookies and responds `{"ok": true}`. No authentication required.

All protected admin routes accept the `dom_admin_jwt` cookie (sent automatically by the browser) or, equivalently, an explicit header:

```http
Authorization: Bearer ADMIN_TOKEN
```

### Upload and replace drink photo

```http
POST /api/admin/uploads/drink-photo
Content-Type: multipart/form-data
```

Form fields:

```text
drink_id=<drink-id>
photo=<JPEG, PNG, or WebP file up to 5 MB>
```

Response:

```json
{
  "id": "spanish_latte",
  "photo_url": "/uploads/drinks/spanish_latte-generated-name.webp"
}
```

Uploads are re-encoded server-side to WebP (max 1600px on the longest side, EXIF stripped), stored under `/uploads/drinks/`, and the drink photo URL is updated so the public menu uses the new photo. Admin-panel uploads are runtime data: back them up with the server upload directory and keep them ignored by Git unless a specific image is intentionally promoted as a curated menu asset.

When an upload replaces a previous **server-generated** photo of the same drink (a `/uploads/drinks/<drink_id>-<32-hex>.webp` file), the replaced file is deleted from disk after the new photo is committed, as long as no other drink still references it. Curated assets never match that pattern (`placeholder.jpg`, the tracked `.png` photos, or any hand-named file), so they are never deleted. Cleanup is best-effort: a file that cannot be deleted is logged and the upload still succeeds.

### Create drink

```http
POST /api/admin/drinks
Content-Type: application/json
```

Request:

```json
{
  "id": "slow-doum-brew",
  "name": "Slow DŌM Brew",
  "category_id": "slow-bar",
  "default_bean_id": "ethiopia-guji",
  "description": "A slow filter with a soft Doum finish.",
  "ingredients": ["filter coffee", "doum"],
  "photo_url": "/uploads/drinks/slow-doum-brew.jpg",
  "temperature_options": ["hot"],
  "milk_options": ["none"],
  "estimated_time_minutes": 7
}
```

Response matches the admin drink shape. `photo_url`, `name`, `category_id`, and `description` are required. Category and default bean IDs must already exist. Duplicate IDs return `409`.

### Archive drink

```http
DELETE /api/admin/drinks/{drink_id}
```

Archives by marking the drink unavailable; it does not hard-delete records or old order snapshots.

### Edit drink details

```http
PATCH /api/admin/drinks/{drink_id}
Content-Type: application/json
```

Request:

```json
{
  "name": "Iced DŌM Latte",
  "category_id": "cold-bar",
  "default_bean_id": "dom-house-beans",
  "description": "Cold milk, espresso, and a quiet Doum finish.",
  "ingredients": ["espresso", "milk", "doum"],
  "temperature_options": ["iced"],
  "milk_options": ["whole milk", "oat milk"],
  "estimated_time_minutes": 6
}
```

Response:

```json
{
  "id": "iced-doum-latte",
  "name": "Iced DŌM Latte",
  "category_id": "cold-bar",
  "category_name": "Cold Bar",
  "bean_id": "dom-house-beans",
  "bean_name": "DŌM House Beans",
  "description": "Cold milk, espresso, and a quiet Doum finish.",
  "ingredients": ["espresso", "milk", "doum"],
  "photo_url": "/uploads/drinks/placeholder.jpg",
  "is_available": true,
  "temperature_options": ["iced"],
  "milk_options": ["whole milk", "oat milk"],
  "estimated_time_minutes": 6
}
```

Fields are partial at the API layer, but the admin menu form submits all editable catalog/copy/options together. Estimated time must be between 1 and 30 minutes. Category and default bean IDs must already exist.

### Create category

```http
POST /api/admin/categories
Content-Type: application/json
```

Request:

```json
{
  "id": "slow-bar",
  "label": "Slow Bar",
  "description": "Manual brews and quiet cups.",
  "accent_color": "#8B5E34",
  "display_order": 9
}
```

Response matches the admin category shape. Duplicate IDs return `409`.

### Archive category

```http
DELETE /api/admin/categories/{category_id}
```

Archives by marking the category unavailable; it does not hard-delete the category or its drinks.

### Edit category details

```http
PATCH /api/admin/categories/{category_id}
Content-Type: application/json
```

Request:

```json
{
  "label": "Cold Bar",
  "description": "Cold coffee for long afternoons.",
  "accent_color": "#5DCAA5",
  "display_order": 3
}
```

Response:

```json
{
  "id": "cold-bar",
  "label": "Cold Bar",
  "description": "Cold coffee for long afternoons.",
  "accent_color": "#5DCAA5",
  "display_order": 3,
  "is_available": true
}
```

Category availability can also be toggled from the admin menu with `PATCH /api/admin/menu/categories/{category_id}` and `{ "is_available": false }`.

### Create bean

```http
POST /api/admin/beans
Content-Type: application/json
```

Request:

```json
{
  "id": "ethiopia-guji",
  "name": "Ethiopia Guji",
  "origin": "Ethiopia",
  "process": "Natural",
  "tasting_notes": ["berry", "jasmine"]
}
```

Response matches the admin bean shape. Duplicate IDs return `409`.

### Archive bean

```http
DELETE /api/admin/beans/{bean_id}
```

Archives by marking the bean unavailable; it does not hard-delete beans that existing drinks or order snapshots may reference.

### Edit bean details

```http
PATCH /api/admin/beans/{bean_id}
Content-Type: application/json
```

Request:

```json
{
  "name": "DŌM House Beans",
  "origin": "Sudan / Brazil",
  "process": "Natural washed blend",
  "tasting_notes": ["date", "cocoa", "almond"]
}
```

Response:

```json
{
  "id": "dom-house-beans",
  "name": "DŌM House Beans",
  "origin": "Sudan / Brazil",
  "process": "Natural washed blend",
  "tasting_notes": ["date", "cocoa", "almond"],
  "is_available": true
}
```

### Read and update cafe settings

```http
GET /api/admin/settings
PATCH /api/admin/settings
Content-Type: application/json
```

Patch request:

```json
{
  "cafe_name": "DŌM Home Café",
  "welcome_message": "Welcome in. Take your time.",
  "orders_open": false
}
```

Response:

```json
{
  "cafe_name": "DŌM Home Café",
  "welcome_message": "Welcome in. Take your time.",
  "orders_open": false
}
```

Settings changes are reflected in the public settings endpoint. `orders_open` also controls whether new guest orders can be created.

## Agent routes

All agent routes require the dedicated `AGENT_API_KEY` bearer token, not an admin JWT:

```http
Authorization: Bearer ***
```

### Agent operational status

```http
GET /api/agent/status
```

Response:

```json
{
  "status": "ok",
  "orders_open": true,
  "pending_orders_count": 2
}
```

### Pending orders for Herms

```http
GET /api/agent/orders/pending
```

Returns up to 50 active orders in oldest-first order. Active statuses are `new`, `received`, and `preparing`.

Response:

```json
[
  {
    "id": "18",
    "order_number": 18,
    "guest_name": "Mona",
    "status": "new",
    "status_label": "Your order was sent to the bar.",
    "items_count": 2,
    "created_at": "2026-05-30T18:00:00Z"
  }
]
```

### Update order status from Herms

```http
PATCH /api/agent/orders/{order_id}/status
Content-Type: application/json
```

Request:

```json
{
  "status": "ready"
}
```

Allowed statuses are `new`, `received`, `preparing`, `ready`, and `cancelled`. Response matches the order status shape:

```json
{
  "id": "18",
  "order_number": 18,
  "status": "ready",
  "status_label": "Your drink is ready."
}
```

### Agent menu

```http
GET /api/agent/menu
```

Returns categories, drinks, and beans for Herms menu lookup. Unlike the public menu, this includes unavailable items so Herms can answer availability questions and re-enable items.

Drink records include `category_id`, `category_name`, `bean_id`, `bean_name`, copy/options, and `is_available`. Bean records include origin, process, tasting notes, and `is_available`.

### Search drinks from Herms

```http
GET /api/agent/drinks/search?q=spanish
```

Returns up to 25 drinks matching the drink name. `q` is required and must not be empty.

### Update drink availability from Herms

```http
PATCH /api/agent/drinks/{drink_id}/availability
Content-Type: application/json
```

Request:

```json
{
  "is_available": false
}
```

Response:

```json
{
  "id": "spanish_latte",
  "is_available": false
}
```

### List and search beans from Herms

```http
GET /api/agent/beans
GET /api/agent/beans/search?q=colombia
```

Bean search matches bean name and origin. `q` is required and must not be empty.

### Update bean availability from Herms

```http
PATCH /api/agent/beans/{bean_id}/availability
Content-Type: application/json
```

Request:

```json
{
  "is_available": true
}
```

Response:

```json
{
  "id": "colombia_house",
  "is_available": true
}
```

## Discord order notifications

When `DISCORD_WEBHOOK_URL` is configured and notifications are enabled, creating a new public order sends a Discord webhook message after the order is committed.

Notifications can be enabled either by environment (`DISCORD_NOTIFICATIONS_ENABLED=true`) or by the `discord_notifications_enabled` setting row. The database setting allows runtime control without redeploying.

Message shape:

```text
☕ New DŌM order

Order #12
Guest: Ahmed

Items:
- 2x Iced Spanish Latte
  Temperature: iced
  Milk: whole milk
  Note: Less sweet

Status: New
```

Webhook failures are logged and do not fail public order creation. Secrets and webhook URLs must not be printed in logs or responses.

## Friendly error shape

Public guest errors use this shape:

```json
{
  "error": true,
  "code": "INVALID_INPUT",
  "message": "Please check your order details and try again."
}
```
