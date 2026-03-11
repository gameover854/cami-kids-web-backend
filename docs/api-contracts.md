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
- `filters`: object-like query (`filters[category_id]`, `filters[is_active]`, `filters[brand_id]`, etc.)

Filter format (multi):
- `category_id`, `is_active`, `brand_id` support comma-separated values. Example:
  - `filters[category_id]=1,3`
  - `filters[brand_id]=2,5`
Behavior:
- `filters[category_id]` will match products in the selected categories and all their descendants.

### GET `/products/:id`
Success `200`:
- `data.product` includes:
  - `variants` with `attributes` (each attribute includes `value`)
  - `attributes` with `values`
  - `images`, `category`, `brand`, `collections`

### POST `/products`
Supports two shapes:
- flat product payload, or
- nested payload with `product`, `attributes`, `variants`, `images`.

Validation minimums:
- create: `product.name` required, `product.selling_price` non-negative integer, `product.is_active` boolean
- update: checks only provided fields
- `attributes`, `variants`, `images` must be arrays when provided

Behavior:
- When `attributes` and `variants` are provided, backend creates variant-attribute combinations in order of `attributes`.
- `sku` rule:
  - if `variant.sku` has value, keep it
  - else auto-generate from `productId` + `variant.combo`

### PUT `/products/:id`
Request body:
- use the same nested shape as `POST /products`

Behavior (replace semantics):
- `attributes`, `variants`, `images`, `collections` are **replaced fully** when provided.
- Removing any attribute/variant/image in edit will hard-delete it after save.

### PUT `/products/:productId/variants/:variantId`
Request body (partial update):
```json
{
  "sku": "SKU-001",
  "barcode": "BAR-001",
  "price": 199000,
  "stock_quantity": 12
}
```
Validation:
- `sku`, `barcode`: optional strings
- `price`, `stock_quantity`: optional non-negative integers

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
- `method`: optional, non-empty string, one of `COD | BANK_TRANSFER | MOMO | VNPAY | CREDIT_CARD`
- `status`: optional, non-empty string, one of `PENDING | SUCCESS | FAILED | REFUNDED`
- `transaction_id`: optional, string or `null`
- at least one field must be provided
- business rule:
  - when creating payment: require `amount`, `method`, `status`
  - `amount` must not exceed `order.total_amount`

## Dashboard

### GET `/dashboard/summary`
Success `200`:
```json
{
  "success": true,
  "message": "Get dashboard summary successfully",
  "data": {
    "summary": {
      "total_revenue": 1000000,
      "total_orders": 50,
      "pending_orders": 8,
      "completed_orders": 20,
      "new_customers": 12,
      "average_order_value": 250000,
      "low_stock_variants": 15,
      "top_products": [
        {
          "product_id": 1,
          "product_name": "Ao thun be trai basic",
          "total_quantity": 120,
          "total_revenue": 24000000
        }
      ]
    }
  }
}
```

Metric definitions:
- `total_revenue`: sum `payment.amount` with `payment.status = SUCCESS`
- `average_order_value`: average `payment.amount` with `payment.status = SUCCESS` (rounded)
- `top_products`: aggregate from `order_items` belonging to orders with `payment.status = SUCCESS`
- `pending_orders`: count orders where `order.status = PENDING`
- `completed_orders`: count orders where `order.status = COMPLETED`
- `low_stock_variants`: count product variants where `stock_quantity <= 5`
