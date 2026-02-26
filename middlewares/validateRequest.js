const { fail } = require("../utils/apiResponse");

function validateProductPayload(req, res, next) {
  const payload = req.body || {};
  const product = payload.product || payload;
  const isCreate = req.method === "POST";
  const errors = [];

  if (isCreate && (!product.name || typeof product.name !== "string")) {
    errors.push("product.name is required and must be a string");
  }
  if (
    isCreate &&
    (!Number.isInteger(product.selling_price) || product.selling_price < 0)
  ) {
    errors.push("product.selling_price must be a non-negative integer");
  }
  if (
    !isCreate &&
    product.selling_price !== undefined &&
    (!Number.isInteger(product.selling_price) || product.selling_price < 0)
  ) {
    errors.push("product.selling_price must be a non-negative integer");
  }
  if (
    product.compare_price !== undefined &&
    (!Number.isInteger(product.compare_price) || product.compare_price < 0)
  ) {
    errors.push("product.compare_price must be a non-negative integer");
  }
  if (isCreate && typeof product.is_active !== "boolean") {
    errors.push("product.is_active must be a boolean");
  }
  if (
    !isCreate &&
    product.is_active !== undefined &&
    typeof product.is_active !== "boolean"
  ) {
    errors.push("product.is_active must be a boolean");
  }
  if (payload.attributes !== undefined && !Array.isArray(payload.attributes)) {
    errors.push("attributes must be an array");
  }
  if (payload.variants !== undefined && !Array.isArray(payload.variants)) {
    errors.push("variants must be an array");
  }
  if (payload.images !== undefined && !Array.isArray(payload.images)) {
    errors.push("images must be an array");
  }

  if (errors.length > 0) {
    return fail(res, "Validation failed", 422, errors);
  }
  return next();
}

function validateCategoryPayload(req, res, next) {
  const { name, parent_id, brand_id } = req.body || {};
  const isCreate = req.method === "POST";
  const errors = [];

  if (isCreate && (!name || typeof name !== "string")) {
    errors.push("name is required and must be a string");
  }
  if (!isCreate && name !== undefined && typeof name !== "string") {
    errors.push("name must be a string");
  }
  if (parent_id !== undefined && parent_id !== null && !Number.isInteger(parent_id)) {
    errors.push("parent_id must be an integer or null");
  }
  if (brand_id !== undefined && brand_id !== null && !Number.isInteger(brand_id)) {
    errors.push("brand_id must be an integer or null");
  }

  if (errors.length > 0) {
    return fail(res, "Validation failed", 422, errors);
  }
  return next();
}

function validateUploadPayload(req, res, next) {
  const files = req.body?.files;
  const errors = [];

  if (!Array.isArray(files) || files.length === 0) {
    errors.push("files is required and must be a non-empty array");
  }
  if (Array.isArray(files) && files.some((file) => typeof file !== "string")) {
    errors.push("every file must be a base64 string");
  }

  if (errors.length > 0) {
    return fail(res, "Validation failed", 422, errors);
  }
  return next();
}

module.exports = {
  validateProductPayload,
  validateCategoryPayload,
  validateUploadPayload,
};
