# Order State Machine

## Muc tieu
- Chuan hoa rule chuyen trang thai don hang.
- Dam bao ton kho nhat quan theo transition nghiep vu.

## Trang thai
- `PENDING`
- `PAID`
- `SHIPPED`
- `COMPLETED`
- `CANCELLED`

## Transition hop le
- `PENDING -> PAID | CANCELLED`
- `PAID -> SHIPPED | CANCELLED`
- `SHIPPED -> COMPLETED | CANCELLED`
- `COMPLETED -> CANCELLED`
- `CANCELLED` la trang thai ket thuc.

Transition khong hop le:
- API tra `409` voi message: `Invalid order status transition`.

## Rule ton kho
- Khi transition sang `COMPLETED`:
  - Tru ton kho theo tung `order_items.quantity`.
  - Neu khong du ton kho thi rollback transaction va tra `409`:
    - `Insufficient stock for order completion`.
- Khi transition tu `COMPLETED` sang `CANCELLED`:
  - Hoan ton kho theo tung `order_items.quantity`.

## Rule payment
- Endpoint: `PUT /api/orders/:id/payment`.
- Neu payment chua ton tai:
  - Bat buoc day du `amount`, `method`, `status`.
  - Thieu field bat buoc: tra `422`.
- Neu payment da ton tai:
  - Cho phep patch theo tung field.
