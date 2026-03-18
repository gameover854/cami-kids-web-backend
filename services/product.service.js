const prisma = require("../config/prisma");

exports.createProductWithAttributes = async (payload) => {
  let product;
  const dataAttribute = payload.attributes || [];
  const dataVariant = payload.variants || [];
  await prisma.$transaction(async (tx) => {
    //TẠO SẢN PHẨM
    product = await tx.product.create({
      data: buildDataProductFromPayload(payload),
    });

    const attributeIds = [];

    if (dataAttribute.length) {
      //TẠO THUỘC TÍNH VÀ GIÁ TRỊ THUỘC TÍNH
      for (const attr of dataAttribute) {
        const attribute = await tx.productAttribute.create({
          data: { name: attr.name, product_id: product.id },
        });

        await tx.productAttributeValue.createMany({
          data: attr.values.map((val) => {
            return {
              attribute_id: attribute.id,
              value: val,
            };
          }),
        });

        attributeIds.push(attribute.id);
      }

      const attributeCreated = await tx.productAttribute.findMany({
        include: { values: true },
        where: { id: { in: attributeIds } },
      });

      const attributeById = new Map(attributeCreated.map((item) => [item.id, item]));
      const valueCreated = attributeIds.map(
        (attributeId) => attributeById.get(attributeId)?.values || [],
      );

      //TẠO BIẾN THỂ
      const combo = buildVariantCombos(valueCreated);

      for (let [index, item] of dataVariant.entries()) {
        await tx.productVariant.create({
          data: {
            product_id: product.id,
            price: item.price ?? product.selling_price,
            stock_quantity: item.stock_quantity || 0,
            barcode: item.barcode || "unknown",
            sku: buildVariantSku(product.id, item, index),
            attributes: {
              create: (combo[index]?.value_ids || []).map((item) => {
                return { value_id: item };
              }),
            },
          },
        });
      }
    }
  });

  return product;
};

exports.updateProductWithReplace = async (productId, payload) => {
  const dataAttribute = payload.attributes || [];
  const dataVariant = payload.variants || [];
  const dataImage = payload.images || [];

  let updatedProduct;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!existing) {
      throw new Error("Product not found");
    }

    const productInput = payload.product || payload;
    const collectionIds = Array.isArray(productInput.collection_id)
      ? [...new Set(productInput.collection_id.map((id) => Number(id)))]
      : [];

    updatedProduct = await tx.product.update({
      where: { id: productId },
      data: {
        name: productInput.name,
        selling_price: productInput.selling_price,
        compare_price: productInput.compare_price,
        description: productInput.description,
        is_active: productInput.is_active,
        brand: productInput.brand_id
          ? { connect: { id: Number(productInput.brand_id) } }
          : { disconnect: true },
        category: productInput.category_id
          ? { connect: { id: Number(productInput.category_id) } }
          : { disconnect: true },
      },
    });

    await tx.collectionProduct.deleteMany({ where: { product_id: productId } });
    if (collectionIds.length > 0) {
      await tx.collectionProduct.createMany({
        data: collectionIds.map((collectionId) => ({
          product_id: productId,
          collection_id: Number(collectionId),
        })),
      });
    }

    await tx.image.deleteMany({ where: { product_id: productId } });
    if (dataImage.length > 0) {
      await tx.image.createMany({
        data: dataImage.map((image, index) => ({
          product_id: productId,
          url: image.url,
          public_id: image.public_id || null,
          is_main: Boolean(image.is_main),
          order: Number.isInteger(image.order) ? image.order : index,
        })),
      });
    }

    await tx.variantAttribute.deleteMany({
      where: { variant: { product_id: productId } },
    });
    await tx.image.deleteMany({
      where: { variant: { product_id: productId } },
    });
    await tx.productVariant.deleteMany({ where: { product_id: productId } });
    await tx.productAttributeValue.deleteMany({
      where: { attribute: { product_id: productId } },
    });
    await tx.productAttribute.deleteMany({ where: { product_id: productId } });

    const attributeIds = [];
    for (const attr of dataAttribute) {
      const attribute = await tx.productAttribute.create({
        data: {
          name: attr.name,
          product_id: productId,
        },
      });

      if (Array.isArray(attr.values) && attr.values.length > 0) {
        await tx.productAttributeValue.createMany({
          data: attr.values.map((value) => ({
            attribute_id: attribute.id,
            value: String(value),
          })),
        });
      }

      attributeIds.push(attribute.id);
    }

    let combo = [];
    if (attributeIds.length > 0) {
      const attributeCreated = await tx.productAttribute.findMany({
        include: { values: true },
        where: { id: { in: attributeIds } },
      });

      const attributeById = new Map(attributeCreated.map((item) => [item.id, item]));
      const valueCreated = attributeIds.map(
        (attributeId) => attributeById.get(attributeId)?.values || [],
      );
      combo = buildVariantCombos(valueCreated);
    }

    for (let [index, item] of dataVariant.entries()) {
      await tx.productVariant.create({
        data: {
          product_id: productId,
          price: item.price ?? updatedProduct.selling_price,
          stock_quantity: item.stock_quantity || 0,
          barcode: item.barcode || "unknown",
          sku: buildVariantSku(productId, item, index),
          attributes: {
            create: (combo[index]?.value_ids || []).map((valueId) => ({
              value_id: valueId,
            })),
          },
        },
      });
    }
  });

  return updatedProduct;
};

