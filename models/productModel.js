const prisma = require("../config/prisma");

class ProductModel {
  // Tạo mới một sản phẩm
  static async create(payload) {
    return await prisma.product.create({
      data: payload,
    });
  }

  // Lấy tất cả sản phẩm (hoặc theo điều kiện)
  static async findAll() {
    return await prisma.product.findMany({
      include: {
        category: true,
        images: true,
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
    });
  }

  // Lấy sản phẩm theo ID
  static async findById(id) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            images: true,
            attributes: {
              include: {
                value: true,
              },
            },
          },
        },
        attributes: {
          include: {
            values: true,
            _count: {
              select: {
                values: true,
              },
            },
          },
        },
        images: true,
        category: true,
        brand: true,
        collections: {
          include: {
            collection: true,
          },
        },
      },
    });
  }

  // Cập nhật sản phẩm theo ID
  static async update(id, data) {
    return await prisma.product.update({
      where: { id },
      data,
    });
  }

  // Xóa sản phẩm theo ID
  static async delete(id) {
    return await prisma.product.delete({ where: { id } });
  }
}

module.exports = ProductModel;
