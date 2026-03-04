# API Contracts

Base URL prefix: `/api`

Response envelope:
- Success:
```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```
- Error: see `docs/error-codes.md`.

## Auth (Public)

### POST `/auth/login`
Request body:
```json
{
  "email": "admin@cami.local",
  "password": "admin123"
}
```
Validation:
- `email`: required, string, valid email format
- `password`: required, string

Success `200`:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt...",
    "user": {
      "id": 1,
      "name": "Admin Cami",
      "email": "admin@cami.local",
      "role": "admin"
    }
  }
}
```

### POST `/auth/register`
Request body:
```json
{
  "email": "user@example.com",
  "password": "12345678",
  "name": "User Name",
  "phone": "0900000000"
}
```
Validation:
- `email`: required, string, valid email format
- `password`: required, string, min length 8
- `name`: optional, string
- `phone`: optional, string

Success `201`:
```json
{
  "success": true,
  "message": "Register successful",
  "data": {
    "user": {
      "id": 10,
      "name": "User Name",
      "email": "user@example.com",
      "role": "customer",
      "phone": "0900000000"
    }
  }
}
```

### GET `/auth/me`
Headers:
- `Authorization: Bearer <token>`

Success `200`: current user profile.

## Admin APIs (Require auth + role `admin`)

## Category

### POST `/categories`
Request body:
```json
{
  "name": "Ao thun be trai",
  "parent_id": 1,
  "brand_id": 2
}
```
Validation:
- `name`: required on create, string
- `parent_id`: optional, integer or `null`
- `brand_id`: optional, integer or `null`

### PUT `/categories/:id`
Same fields, all optional.

## Brand

### POST `/brands`
Request body:
```json
{
  "name": "Cami Kids",
  "slug": "cami-kids",
  "logo": "https://...",
  "description": "...",
  "is_active": true
}
```
Validation:
- `name`: required on create, string
- `slug`, `logo`, `description`: optional, string or `null`
- `is_active`: optional, boolean

### PUT `/brands/:id`
Same fields, all optional.

## Collection

### POST `/collections`
Request body:
```json
{
  "name": "He 2026",
  "slug": "he-2026",
  "is_active": true
}
```
Validation:
- `name`: required on create, string
- `slug`: required on create, string
- `is_active`: optional, boolean

### PUT `/collections/:id`
Same fields, all optional.

## Promotion (Collection mapping via `collection_ids`)

Important:
- Backend keeps many-to-many relation between `promotions` and `collections` through `collections_promotions`.
- Use `collection_ids` to assign a promotion to multiple collections.

### GET `/promotions`
Success `200`: each promotion includes relation list:
```json
{
  "success": true,
  "message": "Get promotions successfully",
  "data": {
    "promotions": [
      {
        "id": 1,
        "code": "SUMMER15",
        "name": "Giam 15% mua he",
        "type": "PERCENTAGE",
        "value": 15,
        "start_date": "2026-05-01T00:00:00.000Z",
        "end_date": "2026-08-31T23:59:59.000Z",
        "is_active": true,
        "collections": [
          {
            "collection_id": 1,
            "promotion_id": 1,
            "collection": {
              "id": 1,
              "name": "He 2026",
              "slug": "he-2026",
              "is_active": true
            }
          }
        ]
      }
    ]
  }
}
```

### POST `/promotions`
Request body:
```json
{
  "code": "SUMMER15",
  "name": "Giam 15% mua he",
  "type": "PERCENTAGE",
  "value": 15,
  "start_date": "2026-05-01T00:00:00.000Z",
  "end_date": "2026-08-31T23:59:59.000Z",
  "is_active": true,
  "collection_ids": [1, 2]
}
```
Validation:
- `code`: required on create, string
- `name`: required on create, string
- `type`: `PERCENTAGE` or `FIXED_AMOUNT`
- `value`: required on create, non-negative number
- `start_date`, `end_date`: optional valid datetime string
- `end_date >= start_date` when both provided
- `is_active`: optional boolean
- `collection_ids`: optional array of integers

Success `201`: promotion with `collections` relation included.

### PUT `/promotions/:id`
Request body (partial update):
```json
{
  "name": "Updated campaign",
  "is_active": false,
  "collection_ids": [3]
}
```
Behavior:
- If `collection_ids` is present, backend replaces existing mapping with the new list.
- If `collection_ids` is omitted, existing mapping remains unchanged.

Success `200`: updated promotion with `collections` relation included.

## Product

### GET `/products`
Query params:
- `page`: number (default `1`)
- `limit`: number (default `5`)
- `filters`: object-like query (`filters[category_id]`, `filters[is_active]`, etc.)

### POST `/products`
Supports two shapes:
- flat product payload, or
- nested payload with `product`, `attributes`, `variants`, `images`.

Validation minimums:
- create: `product.name` required, `product.selling_price` non-negative integer, `product.is_active` boolean
- update: checks only provided fields
- `attributes`, `variants`, `images` must be arrays when provided

## Upload

### POST `/upload/multiple`
Request body:
```json
{
  "files": ["data:image/png;base64,...", "data:image/jpeg;base64,..."]
}
```
Validation:
- `files` required, non-empty array
- each item must be string (base64)

Success `200`:
```json
{
  "success": true,
  "message": "Upload successful",
  "data": [
    {
      "url": "https://...",
      "public_id": "..."
    }
  ]
}
```

## Order

### GET `/orders`
Query params:
- `page`: number (default `1`)
- `limit`: number (default `10`)
- `filters`: object-like query (`filters[status]`, `filters[sort]`, etc.)

Success `200`:
- `data.orders`
- `data.totalOrder`
- `data.totalPage`

### PUT `/orders/:id/status`
Request body:
```json
{ "status": "PAID" }
```
Validation:
- `status` required, one of `PENDING | PAID | SHIPPED | COMPLETED | CANCELLED`

### PUT `/orders/:id/payment`
Request body (at least one field required):
```json
{
  "amount": 299000,
  "method": "COD",
  "status": "SUCCESS",
  "transaction_id": "TXN-0001"
}
```
Validation:
- `amount`: optional, non-negative integer
- `method`: optional, string
- `status`: optional, string
- `transaction_id`: optional, string or `null`
- at least one field must be provided
