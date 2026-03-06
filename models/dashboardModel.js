const prisma = require("../config/prisma");

class DashboardModel {
  static async getSummary() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenueAgg,
      avgOrderValueAgg,
      newCustomers,
      lowStockVariants,
      orderItems,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "COMPLETED" } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "PAID" },
      }),
      prisma.order.aggregate({
        _avg: { total_amount: true },
      }),
      prisma.user.count({
        where: {
          created_at: { gte: startOfMonth },
        },
      }),
      prisma.productVariant.count({
        where: { stock_quantity: { lte: 5 } },
      }),
      prisma.orderItem.findMany({
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
        take: 1000,
      }),
    ]);

    const productMap = new Map();
    for (const item of orderItems) {
      const product = item.variant?.product;
      if (!product) continue;

      const current = productMap.get(product.id) || {
        product_id: product.id,
        product_name: product.name,
        total_quantity: 0,
        total_revenue: 0,
      };

      current.total_quantity += item.quantity;
      current.total_revenue += item.quantity * item.price_at_purchase;
      productMap.set(product.id, current);
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.total_quantity - a.total_quantity)
      .slice(0, 5);

    return {
      total_revenue: totalRevenueAgg?._sum?.amount || 0,
      total_orders: totalOrders,
      pending_orders: pendingOrders,
      completed_orders: completedOrders,
      new_customers: newCustomers,
      average_order_value: Math.round(avgOrderValueAgg?._avg?.total_amount || 0),
      low_stock_variants: lowStockVariants,
      top_products: topProducts,
    };
  }
}

module.exports = DashboardModel;