exports.deleteProductWithRelations = async (productId) => {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!existing) {
      throw new Error("Product not found");
    }

    const variantIds = await tx.productVariant.findMany({
      where: { product_id: productId },
      select: { id: true },
    });
    const variantIdList = variantIds.map((item) => item.id);

    if (variantIdList.length > 0) {
      const orderItemCount = await tx.orderItem.count({
        where: { variant_id: { in: variantIdList } },
      });
      const cartItemCount = await tx.cartItem.count({
        where: { variant_id: { in: variantIdList } },
      });

      if (orderItemCount > 0 || cartItemCount > 0) {
        throw new Error("Product is in use");
      }
    }

    await tx.variantAttribute.deleteMany({
      where: { variant_id: { in: variantIdList } },
    });

    const imageWhere =
      variantIdList.length > 0
        ? {
            OR: [{ product_id: productId }, { variant_id: { in: variantIdList } }],
          }
        : { product_id: productId };
    await tx.image.deleteMany({ where: imageWhere });

    await tx.productVariant.deleteMany({ where: { product_id: productId } });
    await tx.productAttributeValue.deleteMany({
      where: { attribute: { product_id: productId } },
    });
    await tx.productAttribute.deleteMany({ where: { product_id: productId } });
    await tx.collectionProduct.deleteMany({ where: { product_id: productId } });

    await tx.product.delete({ where: { id: productId } });
  });

  return { id: productId };
};

const parseFilterIds = (value) => {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) {
    return value.map((item) => Number(item)).filter((item) => Number.isInteger(item));
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item));
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) ? [parsed] : [];
};

const resolveCategoryDescendants = async (categoryIds) => {
  const uniqueIds = [...new Set(categoryIds)];
  if (uniqueIds.length === 0) return [];

  const visited = new Set(uniqueIds);
  let frontier = uniqueIds;

  while (frontier.length > 0) {
    const children = await prisma.category.findMany({
      where: { parent_id: { in: frontier } },
      select: { id: true },
    });

    const next = [];
    for (const child of children) {
      if (!visited.has(child.id)) {
        visited.add(child.id);
        next.push(child.id);
      }
    }

    frontier = next;
  }

  return [...visited];
};

