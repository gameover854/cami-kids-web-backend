const test = require("node:test");
const { after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.NODE_ENV = "test";

const { app } = require("../server");
const prisma = require("../config/prisma");
const { ORDER_STATUS } = require("../constants/order");
const { PAYMENT_METHODS, PAYMENT_STATUSES } = require("../constants/payment");

let cachedAdminToken = null;
const createdOrderIds = [];

async function getAdminToken() {
  if (cachedAdminToken) return cachedAdminToken;

  const loginRes = await request(app).post("/api/auth/login").send({
    email: "admin@cami.local",
    password: "admin123",
  });

  assert.equal(loginRes.status, 200);
  const token = loginRes.body?.data?.token;
  assert.ok(token);
  cachedAdminToken = token;
  return token;
}

async function createOrderFixture() {
  const order = await prisma.order.create({
    data: {
      total_amount: 150000,
      shipping_address: "fixture-shipping-address",
      status: ORDER_STATUS.PENDING,
    },
  });
  createdOrderIds.push(order.id);
  return order;
}

async function cleanupFixtures() {
  while (createdOrderIds.length > 0) {
    const orderId = createdOrderIds.pop();
    await prisma.payment.deleteMany({ where: { order_id: orderId } });
    await prisma.orderItem.deleteMany({ where: { order_id: orderId } });
    await prisma.order.deleteMany({ where: { id: orderId } });
  }
}

test("GET /api/dashboard/summary should return aggregated dashboard metrics", async () => {
  const token = await getAdminToken();
  const res = await request(app)
    .get("/api/dashboard/summary")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(typeof res.body?.data?.summary?.total_revenue, "number");
  assert.equal(typeof res.body?.data?.summary?.total_orders, "number");
  assert.equal(Array.isArray(res.body?.data?.summary?.top_products), true);
});

test("PUT /api/orders/:id/payment should create then update payment", async () => {
  const token = await getAdminToken();
  const order = await createOrderFixture();

  const createRes = await request(app)
    .put(`/api/orders/${order.id}/payment`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      amount: 150000,
      method: PAYMENT_METHODS[1],
      status: PAYMENT_STATUSES[1],
      transaction_id: "tx-fixture-001",
    });

  assert.equal(createRes.status, 200);
  assert.equal(createRes.body.success, true);
  assert.equal(createRes.body?.data?.payment?.order_id, order.id);
  assert.equal(createRes.body?.data?.payment?.status, PAYMENT_STATUSES[1]);

  const updateRes = await request(app)
    .put(`/api/orders/${order.id}/payment`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      status: "REFUNDED",
      transaction_id: "tx-fixture-002",
    });

  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body.success, true);
  assert.equal(updateRes.body?.data?.payment?.status, PAYMENT_STATUSES[3]);
  assert.equal(updateRes.body?.data?.payment?.transaction_id, "tx-fixture-002");
});

test("PUT /api/orders/:id/payment should return 422 if creating payment without required fields", async () => {
  const token = await getAdminToken();
  const order = await createOrderFixture();

  const res = await request(app)
    .put(`/api/orders/${order.id}/payment`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      status: PAYMENT_STATUSES[1],
    });

  assert.equal(res.status, 422);
  assert.equal(res.body.success, false);
  assert.match(String(res.body.message), /required for new payment/i);
});

test("PUT /api/orders/:id/payment should return 404 for non-existing order", async () => {
  const token = await getAdminToken();
  const res = await request(app)
    .put("/api/orders/99999999/payment")
    .set("Authorization", `Bearer ${token}`)
    .send({
      amount: 1000,
      method: PAYMENT_METHODS[0],
      status: PAYMENT_STATUSES[0],
    });

  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
  assert.match(String(res.body.message), /order not found/i);
});

test("PUT /api/orders/:id/payment should return 422 if amount exceeds order total", async () => {
  const token = await getAdminToken();
  const order = await createOrderFixture();

  const res = await request(app)
    .put(`/api/orders/${order.id}/payment`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      amount: 200000,
      method: PAYMENT_METHODS[0],
      status: PAYMENT_STATUSES[0],
    });

  assert.equal(res.status, 422);
  assert.equal(res.body.success, false);
  assert.match(String(res.body.message), /cannot exceed order total amount/i);
});

test("PUT /api/orders/:id/payment should return 422 for blank method/status", async () => {
  const token = await getAdminToken();
  const order = await createOrderFixture();

  const createRes = await request(app)
    .put(`/api/orders/${order.id}/payment`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      amount: 150000,
      method: PAYMENT_METHODS[0],
      status: PAYMENT_STATUSES[1],
    });
  assert.equal(createRes.status, 200);

  const updateRes = await request(app)
    .put(`/api/orders/${order.id}/payment`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      method: "   ",
    });

  assert.equal(updateRes.status, 422);
  assert.equal(updateRes.body.success, false);
  assert.match(String(updateRes.body.message), /validation failed/i);
});

test("PUT /api/orders/:id/payment should return 422 for invalid payment enum values", async () => {
  const token = await getAdminToken();
  const order = await createOrderFixture();

  const res = await request(app)
    .put(`/api/orders/${order.id}/payment`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      amount: 150000,
      method: "BITCOIN",
      status: ORDER_STATUS.PAID,
    });

  assert.equal(res.status, 422);
  assert.equal(res.body.success, false);
  assert.match(String(res.body.message), /validation failed/i);
});

after(async () => {
  await cleanupFixtures();
  await prisma.$disconnect();
});
