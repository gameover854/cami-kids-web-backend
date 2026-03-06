# Phase 3 Demo And Handover

## Scope
- Muc tieu: dong Phase 3 voi user journey co the demo on dinh, khong can patch DB thu cong.
- Pham vi: order status flow, payment flow, stock consistency, dashboard metrics.

## Demo User Journey
1. Dang nhap tai khoan admin.
2. Mo trang Order admin, chon 1 don o trang thai `PENDING`.
3. Cap nhat payment cho don:
   - `method`: `BANK_TRANSFER` (hoac gia tri hop le khac).
   - `status`: `SUCCESS`.
   - `amount`: khong vuot `order.total_amount`.
4. Chuyen trang thai don theo luong hop le:
   - `PENDING -> PAID -> SHIPPED -> COMPLETED`.
5. Xac nhan ton kho:
   - Truoc `COMPLETED`: ton kho khong doi.
   - Khi `-> COMPLETED`: ton kho giam theo `order_items.quantity`.
6. Chuyen `COMPLETED -> CANCELLED` va xac nhan:
   - Ton kho duoc hoan lai.
   - `CANCELLED` la terminal state (transition tiep theo bi tu choi `409`).
7. Mo trang Dashboard admin va xac nhan:
   - `total_revenue`, `average_order_value`, `top_products` tinh theo payment `SUCCESS`.
   - `pending_orders`, `completed_orders`, `low_stock_variants` khop du lieu he thong.

## Handover Checklist
- [ ] Order status state machine da enforce o backend (`409` cho transition sai).
- [ ] Rule ton kho da enforce transaction-safe:
  - [ ] Tru ton khi `-> COMPLETED`.
  - [ ] Hoan ton khi `COMPLETED -> CANCELLED`.
- [ ] Rule payment da enforce:
  - [ ] Enum method/status hop le.
  - [ ] Create payment bat buoc `amount/method/status`.
  - [ ] `amount <= order.total_amount`.
- [ ] Dashboard metrics da chot va document:
  - [ ] `total_revenue`, `average_order_value`, `top_products` theo payment `SUCCESS`.
  - [ ] `pending_orders`, `completed_orders`, `low_stock_variants` theo dinh nghia API.
- [ ] Test coverage batch Phase 3 da pass:
  - [ ] API tests order/payment/dashboard.
  - [ ] E2E business journey test (`order.e2e-journey.test.js`).

## Verify Commands
- `cd backend && npm test`
- `cd frontend && npm run lint`
- `cd frontend && npm run build`
