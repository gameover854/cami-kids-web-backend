// controllers/PromotionController.js
const collectionModel = require("../models/collectionModel");
const { ok, fail, handlePrismaError } = require("../utils/apiResponse");

// Lấy danh sách khuyến mãi
exports.getAll = async (req, res) => {
  try {
    const collections = await collectionModel.findAll();
    return ok(res, { collections }, "Get collections successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

// Lấy một khuyến mãi theo ID
exports.getById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid collection id", 400);
    const collection = await collectionModel.findById(id);
    if (!collection) return fail(res, "Collection not found", 404);
    return ok(res, { collection }, "Get collection successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

// Tạo mới khuyến mãi
exports.create = async (req, res) => {
  try {
    const collection = await collectionModel.create(req.body);
    return ok(res, { collection }, "Collection created successfully", 201);
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

// Cập nhật khuyến mãi
exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid collection id", 400);
    const collection = await collectionModel.update(id, req.body);
    return ok(res, { collection }, "Collection updated successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

// Xóa khuyến mãi
exports.delete = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid collection id", 400);
    await collectionModel.delete(id);
    return ok(res, { id }, "Collection deleted successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};
