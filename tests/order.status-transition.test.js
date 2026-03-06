const test = require("node:test");
const { after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.NODE_ENV = "test";

const { app } = require("../server");
const prisma = require("../config/prisma");
const { ORDER_STATUS } = require("../constants/order");

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
  orderStatus = ORDER_STATUS.PENDING,
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

  await prisma.orderItem.create({
    data: {
      order_id: order.id,
      variant_id: variant.id,
      quantity,
      price_at_purchase: 100000,
    },
  });

  createdFixtures.push({
    orderId: order.id,
    variantIds: [variant.id],
    productIds: [product.id],
  });

  return { order, variant };
}

async function createMultiItemOrderFixture({
  stockA = 5,
  qtyA = 2,
  stockB = 1,
  qtyB = 2,
  orderStatus = ORDER_STATUS.SHIPPED,
} = {}) {
  const seed = Date.now() + Math.floor(Math.random() * 10000);

  const productA = await prisma.product.create({
    data: {
      name: `multi-a-${seed}`,
      selling_price: 120000,
      is_active: true,
    },
  });
  const productB = await prisma.product.create({
    data: {
      name: `multi-b-${seed}`,
      selling_price: 90000,
      is_active: true,
    },
  });

  const variantA = await prisma.productVariant.create({
    data: {
      product_id: productA.id,
      sku: `multi-a-sku-${seed}`,
      barcode: `multi-a-barcode-${seed}`,
      price: 120000,
      stock_quantity: stockA,
    },
  });
  const variantB = await prisma.productVariant.create({
    data: {
      product_id: productB.id,
      sku: `multi-b-sku-${seed}`,
      barcode: `multi-b-barcode-${seed}`,
      price: 90000,
      stock_quantity: stockB,
    },
  });

  const order = await prisma.order.create({
    data: {
      total_amount: qtyA * 120000 + qtyB * 90000,
      shipping_address: "multi-item-order-address",
      status: orderStatus,
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        order_id: order.id,
        variant_id: variantA.id,
        quantity: qtyA,
        price_at_purchase: 120000,
      },
      {
        order_id: order.id,
        variant_id: variantB.id,
        quantity: qtyB,
        price_at_purchase: 90000,
      },
    ],
  });

  createdFixtures.push({
    orderId: order.id,
    variantIds: [variantA.id, variantB.id],
    productIds: [productA.id, productB.id],
  });

  return { order, variantA, variantB };
}

async function cleanupFixtures() {
  while (createdFixtures.length > 0) {
    const fixture = createdFixtures.pop();
    try {
      await prisma.orderItem.deleteMany({ where: { order_id: fixture.orderId } });
      await prisma.payment.deleteMany({ where: { order_id: fixture.orderId } });
      await prisma.order.deleteMany({ where: { id: fixture.orderId } });
      await prisma.productVariant.deleteMany({ where: { id: { in: fixture.variantIds } } });
      await prisma.product.deleteMany({ where: { id: { in: fixture.productIds } } });
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
    orderStatus: ORDER_STATUS.PENDING,
  });

  const transitions = [
    ORDER_STATUS.PAID,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.CANCELLED,
  ];
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
    orderStatus: ORDER_STATUS.PENDING,
  });

  const res = await request(app)
    .put(`/api/orders/${order.id}/status`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: ORDER_STATUS.SHIPPED });

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

  assert.equal(orderAfter.status, ORDER_STATUS.PENDING);
  assert.equal(variantAfter.stock_quantity, 8);
});

test("PUT /api/orders/:id/status should rollback all stock updates if one item is insufficient", async () => {
  const token = await getAdminToken();
  const { order, variantA, variantB } = await createMultiItemOrderFixture({
    stockA: 5,
    qtyA: 2,
    stockB: 1,
    qtyB: 2,
    orderStatus: ORDER_STATUS.SHIPPED,
  });

  const res = await request(app)
    .put(`/api/orders/${order.id}/status`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: ORDER_STATUS.COMPLETED });

  assert.equal(res.status, 409);
  assert.equal(res.body.success, false);
  assert.match(String(res.body.message), /Insufficient stock for order completion/i);

  const orderAfter = await prisma.order.findUnique({
    where: { id: order.id },
    select: { status: true },
  });
  const variantsAfter = await prisma.productVariant.findMany({
    where: { id: { in: [variantA.id, variantB.id] } },
    select: { id: true, stock_quantity: true },
  });

  assert.equal(orderAfter.status, ORDER_STATUS.SHIPPED);
  const stockById = new Map(variantsAfter.map((v) => [v.id, v.stock_quantity]));
  assert.equal(stockById.get(variantA.id), 5);
  assert.equal(stockById.get(variantB.id), 1);
});

after(async () => {
  await cleanupFixtures();
  await prisma.$disconnect();
});
