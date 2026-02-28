const prisma = require("./config/prisma");
const bcrypt = require("bcryptjs");

async function hashPassword(plainPassword) {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
  return bcrypt.hash(plainPassword, saltRounds);
}

async function clearDatabase() {
  await prisma.variantAttribute.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.image.deleteMany();
  await prisma.collectionPromotion.deleteMany();
  await prisma.collectionProduct.deleteMany();
  await prisma.productAttributeValue.deleteMany();
  await prisma.productAttribute.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.user.deleteMany();
}

async function createProductWithDetails(data, ids) {
  const product = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      selling_price: data.selling_price,
      compare_price: data.compare_price,
      is_active: data.is_active,
      category_id: ids.categories[data.category_slug],
      brand_id: ids.brands[data.brand_slug],
    },
  });

  if (data.product_images?.length) {
    await prisma.image.createMany({
      data: data.product_images.map((img, index) => ({
        url: img.url,
        public_id: img.public_id,
        alt_text: img.alt_text,
        is_main: index === 0,
        order: index,
        product_id: product.id,
      })),
    });
  }

  const attributeValueIds = {};

  for (const attr of data.attributes) {
    const createdAttr = await prisma.productAttribute.create({
      data: {
        name: attr.name,
        product_id: product.id,
      },
    });

    const values = await Promise.all(
      attr.values.map((value) =>
        prisma.productAttributeValue.create({
          data: {
            value,
            attribute_id: createdAttr.id,
          },
        }),
      ),
    );

    attributeValueIds[attr.name] = {};
    values.forEach((v) => {
      attributeValueIds[attr.name][v.value] = v.id;
    });
  }

  const createdVariants = {};

  for (const variant of data.variants) {
    const createdVariant = await prisma.productVariant.create({
      data: {
        sku: variant.sku,
        barcode: variant.barcode,
        price: variant.price,
        stock_quantity: variant.stock_quantity,
        product_id: product.id,
      },
    });

    createdVariants[variant.sku] = createdVariant.id;

    const links = Object.entries(variant.attributes).map(([name, value]) => ({
      variant_id: createdVariant.id,
      value_id: attributeValueIds[name][value],
    }));

    await prisma.variantAttribute.createMany({ data: links });

    if (variant.images?.length) {
      await prisma.image.createMany({
        data: variant.images.map((img, index) => ({
          url: img.url,
          public_id: img.public_id,
          alt_text: img.alt_text,
          is_main: index === 0,
          order: index,
          variant_id: createdVariant.id,
        })),
      });
    }
  }

  for (const collectionSlug of data.collection_slugs) {
    await prisma.collectionProduct.create({
      data: {
        collection_id: ids.collections[collectionSlug],
        product_id: product.id,
      },
    });
  }

  return { product, createdVariants };
}

