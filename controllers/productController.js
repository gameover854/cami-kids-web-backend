// controllers/productController.js
const productModel = require("../models/productModel");
const productService = require("../services/product.service");
const { ok, fail, handlePrismaError } = require("../utils/apiResponse");

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
    return handlePrismaError(res, err);
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
    return handlePrismaError(res, err);
  }
};

// Tạo mới sản phẩm
exports.create = async (req, res) => {
  try {
    const payload = req.body;
    const product = await productService.createProductWithAttributes(payload);
    return ok(res, { product }, "Product created successfully.", 201);
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

// Cập nhật sản phẩm
exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid product id", 400);
    const payload = req.body || {};
    const updatedProduct = await productService.updateProductWithReplace(
      id,
      payload,
    );
    return ok(res, { product: updatedProduct }, "Product updated successfully.");
  } catch (err) {
    if (err.message === "Product not found") {
      return fail(res, "Product not found", 404);
    }
    return handlePrismaError(res, err);
  }
};

// Xóa sản phẩm
exports.delete = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid product id", 400);
    await productService.deleteProductWithRelations(id);
    return ok(res, { id }, "Product deleted successfully.");
  } catch (err) {
    if (err.message === "Product not found") {
      return fail(res, "Product not found", 404);
    }
    if (err.message === "Product is in use") {
      return fail(
        res,
        "Product cannot be deleted because it is referenced by orders or carts",
        409,
      );
    }
    return handlePrismaError(res, err);
  }
};
