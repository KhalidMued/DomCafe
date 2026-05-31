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
  "order_id": "1",
  "order_number": 1,
  "status": "new",
  "message": "Your order was sent to the bar."
}
```

### Get guest order status

```http
GET /api/orders/{order_id}
```

Returns guest-safe order details, item snapshots, and a friendly status label.

## Admin routes

All admin routes require:

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
  "photo_url": "/uploads/drinks/spanish_latte-generated-name.jpg"
}
```

The uploaded file is stored under `/uploads/drinks/`, the drink photo URL is updated, and the public menu uses the new photo URL.

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

## Friendly error shape

Public guest errors use this shape:

```json
{
  "error": true,
  "code": "INVALID_INPUT",
  "message": "Please check your order details and try again."
}
```
