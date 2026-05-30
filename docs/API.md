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

## Friendly error shape

Public guest errors use this shape:

```json
{
  "error": true,
  "code": "INVALID_INPUT",
  "message": "Please check your order details and try again."
}
```
