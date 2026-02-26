const prisma = require("../config/prisma"); // 👈 Import Prisma Client

class promotionModel {
  // Tạo mới một khuyến mãi
  static async create(data) {
    return await prisma.promotion.create({ data });
  }

  // Lấy tất cả khuyến mãi (hoặc theo điều kiện)
  static async findAll() {
    return await prisma.promotion.findMany();
  }

  // Lấy khuyến mãi theo ID
  static async findById(id) {
    return await prisma.promotion.findUnique({ where: { id } });
  }

  // Cập nhật khuyến mãi theo ID
  static async update(id, data) {
    return await prisma.promotion.update({
      where: { id },
      data,
    });
  }

  // Xóa khuyến mãi theo ID
  static async delete(id) {
    return await prisma.promotion.delete({ where: { id } });
  }
}

module.exports = promotionModel;
