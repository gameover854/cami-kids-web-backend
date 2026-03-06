const test = require("node:test");
const { after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.NODE_ENV = "test";

const { app } = require("../server");
const prisma = require("../config/prisma");

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

async function createOrderFixture({
  stock = 10,
  quantity = 2,
  orderStatus = "PENDING",
} = {}) {
  const seed = Date.now() + Math.floor(Math.random() * 10000);
  const product = await prisma.product.create({
    data: {
      name: `test-product-${seed}`,
      selling_price: 100000,
      is_active: true,
    },
  });

  const variant = await prisma.productVariant.create({
    data: {
      product_id: product.id,
      sku: `test-sku-${seed}`,
      barcode: `test-barcode-${seed}`,
      price: 100000,
      stock_quantity: stock,
    },
  });

  const order = await prisma.order.create({
    data: {
      total_amount: 100000 * quantity,
      shipping_address: "test-shipping-address",
      status: orderStatus,
    },
  });

  const item = await prisma.orderItem.create({
    data: {
      order_id: order.id,
      variant_id: variant.id,
      quantity,
      price_at_purchase: 100000,
    },
  });

  createdFixtures.push({
    orderId: order.id,
    itemId: item.id,
    variantId: variant.id,
    productId: product.id,
  });

  return { order, variant };
}

async function cleanupFixtures() {
  while (createdFixtures.length > 0) {
    const fixture = createdFixtures.pop();
    try {
      await prisma.orderItem.deleteMany({ where: { order_id: fixture.orderId } });
      await prisma.payment.deleteMany({ where: { order_id: fixture.orderId } });
      await prisma.order.deleteMany({ where: { id: fixture.orderId } });
      await prisma.productVariant.deleteMany({ where: { id: fixture.variantId } });
      await prisma.product.deleteMany({ where: { id: fixture.productId } });
    } catch {
      // no-op cleanup best-effort for isolated test fixtures
    }
  }
}

test("PUT /api/orders/:id/status should enforce valid transitions and adjust stock", async () => {
  const token = await getAdminToken();
  const { order, variant } = await createOrderFixture({
    stock: 10,
    quantity: 2,
    orderStatus: "PENDING",
  });

  const transitions = ["PAID", "SHIPPED", "COMPLETED", "CANCELLED"];
  for (const status of transitions) {
    const res = await request(app)
      .put(`/api/orders/${order.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body?.data?.order?.status, status);
  }

  const updatedVariant = await prisma.productVariant.findUnique({
    where: { id: variant.id },
    select: { stock_quantity: true },
  });
  assert.equal(updatedVariant.stock_quantity, 10);
});

test("PUT /api/orders/:id/status should reject invalid transition", async () => {
  const token = await getAdminToken();
  const { order, variant } = await createOrderFixture({
    stock: 8,
    quantity: 3,
    orderStatus: "PENDING",
  });

  const res = await request(app)
    .put(`/api/orders/${order.id}/status`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: "SHIPPED" });

  assert.equal(res.status, 409);
  assert.equal(res.body.success, false);
  assert.match(String(res.body.message), /Invalid order status transition/i);

  const orderAfter = await prisma.order.findUnique({
    where: { id: order.id },
    select: { status: true },
  });
  const variantAfter = await prisma.productVariant.findUnique({
    where: { id: variant.id },
    select: { stock_quantity: true },
  });

  assert.equal(orderAfter.status, "PENDING");
  assert.equal(variantAfter.stock_quantity, 8);
});

after(async () => {
  await cleanupFixtures();
  await prisma.$disconnect();
});
