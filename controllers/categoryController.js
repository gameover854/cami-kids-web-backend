const categoryModel = require("../models/categoryModel");
const { ok, fail, handlePrismaError } = require("../utils/apiResponse");

// Lấy danh sách danh mục
exports.getAll = async (req, res) => {
  try {
    const categories = await categoryModel.findAll();
    return ok(res, { categories }, "Get categories successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

// Lấy một danh mục theo ID
exports.getById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid category id", 400);
    const category = await categoryModel.findById(id);
    if (!category) return fail(res, "Category not found", 404);
    return ok(res, { category }, "Get category successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

// Tạo mới danh mục
exports.create = async (req, res) => {
  try {
    const newcategory = await categoryModel.create(req.body);
    return ok(res, { category: newcategory }, "Category created successfully", 201);
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

// Cập nhật danh mục
exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid category id", 400);
    const updatedcategory = await categoryModel.update(id, req.body);
    return ok(res, { category: updatedcategory }, "Category updated successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

// Xóa danh mục
exports.delete = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid category id", 400);
    await categoryModel.delete(id);
    return ok(res, { id }, "Category deleted successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};
