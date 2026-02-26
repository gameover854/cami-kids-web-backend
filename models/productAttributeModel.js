const prisma = require("../config/prisma");

class ProductAttributeModel {
  // Tạo mới một sản phẩm
  // static async create(payload) {
  //     return await prisma.productAttribute.create({
  //         data: payload
  //     });
  // }
  // // Lấy tất cả sản phẩm (hoặc theo điều kiện)
  // static async findAll() {
  //     return await prisma.product.findMany();
  // }
  // // Lấy sản phẩm theo ID
  // static async findById(id) {
  //     return await prisma.product.findUnique({
  //         where: { id },
  //         include: {
  //             variants: {
  //                 include: {
  //                     images: true,
  //                     attributes: true
  //                 }
  //             },
  //             category: true,
  //             promotion: true,
  //             collections: true
  //         }
  //     });
  // }
  // // Cập nhật sản phẩm theo ID
  // static async update(id, data) {
  //     return await prisma.product.update({
  //         where: { id },
  //         data,
  //     });
  // }
  // // Xóa sản phẩm theo ID
  // static async delete(id) {
  //     return await prisma.product.delete({ where: { id } });
  // }
}

module.exports = ProductAttributeModel;
