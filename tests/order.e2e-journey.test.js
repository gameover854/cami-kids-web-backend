const test = require("node:test");
const { after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.NODE_ENV = "test";

const { app } = require("../server");
const prisma = require("../config/prisma");
const { ORDER_STATUS } = require("../constants/order");
const { PAYMENT_METHOD, PAYMENT_STATUS } = require("../constants/payment");

let cachedAdminToken = null;
const createdFixtures = [];

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

async function createOrderJourneyFixture() {
  const seed = Date.now() + Math.floor(Math.random() * 10000);

  const product = await prisma.product.create({
    data: {
      name: `journey-product-${seed}`,
      selling_price: 100000,
      is_active: true,
    },
  });

  const variant = await prisma.productVariant.create({
    data: {
      product_id: product.id,
      sku: `journey-sku-${seed}`,
      barcode: `journey-barcode-${seed}`,
      price: 100000,
      stock_quantity: 10,
    },
  });

  const order = await prisma.order.create({
    data: {
      total_amount: 200000,
      shipping_address: "journey-shipping-address",
      status: ORDER_STATUS.PENDING,
    },
  });

  await prisma.orderItem.create({
    data: {
      order_id: order.id,
      variant_id: variant.id,
      quantity: 2,
      price_at_purchase: 100000,
    },
  });

  createdFixtures.push({
    orderId: order.id,
    variantId: variant.id,
    productId: product.id,
  });

  return { orderId: order.id, variantId: variant.id };
}

async function getVariantStock(variantId) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { stock_quantity: true },
  });
  return variant?.stock_quantity;
}

async function cleanupFixtures() {
  while (createdFixtures.length > 0) {
    const fixture = createdFixtures.pop();
    try {
      await prisma.payment.deleteMany({ where: { order_id: fixture.orderId } });
      await prisma.orderItem.deleteMany({ where: { order_id: fixture.orderId } });
      await prisma.order.deleteMany({ where: { id: fixture.orderId } });
      await prisma.productVariant.deleteMany({ where: { id: fixture.variantId } });
      await prisma.product.deleteMany({ where: { id: fixture.productId } });
    } catch {
      // no-op cleanup best-effort for isolated test fixtures
    }
  }
}

test("E2E order journey should keep payment/status/stock consistency", async () => {
  const token = await getAdminToken();
  const { orderId, variantId } = await createOrderJourneyFixture();

  // 1) Create successful payment for the order.
  const paymentRes = await request(app)
    .put(`/api/orders/${orderId}/payment`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      amount: 200000,
      method: PAYMENT_METHOD.BANK_TRANSFER,
      status: PAYMENT_STATUS.SUCCESS,
      transaction_id: "journey-tx-001",
    });
  assert.equal(paymentRes.status, 200);
  assert.equal(paymentRes.body.success, true);
  assert.equal(paymentRes.body?.data?.payment?.status, PAYMENT_STATUS.SUCCESS);

  // 2) Walk a valid order status path and assert stock consistency at each step.
  const paidRes = await request(app)
    .put(`/api/orders/${orderId}/status`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: ORDER_STATUS.PAID });
  assert.equal(paidRes.status, 200);
  assert.equal(await getVariantStock(variantId), 10);

  const shippedRes = await request(app)
    .put(`/api/orders/${orderId}/status`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: ORDER_STATUS.SHIPPED });
  assert.equal(shippedRes.status, 200);
  assert.equal(await getVariantStock(variantId), 10);

  const completedRes = await request(app)
    .put(`/api/orders/${orderId}/status`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: ORDER_STATUS.COMPLETED });
  assert.equal(completedRes.status, 200);
  assert.equal(await getVariantStock(variantId), 8);

  const cancelledRes = await request(app)
    .put(`/api/orders/${orderId}/status`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: ORDER_STATUS.CANCELLED });
  assert.equal(cancelledRes.status, 200);
  assert.equal(await getVariantStock(variantId), 10);

  // 3) Cancelled is terminal state: no further transition allowed.
  const invalidRes = await request(app)
    .put(`/api/orders/${orderId}/status`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: ORDER_STATUS.PAID });
  assert.equal(invalidRes.status, 409);
  assert.equal(invalidRes.body.success, false);
  assert.match(String(invalidRes.body.message), /Invalid order status transition/i);

  const detailRes = await request(app)
    .get(`/api/orders/${orderId}`)
    .set("Authorization", `Bearer ${token}`);
  assert.equal(detailRes.status, 200);
  assert.equal(detailRes.body?.data?.order?.status, ORDER_STATUS.CANCELLED);
  assert.equal(detailRes.body?.data?.order?.payment?.status, PAYMENT_STATUS.SUCCESS);
});

after(async () => {
  await cleanupFixtures();
  await prisma.$disconnect();
});

