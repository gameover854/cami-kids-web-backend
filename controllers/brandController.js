// controllers/BrandController.js
const brandModel = require("../models/brandModel.js");
const { ok, fail } = require("../utils/apiResponse");

// Lấy danh sách thương hiệu
exports.getAll = async (req, res) => {
  try {
    const brands = await brandModel.findAll();
    return ok(res, { brands }, "Get brands successfully");
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

// Lấy một thương hiệu theo ID
exports.getById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid brand id", 400);
    const brand = await brandModel.findById(id);
    if (!brand) return fail(res, "Brand not found", 404);
    return ok(res, { brand }, "Get brand successfully");
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

// Tạo mới thương hiệu
exports.create = async (req, res) => {
  try {
    const newBrand = await brandModel.create(req.body);
    return ok(res, { brand: newBrand }, "Brand created successfully", 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

// Cập nhật thương hiệu
exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid brand id", 400);
    const updatedBrand = await brandModel.update(id, req.body);
    return ok(res, { brand: updatedBrand }, "Brand updated successfully");
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

// Xóa thương hiệu
exports.delete = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid brand id", 400);
    await brandModel.delete(id);
    return ok(res, { id }, "Brand deleted successfully");
  } catch (err) {
    return fail(res, err.message, 500);
  }
};
