const prisma = require("../config/prisma"); // 👈 Import Prisma Client

class categoryModel {
  // Tạo mới một danh mục
  static async create(data) {
    return await prisma.category.create({ data });
  }

  // Lấy tất cả danh mục (hoặc theo điều kiện)
  static async findAll() {
    return await prisma.category.findMany({
      where: {
        parent_id: null,
      },
      include: {
        children: true,
      },
    });
  }

  // Lấy danh mục theo ID
  static async findById(id) {
    return await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
      },
    });
  }

  // Cập nhật danh mục theo ID
  static async update(id, data) {
    return await prisma.category.update({
      where: { id },
      data,
    });
  }

  // Xóa danh mục theo ID
  static async delete(id) {
    return await prisma.category.delete({ where: { id } });
  }
}

module.exports = categoryModel;
