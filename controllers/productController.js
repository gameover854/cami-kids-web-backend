// controllers/productController.js
const productModel = require("../models/productModel");
const productService = require("../services/product.service");
const { ok, fail } = require("../utils/apiResponse");

// Lấy danh sách sản phẩm
exports.getAll = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const filters = req.query.filters || {};
    const { products, totalProduct, totalPage } =
      await productService.getAllProductWithPaginate(page, limit, filters);
    return ok(
      res,
      { products, totalProduct, totalPage },
      "Get products successfully",
      200,
    );
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

// Lấy một sản phẩm theo ID
exports.getById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid product id", 400);
    const product = await productModel.findById(id);
    if (!product) return fail(res, "Product not found", 404);
    return ok(res, { product }, "Get product successfully", 200);
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

// Tạo mới sản phẩm
exports.create = async (req, res) => {
  try {
    const payload = req.body;
    const product = await productService.createProductWithAttributes(payload);
    return ok(res, { product }, "Product created successfully.", 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

// Cập nhật sản phẩm
exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid product id", 400);
    const updateData = req.body.product || req.body;
    const updatedProduct = await productModel.update(id, updateData);
    return ok(res, { product: updatedProduct }, "Product updated successfully.");
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

// Xóa sản phẩm
exports.delete = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid product id", 400);
    await productModel.delete(id);
    return ok(res, { id }, "Product deleted successfully.");
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

// 2. Upload ảnh (nếu có)
// let images = [];
// if (req.files && req.files.length > 0) {
//     for (let file of req.files) {
//         // Upload từng ảnh
//         const uploadResult = await cloudinaryService.uploadBuffer(
//             file.buffer,
//             `cami_kids/products/${productId}`,
//             `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
//         );

//         // Lưu DB cho ảnh
//         const img = await prisma.image.create({
//             data: {
//                 url: uploadResult.secure_url,
//                 variant_id: null, // nếu chưa có variant
//                 alt_text: null,
//                 is_main: file.is_main || false
//             },
//         });

//         images.push(img);
//     }
// }
