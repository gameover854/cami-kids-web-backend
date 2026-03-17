const prisma = require("../config/prisma");
const { PAYMENT_METHODS, PAYMENT_STATUSES } = require("../constants/payment");
const { ORDER_STATUS, ORDER_STATUS_TRANSITIONS } = require("../constants/order");

class OrderModel {
  static isValidStatusTransition(fromStatus, toStatus) {
    if (fromStatus === toStatus) return true;
    return (ORDER_STATUS_TRANSITIONS[fromStatus] || []).includes(toStatus);
  }

  static async findAll(page, limit, filters) {
    const { status, user_id, sort } = filters || {};
    const where = {
      ...(status ? { status } : {}),
      ...(user_id ? { user_id: Number(user_id) } : {}),
    };

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        payment: true,
      },
      skip: page === 1 ? 0 : (page - 1) * limit,
      take: limit,
      orderBy: {
        created_at: sort || "desc",
      },
    });

    const totalOrder = await prisma.order.count({ where });
    const totalPage = Math.ceil(totalOrder / limit);

    return { orders, totalOrder, totalPage };
  }

  static async findById(id) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    selling_price: true,
                  },
                },
              },
            },
          },
        },
        payment: true,
      },
    });
  }

  static async updateStatus(id, status) {
    return prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: {
          items: {
            select: {
              variant_id: true,
              quantity: true,
            },
          },
        },
      });

      if (!existingOrder) {
        throw new Error("Order not found");
      }

      const previousStatus = existingOrder.status;
      if (!OrderModel.isValidStatusTransition(previousStatus, status)) {
        throw new Error("Invalid order status transition");
      }

      // Chỉ trừ tồn khi chuyển sang COMPLETED lần đầu.
      if (
        status === ORDER_STATUS.COMPLETED &&
        previousStatus !== ORDER_STATUS.COMPLETED
      ) {
        for (const item of existingOrder.items) {
          const updated = await tx.productVariant.updateMany({
            where: {
              id: item.variant_id,
              stock_quantity: { gte: item.quantity },
            },
            data: {
              stock_quantity: {
                decrement: item.quantity,
              },
            },
          });

          if (updated.count === 0) {
            throw new Error("Insufficient stock for order completion");
          }
        }
      }

      // Nếu hủy từ trạng thái COMPLETED thì hoàn tồn kho.
      if (
        status === ORDER_STATUS.CANCELLED &&
        previousStatus === ORDER_STATUS.COMPLETED
      ) {
        for (const item of existingOrder.items) {
          await tx.productVariant.update({
            where: { id: item.variant_id },
            data: {
              stock_quantity: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      return tx.order.update({
        where: { id },
        data: { status },
      });
    });
  }

  static async updatePayment(orderId, payload) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, total_amount: true },
    });
    if (!order) {
      throw new Error("Order not found");
    }

    const existing = await prisma.payment.findUnique({
      where: { order_id: orderId },
    });

    const normalizedMethod =
      typeof payload.method === "string" ? payload.method.trim() : payload.method;
    const normalizedStatus =
      typeof payload.status === "string" ? payload.status.trim() : payload.status;

    if (normalizedMethod !== undefined && !normalizedMethod) {
      throw new Error("method must be a non-empty string");
    }
    if (normalizedStatus !== undefined && !normalizedStatus) {
      throw new Error("status must be a non-empty string");
    }
    if (normalizedMethod && !PAYMENT_METHODS.includes(normalizedMethod)) {
      throw new Error("Invalid payment method");
    }
    if (normalizedStatus && !PAYMENT_STATUSES.includes(normalizedStatus)) {
      throw new Error("Invalid payment status");
    }
    if (payload.amount !== undefined && payload.amount > order.total_amount) {
      throw new Error("payment amount cannot exceed order total amount");
    }

    if (!existing) {
      if (
        payload.amount === undefined ||
        !normalizedMethod ||
        !normalizedStatus
      ) {
        throw new Error("amount, method, status are required for new payment");
      }

      return prisma.payment.create({
        data: {
          order_id: orderId,
          amount: payload.amount,
          method: normalizedMethod,
          status: normalizedStatus,
          transaction_id: payload.transaction_id || null,
        },
      });
    }

    return prisma.payment.update({
      where: { order_id: orderId },
      data: {
        amount: payload.amount ?? existing.amount,
        method: normalizedMethod ?? existing.method,
        status: normalizedStatus ?? existing.status,
        transaction_id:
          payload.transaction_id !== undefined
            ? payload.transaction_id
            : existing.transaction_id,
      },
    });
  }

  static async createOrderWithPayment(payload) {
    const { items, shipping_address, user_id, payment, customer_name, customer_phone } =
      payload;

    return prisma.$transaction(async (tx) => {
      const variantIds = items.map((item) => item.variant_id);
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: {
          id: true,
          price: true,
          stock_quantity: true,
          product: { select: { id: true, name: true } },
        },
      });

      if (variants.length !== variantIds.length) {
        throw new Error("Variant not found");
      }

      const variantMap = new Map(variants.map((variant) => [variant.id, variant]));
      for (const item of items) {
        const variant = variantMap.get(item.variant_id);
        if (!variant) {
          throw new Error("Variant not found");
        }
        if (variant.stock_quantity < item.quantity) {
          throw new Error("Insufficient stock");
        }
      }

      const totalAmount = items.reduce((sum, item) => {
        const variant = variantMap.get(item.variant_id);
        return sum + (variant?.price || 0) * item.quantity;
      }, 0);

      if (payment?.amount !== undefined && payment.amount > totalAmount) {
        throw new Error("Payment amount cannot exceed order total amount");
      }

      const orderStatus =
        payment?.status === "SUCCESS" ? ORDER_STATUS.PAID : ORDER_STATUS.PENDING;

      const order = await tx.order.create({
        data: {
          total_amount: totalAmount,
          shipping_address,
          user_id: user_id ?? null,
          customer_name: customer_name ?? null,
          customer_phone: customer_phone ?? null,
          status: orderStatus,
        },
      });

      await tx.orderItem.createMany({
        data: items.map((item) => {
          const variant = variantMap.get(item.variant_id);
          return {
            order_id: order.id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            price_at_purchase: variant?.price || 0,
          };
        }),
      });

      if (payment) {
        const normalizedMethod =
          typeof payment.method === "string" ? payment.method.trim() : payment.method;
        const normalizedStatus =
          typeof payment.status === "string" ? payment.status.trim() : payment.status;

        if (normalizedMethod && !PAYMENT_METHODS.includes(normalizedMethod)) {
          throw new Error("Invalid payment method");
        }
        if (normalizedStatus && !PAYMENT_STATUSES.includes(normalizedStatus)) {
          throw new Error("Invalid payment status");
        }

        await tx.payment.create({
          data: {
            order_id: order.id,
            amount: payment.amount ?? totalAmount,
            method: normalizedMethod || "COD",
            status: normalizedStatus || "PENDING",
            transaction_id: payment.transaction_id || null,
          },
        });
      }

      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          payment: true,
        },
      });
    });
  }
}

module.exports = OrderModel;
