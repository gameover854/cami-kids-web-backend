const prisma = require("../config/prisma");
const { ok, fail, handlePrismaError } = require("../utils/apiResponse");

exports.getById = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const variantId = Number(req.params.variantId);

    if (Number.isNaN(productId) || Number.isNaN(variantId)) {
      return fail(res, "Invalid product or variant id", 400);
    }

    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, product_id: productId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            selling_price: true,
            is_active: true,
          },
        },
        images: true,
        attributes: {
          include: {
            value: {
              include: {
                attribute: true,
              },
            },
          },
        },
      },
    });

    if (!variant) return fail(res, "Variant not found", 404);
    return ok(res, { variant }, "Get variant successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

exports.update = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const variantId = Number(req.params.variantId);

    if (Number.isNaN(productId) || Number.isNaN(variantId)) {
      return fail(res, "Invalid product or variant id", 400);
    }

    const existed = await prisma.productVariant.findFirst({
      where: { id: variantId, product_id: productId },
      select: { id: true },
    });
    if (!existed) return fail(res, "Variant not found", 404);

    const { sku, barcode, price, stock_quantity } = req.body || {};
    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(sku !== undefined ? { sku: String(sku).trim() } : {}),
        ...(barcode !== undefined ? { barcode: String(barcode).trim() } : {}),
        ...(price !== undefined ? { price } : {}),
        ...(stock_quantity !== undefined ? { stock_quantity } : {}),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        images: true,
        attributes: {
          include: {
            value: {
              include: {
                attribute: true,
              },
            },
          },
        },
      },
    });

    return ok(res, { variant: updated }, "Variant updated successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};
