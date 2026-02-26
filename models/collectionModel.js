const prisma = require("../config/prisma"); // 👈 Import Prisma Client

class collectionModel {
  // Tạo mới một sản phẩm
  static async create(data) {
    return await prisma.collection.create({ data });
  }

  // Lấy tất cả sản phẩm (hoặc theo điều kiện)
  static async findAll() {
    return await prisma.collection.findMany();
  }

  // Lấy sản phẩm theo ID
  static async findById(id) {
    return await prisma.collection.findUnique({ where: { id } });
  }

  // Cập nhật sản phẩm theo ID
  static async update(id, data) {
    return await prisma.collection.update({
      where: { id },
      data,
    });
  }

  // Xóa sản phẩm theo ID
  static async delete(id) {
    return await prisma.collection.delete({ where: { id } });
  }
}

module.exports = collectionModel;
