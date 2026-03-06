const test = require("node:test");
const { after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.NODE_ENV = "test";

const { app } = require("../server");
const prisma = require("../config/prisma");
const { ORDER_STATUS } = require("../constants/order");
const {
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} = require("../constants/payment");

let cachedAdminToken = null;
const createdOrderIds = [];
const createdProductIds = [];
const createdVariantIds = [];

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

  while (createdVariantIds.length > 0) {
    const variantId = createdVariantIds.pop();
    await prisma.productVariant.deleteMany({ where: { id: variantId } });
  }

  while (createdProductIds.length > 0) {
    const productId = createdProductIds.pop();
    await prisma.product.deleteMany({ where: { id: productId } });
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

test("GET /api/dashboard/summary should calculate revenue metrics from SUCCESS payments only", async () => {
  const token = await getAdminToken();
  const seed = Date.now() + Math.floor(Math.random() * 10000);

  const successProduct = await prisma.product.create({
    data: {
      name: `dashboard-success-${seed}`,
      selling_price: 10000,
      is_active: true,
    },
  });
  const failedProduct = await prisma.product.create({
    data: {
      name: `dashboard-failed-${seed}`,
      selling_price: 10000,
      is_active: true,
    },
  });
  createdProductIds.push(successProduct.id, failedProduct.id);

  const successVariant = await prisma.productVariant.create({
    data: {
      product_id: successProduct.id,
      sku: `dashboard-success-sku-${seed}`,
      barcode: `dashboard-success-barcode-${seed}`,
      price: 10000,
      stock_quantity: 99999,
    },
  });
  const failedVariant = await prisma.productVariant.create({
    data: {
      product_id: failedProduct.id,
      sku: `dashboard-failed-sku-${seed}`,
      barcode: `dashboard-failed-barcode-${seed}`,
      price: 10000,
      stock_quantity: 99999,
    },
  });
  createdVariantIds.push(successVariant.id, failedVariant.id);

  const successOrder = await prisma.order.create({
    data: {
      total_amount: 100000,
      shipping_address: "dashboard-success-order",
      status: ORDER_STATUS.COMPLETED,
    },
  });
  const failedOrder = await prisma.order.create({
    data: {
      total_amount: 200000,
      shipping_address: "dashboard-failed-order",
      status: ORDER_STATUS.COMPLETED,
    },
  });
  createdOrderIds.push(successOrder.id, failedOrder.id);

  await prisma.orderItem.createMany({
    data: [
      {
        order_id: successOrder.id,
        variant_id: successVariant.id,
        quantity: 7777,
        price_at_purchase: 10,
      },
      {
        order_id: failedOrder.id,
        variant_id: failedVariant.id,
        quantity: 8888,
        price_at_purchase: 10,
      },
    ],
  });

  await prisma.payment.create({
    data: {
      order_id: successOrder.id,
      amount: 100000,
      method: PAYMENT_METHOD.COD,
      status: PAYMENT_STATUS.SUCCESS,
      transaction_id: `dashboard-success-tx-${seed}`,
    },
  });
  await prisma.payment.create({
    data: {
      order_id: failedOrder.id,
      amount: 200000,
      method: PAYMENT_METHOD.COD,
      status: PAYMENT_STATUS.FAILED,
      transaction_id: `dashboard-failed-tx-${seed}`,
    },
  });

  const payments = await prisma.payment.findMany({
    where: { status: PAYMENT_STATUS.SUCCESS },
    select: { amount: true, order_id: true },
  });
  const expectedRevenue = payments.reduce((sum, item) => sum + item.amount, 0);
  const expectedAov = payments.length > 0 ? Math.round(expectedRevenue / payments.length) : 0;

  const paidOrderIds = payments.map((item) => item.order_id);
  const paidItems = await prisma.orderItem.findMany({
    where: { order_id: { in: paidOrderIds } },
    select: {
      quantity: true,
      price_at_purchase: true,
      variant: {
        select: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const expectedProductMap = new Map();
  for (const item of paidItems) {
    const product = item.variant?.product;
    if (!product) continue;

    const current = expectedProductMap.get(product.id) || {
      product_id: product.id,
      product_name: product.name,
      total_quantity: 0,
      total_revenue: 0,
    };

    current.total_quantity += item.quantity;
    current.total_revenue += item.quantity * item.price_at_purchase;
    expectedProductMap.set(product.id, current);
  }

  const expectedTopProducts = Array.from(expectedProductMap.values())
    .sort((a, b) => b.total_quantity - a.total_quantity)
    .slice(0, 5);

  const res = await request(app)
    .get("/api/dashboard/summary")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);

  const summary = res.body?.data?.summary;
  assert.equal(summary.total_revenue, expectedRevenue);
  assert.equal(summary.average_order_value, expectedAov);
  assert.deepEqual(summary.top_products, expectedTopProducts);

  const hasFailedProduct = summary.top_products.some(
    (item) => item.product_id === failedProduct.id,
  );
  assert.equal(hasFailedProduct, false);
});

test("PUT /api/orders/:id/payment should create then update payment", async () => {
  const token = await getAdminToken();
  const order = await createOrderFixture();

  const createRes = await request(app)
    .put(`/api/orders/${order.id}/payment`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      amount: 150000,
      method: PAYMENT_METHOD.BANK_TRANSFER,
      status: PAYMENT_STATUS.SUCCESS,
      transaction_id: "tx-fixture-001",
    });

  assert.equal(createRes.status, 200);
  assert.equal(createRes.body.success, true);
  assert.equal(createRes.body?.data?.payment?.order_id, order.id);
  assert.equal(createRes.body?.data?.payment?.status, PAYMENT_STATUS.SUCCESS);

  const updateRes = await request(app)
    .put(`/api/orders/${order.id}/payment`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      status: PAYMENT_STATUS.REFUNDED,
      transaction_id: "tx-fixture-002",
    });

  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body.success, true);
  assert.equal(updateRes.body?.data?.payment?.status, PAYMENT_STATUS.REFUNDED);
  assert.equal(updateRes.body?.data?.payment?.transaction_id, "tx-fixture-002");
});

test("PUT /api/orders/:id/payment should return 422 if creating payment without required fields", async () => {
  const token = await getAdminToken();
  const order = await createOrderFixture();

  const res = await request(app)
    .put(`/api/orders/${order.id}/payment`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      status: PAYMENT_STATUS.SUCCESS,
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
      method: PAYMENT_METHOD.COD,
      status: PAYMENT_STATUS.PENDING,
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
      method: PAYMENT_METHOD.COD,
      status: PAYMENT_STATUS.PENDING,
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
      method: PAYMENT_METHOD.COD,
      status: PAYMENT_STATUS.SUCCESS,
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
