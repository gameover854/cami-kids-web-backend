// controllers/PromotionController.js
const promotionModel = require("../models/promotionModel");
const { ok, fail, handlePrismaError } = require("../utils/apiResponse");

// Lấy danh sách khuyến mãi
exports.getAll = async (req, res) => {
  try {
    const promotions = await promotionModel.findAll();
    return ok(res, { promotions }, "Get promotions successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

// Lấy một khuyến mãi theo ID
exports.getById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid promotion id", 400);
    const promotion = await promotionModel.findById(id);
    if (!promotion) return fail(res, "Promotion not found", 404);
    return ok(res, { promotion }, "Get promotion successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

// Tạo mới khuyến mãi
exports.create = async (req, res) => {
  try {
    const newPromotion = await promotionModel.create(req.body);
    return ok(res, { promotion: newPromotion }, "Promotion created successfully", 201);
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

// Cập nhật khuyến mãi
exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid promotion id", 400);
    const updatedPromotion = await promotionModel.update(id, req.body);
    return ok(res, { promotion: updatedPromotion }, "Promotion updated successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

// Xóa khuyến mãi
exports.delete = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid promotion id", 400);
    await promotionModel.delete(id);
    return ok(res, { id }, "Promotion deleted successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};
