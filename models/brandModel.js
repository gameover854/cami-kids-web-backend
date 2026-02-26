const prisma = require("../config/prisma"); // 👈 Import Prisma Client

class brandModel {
  // Tạo mới một thương hiệu
  static async create(data) {
    return await prisma.brand.create({ data });
  }

  // Lấy tất cả thương hiệu (hoặc theo điều kiện)
  static async findAll() {
    return await prisma.brand.findMany({
      // include: { categories: true },
    });
  }

  // Lấy thương hiệu theo ID
  static async findById(id) {
    return await prisma.brand.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            parent: true,
            children: true,
          },
        },
      },
    });
  }

  // Cập nhật thương hiệu theo ID
  static async update(id, data) {
    return await prisma.brand.update({
      where: { id },
      data,
    });
  }

  // Xóa thương hiệu theo ID
  static async delete(id) {
    return await prisma.brand.delete({ where: { id } });
  }
}

module.exports = brandModel;