async function seed() {
  await clearDatabase();
  const adminPasswordHash = await hashPassword("admin123");
  const customerPasswordHash = await hashPassword("customer123");

  const brands = await prisma.$transaction([
    prisma.brand.create({
      data: {
        name: "Cami Kids",
        slug: "cami-kids",
        logo: "https://cdn.example.com/brands/cami-kids.webp",
        description: "Thuong hieu noi bo danh cho tre em.",
      },
    }),
    prisma.brand.create({
      data: {
        name: "Sunny Bear",
        slug: "sunny-bear",
        logo: "https://cdn.example.com/brands/sunny-bear.webp",
        description: "Do mac nha va do bo cho be.",
      },
    }),
    prisma.brand.create({
      data: {
        name: "Little Step",
        slug: "little-step",
        logo: "https://cdn.example.com/brands/little-step.webp",
        description: "Phu kien va giay dep cho tre em.",
      },
    }),
  ]);

  const categories = [];
  categories.push(
    await prisma.category.create({
      data: {
        name: "Be trai",
        slug: "be-trai",
      },
    }),
  );
  categories.push(
    await prisma.category.create({
      data: {
        name: "Ao thun be trai",
        slug: "ao-thun-be-trai",
        parent_id: categories[0].id,
      },
    }),
  );
  categories.push(
    await prisma.category.create({
      data: {
        name: "Quan short be trai",
        slug: "quan-short-be-trai",
        parent_id: categories[0].id,
      },
    }),
  );

  categories.push(
    await prisma.category.create({
      data: {
        name: "Be gai",
        slug: "be-gai",
      },
    }),
  );
  categories.push(
    await prisma.category.create({
      data: {
        name: "Vay be gai",
        slug: "vay-be-gai",
        parent_id: categories[3].id,
      },
    }),
  );
  categories.push(
    await prisma.category.create({
      data: {
        name: "Bo mac nha be gai",
        slug: "bo-mac-nha-be-gai",
        parent_id: categories[3].id,
      },
    }),
  );

  categories.push(
    await prisma.category.create({
      data: {
        name: "Phu kien",
        slug: "phu-kien",
      },
    }),
  );
  categories.push(
    await prisma.category.create({
      data: {
        name: "Giay dep",
        slug: "giay-dep",
        parent_id: categories[6].id,
      },
    }),
  );

  const collections = await prisma.$transaction([
    prisma.collection.create({
      data: {
        name: "He 2026",
        slug: "he-2026",
        is_active: true,
      },
    }),
    prisma.collection.create({
      data: {
        name: "Back To School",
        slug: "back-to-school",
        is_active: true,
      },
    }),
    prisma.collection.create({
      data: {
        name: "Do mac nha",
        slug: "do-mac-nha",
        is_active: true,
      },
    }),
  ]);

  const promotions = await prisma.$transaction([
    prisma.promotion.create({
      data: {
        code: "SUMMER15",
        name: "Giam 15% mua he",
        type: "PERCENTAGE",
        value: 15,
        start_date: new Date("2026-05-01T00:00:00.000Z"),
        end_date: new Date("2026-08-31T23:59:59.000Z"),
        is_active: true,
      },
    }),
    prisma.promotion.create({
      data: {
        code: "WELCOME50000",
        name: "Don dau 50k",
        type: "FIXED_AMOUNT",
        value: 50000,
        start_date: new Date("2026-01-01T00:00:00.000Z"),
        end_date: new Date("2026-12-31T23:59:59.000Z"),
        is_active: true,
      },
    }),
  ]);

  const ids = {
    brands: Object.fromEntries(brands.map((b) => [b.slug, b.id])),
    categories: Object.fromEntries(categories.map((c) => [c.slug, c.id])),
    collections: Object.fromEntries(collections.map((c) => [c.slug, c.id])),
    promotions: Object.fromEntries(promotions.map((p) => [p.code, p.id])),
  };

  await prisma.collectionPromotion.createMany({
    data: [
      {
        collection_id: ids.collections["he-2026"],
        promotion_id: ids.promotions.SUMMER15,
      },
      {
        collection_id: ids.collections["back-to-school"],
        promotion_id: ids.promotions.SUMMER15,
      },
      {
        collection_id: ids.collections["do-mac-nha"],
        promotion_id: ids.promotions.WELCOME50000,
      },
    ],
  });

  const p1 = await createProductWithDetails(
    {
      name: "Ao thun be trai basic",
      description: "Ao cotton mem, thấm hut tot, mac hang ngay.",
      selling_price: 189000,
      compare_price: 229000,
      is_active: true,
      category_slug: "ao-thun-be-trai",
      brand_slug: "cami-kids",
      collection_slugs: ["he-2026", "back-to-school"],
      product_images: [
        {
          url: "https://cdn.example.com/products/p1/main.webp",
          public_id: "products/p1/main",
          alt_text: "Ao thun be trai mau xanh",
        },
      ],
      attributes: [
        { name: "Mau sac", values: ["Xanh", "Trang"] },
        { name: "Size", values: ["100", "110"] },
      ],
      variants: [
        {
          sku: "ATBT-001-XANH-100",
          barcode: "893000000101",
          price: 189000,
          stock_quantity: 25,
          attributes: { "Mau sac": "Xanh", Size: "100" },
          images: [
            {
              url: "https://cdn.example.com/products/p1/v-xanh-100.webp",
              public_id: "products/p1/v-xanh-100",
              alt_text: "Ao xanh size 100",
            },
          ],
        },
        {
          sku: "ATBT-001-XANH-110",
          barcode: "893000000102",
          price: 189000,
          stock_quantity: 20,
          attributes: { "Mau sac": "Xanh", Size: "110" },
        },
        {
          sku: "ATBT-001-TRANG-100",
          barcode: "893000000103",
          price: 189000,
          stock_quantity: 18,
          attributes: { "Mau sac": "Trang", Size: "100" },
        },
        {
          sku: "ATBT-001-TRANG-110",
          barcode: "893000000104",
          price: 189000,
          stock_quantity: 12,
          attributes: { "Mau sac": "Trang", Size: "110" },
        },
      ],
    },
    ids,
  );

  const p2 = await createProductWithDetails(
    {
      name: "Vay be gai hoa nhi",
      description: "Vay hoa nhe, phu hop di hoc va di choi.",
      selling_price: 299000,
      compare_price: 349000,
      is_active: true,
      category_slug: "vay-be-gai",
      brand_slug: "sunny-bear",
      collection_slugs: ["he-2026"],
      product_images: [
        {
          url: "https://cdn.example.com/products/p2/main.webp",
          public_id: "products/p2/main",
          alt_text: "Vay be gai hoa nhi",
        },
      ],
      attributes: [
        { name: "Mau sac", values: ["Hong", "Vang"] },
        { name: "Size", values: ["110", "120"] },
      ],
      variants: [
        {
          sku: "VBG-002-HONG-110",
          barcode: "893000000201",
          price: 299000,
          stock_quantity: 16,
          attributes: { "Mau sac": "Hong", Size: "110" },
        },
        {
          sku: "VBG-002-VANG-120",
          barcode: "893000000202",
          price: 299000,
          stock_quantity: 10,
          attributes: { "Mau sac": "Vang", Size: "120" },
        },
      ],
    },
    ids,
  );

  const p3 = await createProductWithDetails(
    {
      name: "Sandal quai mem",
      description: "Sandal de mem, de di hoc va di choi.",
      selling_price: 249000,
      compare_price: 279000,
      is_active: true,
      category_slug: "giay-dep",
      brand_slug: "little-step",
      collection_slugs: ["back-to-school"],
      product_images: [
        {
          url: "https://cdn.example.com/products/p3/main.webp",
          public_id: "products/p3/main",
          alt_text: "Sandal quai mem",
        },
      ],
      attributes: [
        { name: "Mau sac", values: ["Nau"] },
        { name: "Size", values: ["30", "31"] },
      ],
      variants: [
        {
          sku: "SD-003-NAU-30",
          barcode: "893000000301",
          price: 249000,
          stock_quantity: 14,
          attributes: { "Mau sac": "Nau", Size: "30" },
        },
        {
          sku: "SD-003-NAU-31",
          barcode: "893000000302",
          price: 249000,
          stock_quantity: 9,
          attributes: { "Mau sac": "Nau", Size: "31" },
        },
      ],
    },
    ids,
  );

  const users = await prisma.$transaction([
    prisma.user.create({
      data: {
        name: "Admin Cami",
        email: "admin@cami.local",
        password: adminPasswordHash,
        phone: "0900000001",
        role: "admin",
      },
    }),
    prisma.user.create({
      data: {
        name: "Nguyen An",
        email: "an.nguyen@cami.local",
        password: customerPasswordHash,
        phone: "0900000002",
        role: "customer",
      },
    }),
    prisma.user.create({
      data: {
        name: "Tran Binh",
        email: "binh.tran@cami.local",
        password: customerPasswordHash,
        phone: "0900000003",
        role: "customer",
      },
    }),
  ]);

  const customer1 = users[1];
  const customer2 = users[2];

  const cart1 = await prisma.cart.create({
    data: { user_id: customer1.id },
  });

  const cart2 = await prisma.cart.create({
    data: { user_id: customer2.id },
  });

  await prisma.cartItem.createMany({
    data: [
      {
        cart_id: cart1.id,
        variant_id: p1.createdVariants["ATBT-001-XANH-100"],
        quantity: 2,
      },
      {
        cart_id: cart1.id,
        variant_id: p3.createdVariants["SD-003-NAU-30"],
        quantity: 1,
      },
      {
        cart_id: cart2.id,
        variant_id: p2.createdVariants["VBG-002-HONG-110"],
        quantity: 1,
      },
    ],
  });

  const order1 = await prisma.order.create({
    data: {
      user_id: customer1.id,
      shipping_address: "12 Nguyen Trai, Q1, TP.HCM",
      total_amount: 627000,
      status: "PAID",
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        order_id: order1.id,
        variant_id: p1.createdVariants["ATBT-001-XANH-100"],
        quantity: 2,
        price_at_purchase: 189000,
      },
      {
        order_id: order1.id,
        variant_id: p3.createdVariants["SD-003-NAU-30"],
        quantity: 1,
        price_at_purchase: 249000,
      },
    ],
  });

  await prisma.payment.create({
    data: {
      order_id: order1.id,
      amount: 627000,
      method: "COD",
      status: "SUCCESS",
      transaction_id: "TXN-CAMI-0001",
    },
  });

  const order2 = await prisma.order.create({
    data: {
      user_id: customer2.id,
      shipping_address: "88 Le Van Sy, Phu Nhuan, TP.HCM",
      total_amount: 299000,
      status: "PENDING",
    },
  });

  await prisma.orderItem.create({
    data: {
      order_id: order2.id,
      variant_id: p2.createdVariants["VBG-002-HONG-110"],
      quantity: 1,
      price_at_purchase: 299000,
    },
  });

  const summary = {
    brands: await prisma.brand.count(),
    categories: await prisma.category.count(),
    collections: await prisma.collection.count(),
    promotions: await prisma.promotion.count(),
    products: await prisma.product.count(),
    productVariants: await prisma.productVariant.count(),
    productAttributes: await prisma.productAttribute.count(),
    productAttributeValues: await prisma.productAttributeValue.count(),
    variantAttributes: await prisma.variantAttribute.count(),
    users: await prisma.user.count(),
    carts: await prisma.cart.count(),
    cartItems: await prisma.cartItem.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    payments: await prisma.payment.count(),
    images: await prisma.image.count(),
    collectionProducts: await prisma.collectionProduct.count(),
    collectionPromotions: await prisma.collectionPromotion.count(),
  };

  console.table(summary);
}

if (require.main === module) {
  seed()
    .then(async () => {
      await prisma.$disconnect();
      console.log("Seed completed.");
    })
    .catch(async (error) => {
      console.error("Seed failed:", error);
      await prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { seed };
