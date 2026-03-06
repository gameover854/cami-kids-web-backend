const test = require("node:test");
const { after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.NODE_ENV = "test";

const { app } = require("../server");
const prisma = require("../config/prisma");

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
      status: "PENDING",
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
      method: "BANK_TRANSFER",
      status: "PAID",
      transaction_id: "tx-fixture-001",
    });

  assert.equal(createRes.status, 200);
  assert.equal(createRes.body.success, true);
  assert.equal(createRes.body?.data?.payment?.order_id, order.id);
  assert.equal(createRes.body?.data?.payment?.status, "PAID");

  const updateRes = await request(app)
    .put(`/api/orders/${order.id}/payment`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      status: "REFUNDED",
      transaction_id: "tx-fixture-002",
    });

  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body.success, true);
  assert.equal(updateRes.body?.data?.payment?.status, "REFUNDED");
  assert.equal(updateRes.body?.data?.payment?.transaction_id, "tx-fixture-002");
});

test("PUT /api/orders/:id/payment should return 422 if creating payment without required fields", async () => {
  const token = await getAdminToken();
  const order = await createOrderFixture();

  const res = await request(app)
    .put(`/api/orders/${order.id}/payment`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      status: "PAID",
    });

  assert.equal(res.status, 422);
  assert.equal(res.body.success, false);
  assert.match(String(res.body.message), /required for new payment/i);
});

after(async () => {
  await cleanupFixtures();
  await prisma.$disconnect();
});
