const test = require("node:test");
const { after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.NODE_ENV = "test";

const { app } = require("../server");
const prisma = require("../config/prisma");

let cachedAdminToken = null;
const createdProductIds = [];

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

async function cleanupProducts() {
  while (createdProductIds.length > 0) {
    const productId = createdProductIds.pop();
    try {
      await prisma.collectionProduct.deleteMany({ where: { product_id: productId } });
      await prisma.variantAttribute.deleteMany({
        where: { variant: { product_id: productId } },
      });
      await prisma.image.deleteMany({ where: { variant: { product_id: productId } } });
      await prisma.productVariant.deleteMany({ where: { product_id: productId } });
      await prisma.productAttributeValue.deleteMany({
        where: { attribute: { product_id: productId } },
      });
      await prisma.productAttribute.deleteMany({ where: { product_id: productId } });
      await prisma.image.deleteMany({ where: { product_id: productId } });
      await prisma.product.deleteMany({ where: { id: productId } });
    } catch {
      // best-effort cleanup for isolated fixtures
    }
  }
}

test("PUT /api/products/:id should replace attributes/variants/images", async () => {
  const token = await getAdminToken();
  const seed = Date.now() + Math.floor(Math.random() * 10000);

  const createPayload = {
    product: {
      name: `replace-product-${seed}`,
      selling_price: 100000,
      compare_price: 120000,
      description: "seed product",
      category_id: null,
      brand_id: null,
      collection_id: [],
      is_active: true,
    },
    attributes: [{ id: `attr-${seed}`, name: "Size", values: ["S", "M"] }],
    variants: [
      {
        id: `v-s-${seed}`,
        price: 100000,
        stock_quantity: 10,
        combo: "S",
        sku: "",
        barcode: `barcode-s-${seed}`,
      },
      {
        id: `v-m-${seed}`,
        price: 100000,
        stock_quantity: 20,
        combo: "M",
        sku: `manual-sku-${seed}`,
        barcode: `barcode-m-${seed}`,
      },
    ],
    images: [
      {
        id: `img-a-${seed}`,
        url: "https://example.com/a.jpg",
        public_id: `public-a-${seed}`,
        is_main: true,
        order: 0,
      },
      {
        id: `img-b-${seed}`,
        url: "https://example.com/b.jpg",
        public_id: `public-b-${seed}`,
        is_main: false,
        order: 1,
      },
    ],
  };

  const createRes = await request(app)
    .post("/api/products")
    .set("Authorization", `Bearer ${token}`)
    .send(createPayload);

  assert.equal(createRes.status, 201);
  assert.equal(createRes.body.success, true);

  const productId = createRes.body?.data?.product?.id;
  assert.ok(productId);
  createdProductIds.push(productId);

  const variantsBefore = await prisma.productVariant.findMany({
    where: { product_id: productId },
    select: { id: true },
  });
  assert.equal(variantsBefore.length, 2);
  const oldVariantIds = variantsBefore.map((item) => item.id);

  const updatePayload = {
    product: {
      name: `replace-product-updated-${seed}`,
      selling_price: 110000,
      compare_price: 0,
      description: "updated",
      category_id: null,
      brand_id: null,
      collection_id: [],
      is_active: false,
    },
    attributes: [{ id: `attr-new-${seed}`, name: "Size", values: ["L"] }],
    variants: [
      {
        id: `v-l-${seed}`,
        price: 110000,
        stock_quantity: 5,
        combo: "L",
        sku: "",
        barcode: `barcode-l-${seed}`,
      },
    ],
    images: [
      {
        id: `img-c-${seed}`,
        url: "https://example.com/c.jpg",
        public_id: `public-c-${seed}`,
        is_main: true,
        order: 0,
      },
    ],
  };

  const updateRes = await request(app)
    .put(`/api/products/${productId}`)
    .set("Authorization", `Bearer ${token}`)
    .send(updatePayload);

  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body.success, true);
  assert.equal(updateRes.body?.data?.product?.name, updatePayload.product.name);

  const productAfter = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true, selling_price: true, is_active: true },
  });
  assert.equal(productAfter.name, updatePayload.product.name);
  assert.equal(productAfter.selling_price, updatePayload.product.selling_price);
  assert.equal(productAfter.is_active, updatePayload.product.is_active);

  const variantsAfter = await prisma.productVariant.findMany({
    where: { product_id: productId },
    select: { id: true, sku: true, price: true, stock_quantity: true },
  });
  assert.equal(variantsAfter.length, 1);
  assert.equal(variantsAfter[0].sku, `${productId}-L`);
  assert.equal(variantsAfter[0].price, updatePayload.variants[0].price);
  assert.equal(variantsAfter[0].stock_quantity, updatePayload.variants[0].stock_quantity);

  const oldVariantsStillExist = await prisma.productVariant.count({
    where: { id: { in: oldVariantIds } },
  });
  assert.equal(oldVariantsStillExist, 0);

  const attributeCount = await prisma.productAttribute.count({
    where: { product_id: productId },
  });
  const valueCount = await prisma.productAttributeValue.count({
    where: { attribute: { product_id: productId } },
  });
  assert.equal(attributeCount, 1);
  assert.equal(valueCount, 1);

  const variantAttributeCount = await prisma.variantAttribute.count({
    where: { variant_id: variantsAfter[0].id },
  });
  assert.equal(variantAttributeCount, 1);

  const imagesAfter = await prisma.image.findMany({
    where: { product_id: productId },
    select: { url: true, is_main: true },
  });
  assert.equal(imagesAfter.length, 1);
  assert.equal(imagesAfter[0].url, updatePayload.images[0].url);
  assert.equal(imagesAfter[0].is_main, true);
});

