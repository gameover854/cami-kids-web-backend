# Error Codes

This document defines error response shape and error codes currently used by backend.

## Error Response Shape

All errors use this JSON structure:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["name is required and must be a string"],
  "requestId": "d6e31a7c-..."
}
```

Fields:
- `success`: always `false` for error responses.
- `message`: short high-level error summary.
- `errors`: optional list of detailed errors.
- `requestId`: optional request trace id from middleware.

## HTTP Error Codes

| HTTP | Message | Typical source |
|---|---|---|
| 400 | `Invalid brand id` / `Invalid category id` / `Invalid collection id` / `Invalid product id` / `Invalid promotion id` / `Invalid order id` | Invalid `:id` route param |
| 401 | `Unauthorized` | Missing/invalid Bearer token |
| 401 | `Invalid credentials` | Login failed |
| 403 | `Forbidden` | Missing role or role not allowed |
| 404 | `Brand not found` / `Category not found` / `Collection not found` / `Product not found` / `Promotion not found` / `Order not found` / `User not found` | Record not found |
| 409 | `Email already exists` | Register with duplicated email |
| 409 | `Duplicated value` | Unique constraint violation |
| 409 | `Foreign key constraint failed` | Foreign key violation |
| 422 | `Validation failed` | Payload validation failed |
| 422 | `Email and password are required` | Login payload missing required fields |
| 422 | `Required field is missing` | DB required field missing |
| 429 | `Too many requests...` (default express-rate-limit message) | Rate limit exceeded |
| 500 | `JWT_SECRET is missing` | Server misconfiguration |
| 500 | `Internal server error` | Unexpected server-side error |
| 500 | `Server Error` | Error handled by global error middleware |

## Prisma Error Code Mapping

`utils/apiResponse.handlePrismaError` maps Prisma errors as follows:

| Prisma code | HTTP | Message | errors[] detail |
|---|---:|---|---|
| `P2002` | 409 | `Duplicated value` | `[err.meta.target or "unique"]` |
| `P2003` | 409 | `Foreign key constraint failed` | `[err.meta.field_name or "foreign_key"]` |
| `P2011` | 422 | `Required field is missing` | `null` |
| `P2025` | 404 | `Record not found` | `null` |
| default | 500 | `err.message` or `Internal server error` | `null` |

## Validation Error Details (`422 Validation failed`)

Validation middleware returns `message = "Validation failed"` and puts specific reasons in `errors[]`.

Common examples:
- `name is required and must be a string`
- `type must be PERCENTAGE or FIXED_AMOUNT`
- `collection_ids must contain only integers`
- `status must be one of PENDING, PAID, SHIPPED, COMPLETED, CANCELLED`
