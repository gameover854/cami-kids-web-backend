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

      const valueCreated = attributeCreated.map((item) => {
        return item.values;
      });

      //TẠO BIẾN THỂ
      const combo = valueCreated.reduce(
        (before, after) => {
          return before.flatMap((prev) => {
            return after.map((curr) => {
              return {
                value_ids: prev.length ? [prev.id, curr.id] : [curr.id],
                combo: prev.length
                  ? `${prev.value} / ${curr.value}`
                  : curr.value,
              };
            });
          });
        },
        [
          {
            value_ids: [],
            combo: "",
          },
        ],
      );

      for (let [index, item] of dataVariant.entries()) {
        await tx.productVariant.create({
          data: {
            product_id: product.id,
            price: item.price ?? product.selling_price,
            stock_quantity: item.stock_quantity || 0,
            barcode: "unknown",
            sku: `${product.id}-${item.combo}`,
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

exports.getAllProductWithPaginate = async (page, limit, filters) => {
  let conditions;
  const { category_id, is_active, sort } = filters;

  conditions = {
    ...(category_id ? { category_id: Number(category_id) } : {}),
    ...(is_active !== undefined && is_active !== null && is_active !== ""
      ? { is_active: Boolean(Number(is_active)) }
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