test("POST /api/products should create variants with full attribute combination", async () => {
  const token = await getAdminToken();
  const seed = Date.now() + Math.floor(Math.random() * 10000);

  const createPayload = {
    product: {
      name: `combo-product-${seed}`,
      selling_price: 100000,
      compare_price: 0,
      description: "",
      category_id: null,
      brand_id: null,
      collection_id: [],
      is_active: true,
    },
    attributes: [
      { id: `attr-1-${seed}`, name: "Attr 1", values: ["1", "2"] },
      { id: `attr-2-${seed}`, name: "Attr 2", values: ["a", "b"] },
    ],
    variants: [
      { id: `v-1a-${seed}`, price: 0, stock_quantity: 0, combo: "1 / a", sku: "", barcode: "" },
      { id: `v-1b-${seed}`, price: 0, stock_quantity: 0, combo: "1 / b", sku: "", barcode: "" },
      { id: `v-2a-${seed}`, price: 0, stock_quantity: 0, combo: "2 / a", sku: "", barcode: "" },
      { id: `v-2b-${seed}`, price: 0, stock_quantity: 0, combo: "2 / b", sku: "", barcode: "" },
    ],
    images: [],
  };

  const createRes = await request(app)
    .post("/api/products")
    .set("Authorization", `Bearer ${token}`)
    .send(createPayload);

  assert.equal(createRes.status, 201);
  assert.equal(createRes.body.success, true);

  const productId = createRes.body?.data?.product?.id;
  assert.ok(productId);
  createdProductIds.push(productId);

  const variants = await prisma.productVariant.findMany({
    where: { product_id: productId },
    select: {
      id: true,
      sku: true,
      attributes: { include: { value: true } },
    },
    orderBy: { id: "asc" },
  });

  assert.equal(variants.length, 4);
  for (const variant of variants) {
    assert.equal(variant.attributes.length, 2);

    const values = variant.attributes
      .slice()
      .sort((a, b) => a.value.attribute_id - b.value.attribute_id)
      .map((item) => item.value.value)
      .join(" / ");

    const expectedCombo = String(variant.sku).startsWith(`${productId}-`)
      ? String(variant.sku).slice(String(`${productId}-`).length)
      : "";

    assert.equal(values, expectedCombo);
  }
});

test("PUT /api/products/:productId/variants/:variantId should update variant fields", async () => {
  const token = await getAdminToken();
  const seed = Date.now() + Math.floor(Math.random() * 10000);

  const product = await prisma.product.create({
    data: {
      name: `variant-product-${seed}`,
      selling_price: 100000,
      is_active: true,
    },
    select: { id: true },
  });
  createdProductIds.push(product.id);

  const variant = await prisma.productVariant.create({
    data: {
      product_id: product.id,
      sku: `variant-sku-${seed}`,
      barcode: `variant-barcode-${seed}`,
      price: 100000,
      stock_quantity: 3,
    },
    select: { id: true },
  });

  const updateRes = await request(app)
    .put(`/api/products/${product.id}/variants/${variant.id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      sku: `  updated-sku-${seed}  `,
      barcode: ` updated-barcode-${seed} `,
      price: 90000,
      stock_quantity: 7,
    });

  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body.success, true);
  assert.equal(updateRes.body?.data?.variant?.sku, `updated-sku-${seed}`);
  assert.equal(updateRes.body?.data?.variant?.barcode, `updated-barcode-${seed}`);
  assert.equal(updateRes.body?.data?.variant?.price, 90000);
  assert.equal(updateRes.body?.data?.variant?.stock_quantity, 7);

  const variantAfter = await prisma.productVariant.findUnique({
    where: { id: variant.id },
    select: { sku: true, barcode: true, price: true, stock_quantity: true },
  });
  assert.equal(variantAfter.sku, `updated-sku-${seed}`);
  assert.equal(variantAfter.barcode, `updated-barcode-${seed}`);
  assert.equal(variantAfter.price, 90000);
  assert.equal(variantAfter.stock_quantity, 7);
});

after(async () => {
  await cleanupProducts();
  await prisma.$disconnect();
});