exports.getAllProductWithPaginate = async (page, limit, filters) => {
  let conditions;
  const { category_id, is_active, brand_id, sort, keyword } = filters;

  const categoryIds = parseFilterIds(category_id);
  const expandedCategoryIds = await resolveCategoryDescendants(categoryIds);
  const brandIds = parseFilterIds(brand_id);
  const statusIds = parseFilterIds(is_active);
  const isActiveValues = statusIds.map((value) => Boolean(Number(value)));

  conditions = {
    ...(expandedCategoryIds.length > 0
      ? { category_id: { in: expandedCategoryIds } }
      : {}),
    ...(brandIds.length > 0 ? { brand_id: { in: brandIds } } : {}),
    ...(isActiveValues.length > 0 ? { is_active: { in: isActiveValues } } : {}),
    ...(keyword
      ? {
          OR: [
            { name: { contains: String(keyword) } },
            { description: { contains: String(keyword) } },
            {
              variants: {
                some: {
                  OR: [
                    { sku: { contains: String(keyword) } },
                    { barcode: { contains: String(keyword) } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };

  const products = await prisma.product.findMany({
    include: {
      images: {
        select: {
          is_main: true,
          url: true,
        },
        orderBy: [
          { is_main: "desc" }, // true lên trước
          { id: "desc" },
        ],
        take: 1,
      },
      category: {
        select: {
          name: true,
          children: true,
          parent: true,
        },
      },
      collections: {
        include: {
          collection: true,
        },
      },
      brand: {
        select: {
          name: true,
        },
      },
      attributes: {
        include: {
          _count: {
            select: {
              values: true,
            },
          },
        },
      },
    },
    where: conditions,
    skip: page === 1 ? 0 : (page - 1) * limit,
    take: limit,
    orderBy: {
      created_at: sort ? sort : "desc",
    },
  });
  const totalProduct = await prisma.product.count({ where: conditions });
  const totalPage = Math.ceil(totalProduct / limit);
  const endPage = totalPage;
  const startPage = 1;
  return { products, totalProduct, startPage, endPage, totalPage };
};

const buildDataProductFromPayload = (payload) => {
  const dataImage = payload.images;
  const dataProduct = payload.product;

  let data = {
    name: dataProduct.name,
    selling_price: dataProduct.selling_price,
    compare_price: dataProduct.compare_price,
    description: dataProduct.description,
    is_active: dataProduct.is_active,
  };
  data = {
    ...data,
    ...(dataProduct.brand_id && {
      brand: {
        connect: {
          id: dataProduct.brand_id,
        },
      },
    }),
    ...(dataProduct.category_id && {
      category: {
        connect: {
          id: dataProduct.category_id,
        },
      },
    }),
    ...(dataProduct.collection_id && {
      collections: {
        create: dataProduct.collection_id.map((id) => ({
          collection: {
            connect: { id },
          },
        })),
      },
    }),
    ...(dataImage && {
      images: {
        create: dataImage.map((img) => ({
          url: img.url,
          public_id: img.public_id,
          is_main: img.is_main ?? false,
          order: img.order ?? 0,
        })),
      },
    }),
  };

  return data;
};

const buildVariantSku = (productId, variant, index) => {
  const manualSku = String(variant?.sku || "").trim();
  if (manualSku) {
    return manualSku;
  }

  const combo = String(variant?.combo || "").trim();
  if (combo) {
    return `${productId}-${combo}`;
  }

  return `${productId}-v${index + 1}`;
};

function buildVariantCombos(valueGroups) {
  if (!Array.isArray(valueGroups) || valueGroups.length === 0) return [];

  return valueGroups.reduce(
    (acc, values) =>
      acc.flatMap((prev) =>
        values.map((curr) => ({
          value_ids: prev.value_ids.length
            ? [...prev.value_ids, curr.id]
            : [curr.id],
          combo: prev.combo ? `${prev.combo} / ${curr.value}` : curr.value,
        })),
      ),
    [{ value_ids: [], combo: "" }],
  );
}
