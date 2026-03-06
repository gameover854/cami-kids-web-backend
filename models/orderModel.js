const prisma = require("../config/prisma");

class OrderModel {
  static isValidStatusTransition(fromStatus, toStatus) {
    if (fromStatus === toStatus) return true;

    const allowedTransitions = {
      PENDING: ["PAID", "CANCELLED"],
      PAID: ["SHIPPED", "CANCELLED"],
      SHIPPED: ["COMPLETED", "CANCELLED"],
      COMPLETED: ["CANCELLED"],
      CANCELLED: [],
    };

    return (allowedTransitions[fromStatus] || []).includes(toStatus);
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
      if (status === "COMPLETED" && previousStatus !== "COMPLETED") {
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
      if (status === "CANCELLED" && previousStatus === "COMPLETED") {
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
    const existing = await prisma.payment.findUnique({
      where: { order_id: orderId },
    });

    if (!existing) {
      return prisma.payment.create({
        data: {
          order_id: orderId,
          amount: payload.amount,
          method: payload.method,
          status: payload.status,
          transaction_id: payload.transaction_id || null,
        },
      });
    }

    return prisma.payment.update({
      where: { order_id: orderId },
      data: {
        amount: payload.amount ?? existing.amount,
        method: payload.method ?? existing.method,
        status: payload.status ?? existing.status,
        transaction_id:
          payload.transaction_id !== undefined
            ? payload.transaction_id
            : existing.transaction_id,
      },
    });
  }
}

module.exports = OrderModel;
