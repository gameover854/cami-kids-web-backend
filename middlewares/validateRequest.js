const { fail } = require("../utils/apiResponse");
const { PAYMENT_METHODS, PAYMENT_STATUSES } = require("../constants/payment");
const { ORDER_STATUSES } = require("../constants/order");

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

function validateBrandPayload(req, res, next) {
  const { name, slug, logo, description, is_active } = req.body || {};
  const isCreate = req.method === "POST";
  const errors = [];

  if (isCreate && (!name || typeof name !== "string")) {
    errors.push("name is required and must be a string");
  }
  if (!isCreate && name !== undefined && typeof name !== "string") {
    errors.push("name must be a string");
  }
  if (slug !== undefined && slug !== null && typeof slug !== "string") {
    errors.push("slug must be a string");
  }
  if (logo !== undefined && logo !== null && typeof logo !== "string") {
    errors.push("logo must be a string");
  }
  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    errors.push("description must be a string");
  }
  if (is_active !== undefined && typeof is_active !== "boolean") {
    errors.push("is_active must be a boolean");
  }

  if (errors.length > 0) {
    return fail(res, "Validation failed", 422, errors);
  }
  return next();
}

function validateCollectionPayload(req, res, next) {
  const { name, slug, is_active } = req.body || {};
  const isCreate = req.method === "POST";
  const errors = [];

  if (isCreate && (!name || typeof name !== "string")) {
    errors.push("name is required and must be a string");
  }
  if (!isCreate && name !== undefined && typeof name !== "string") {
    errors.push("name must be a string");
  }
  if (isCreate && (!slug || typeof slug !== "string")) {
    errors.push("slug is required and must be a string");
  }
  if (!isCreate && slug !== undefined && typeof slug !== "string") {
    errors.push("slug must be a string");
  }
  if (is_active !== undefined && typeof is_active !== "boolean") {
    errors.push("is_active must be a boolean");
  }

  if (errors.length > 0) {
    return fail(res, "Validation failed", 422, errors);
  }
  return next();
}

function validatePromotionPayload(req, res, next) {
  const { code, name, type, value, start_date, end_date, is_active, collection_ids } =
    req.body || {};
  const isCreate = req.method === "POST";
  const errors = [];
  const validTypes = ["PERCENTAGE", "FIXED_AMOUNT"];

  if (isCreate && (!code || typeof code !== "string")) {
    errors.push("code is required and must be a string");
  }
  if (!isCreate && code !== undefined && typeof code !== "string") {
    errors.push("code must be a string");
  }
  if (isCreate && (!name || typeof name !== "string")) {
    errors.push("name is required and must be a string");
  }
  if (!isCreate && name !== undefined && typeof name !== "string") {
    errors.push("name must be a string");
  }
  if (isCreate && !validTypes.includes(type)) {
    errors.push("type must be PERCENTAGE or FIXED_AMOUNT");
  }
  if (!isCreate && type !== undefined && !validTypes.includes(type)) {
    errors.push("type must be PERCENTAGE or FIXED_AMOUNT");
  }
  if (isCreate && (typeof value !== "number" || Number.isNaN(value) || value < 0)) {
    errors.push("value is required and must be a non-negative number");
  }
  if (
    !isCreate &&
    value !== undefined &&
    (typeof value !== "number" || Number.isNaN(value) || value < 0)
  ) {
    errors.push("value must be a non-negative number");
  }
  if (start_date !== undefined && Number.isNaN(new Date(start_date).getTime())) {
    errors.push("start_date must be a valid datetime string");
  }
  if (end_date !== undefined && Number.isNaN(new Date(end_date).getTime())) {
    errors.push("end_date must be a valid datetime string");
  }
  if (
    start_date !== undefined &&
    end_date !== undefined &&
    !Number.isNaN(new Date(start_date).getTime()) &&
    !Number.isNaN(new Date(end_date).getTime()) &&
    new Date(end_date) < new Date(start_date)
  ) {
    errors.push("end_date must be greater than or equal to start_date");
  }
  if (is_active !== undefined && typeof is_active !== "boolean") {
    errors.push("is_active must be a boolean");
  }
  if (collection_ids !== undefined && !Array.isArray(collection_ids)) {
    errors.push("collection_ids must be an array");
  }
  if (
    Array.isArray(collection_ids) &&
    collection_ids.some((item) => !Number.isInteger(item))
  ) {
    errors.push("collection_ids must contain only integers");
  }

  if (errors.length > 0) {
    return fail(res, "Validation failed", 422, errors);
  }
  return next();
}

function validateLoginPayload(req, res, next) {
  const { email, password } = req.body || {};
  const errors = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || typeof email !== "string") {
    errors.push("email is required and must be a string");
  }
  if (typeof email === "string" && !emailRegex.test(email.trim())) {
    errors.push("email must be a valid email format");
  }
  if (!password || typeof password !== "string") {
    errors.push("password is required and must be a string");
  }

  if (errors.length > 0) {
    return fail(res, "Validation failed", 422, errors);
  }
  return next();
}

function validateRegisterPayload(req, res, next) {
  const { email, password, name, phone } = req.body || {};
  const errors = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || typeof email !== "string") {
    errors.push("email is required and must be a string");
  }
  if (typeof email === "string" && !emailRegex.test(email.trim())) {
    errors.push("email must be a valid email format");
  }
  if (!password || typeof password !== "string") {
    errors.push("password is required and must be a string");
  }
  if (typeof password === "string" && password.length < 8) {
    errors.push("password must be at least 8 characters");
  }
  if (name !== undefined && name !== null && typeof name !== "string") {
    errors.push("name must be a string");
  }
  if (phone !== undefined && phone !== null && typeof phone !== "string") {
    errors.push("phone must be a string");
  }

  if (errors.length > 0) {
    return fail(res, "Validation failed", 422, errors);
  }
  return next();
}

function validateOrderStatusPayload(req, res, next) {
  const { status } = req.body || {};
  const errors = [];

  if (!status || typeof status !== "string") {
    errors.push("status is required and must be a string");
  }
  if (status && !ORDER_STATUSES.includes(status)) {
    errors.push(`status must be one of ${ORDER_STATUSES.join(", ")}`);
  }

  if (errors.length > 0) {
    return fail(res, "Validation failed", 422, errors);
  }
  return next();
}

function validateOrderPaymentPayload(req, res, next) {
  const { amount, method, status, transaction_id } = req.body || {};
  const errors = [];

  if (
    amount !== undefined &&
    (!Number.isInteger(amount) || Number.isNaN(amount) || amount < 0)
  ) {
    errors.push("amount must be a non-negative integer");
  }
  if (method !== undefined && typeof method !== "string") {
    errors.push("method must be a string");
  }
  if (typeof method === "string" && method.trim().length === 0) {
    errors.push("method must be a non-empty string");
  }
  if (
    typeof method === "string" &&
    method.trim().length > 0 &&
    !PAYMENT_METHODS.includes(method.trim())
  ) {
    errors.push(`method must be one of ${PAYMENT_METHODS.join(", ")}`);
  }
  if (status !== undefined && typeof status !== "string") {
    errors.push("status must be a string");
  }
  if (typeof status === "string" && status.trim().length === 0) {
    errors.push("status must be a non-empty string");
  }
  if (
    typeof status === "string" &&
    status.trim().length > 0 &&
    !PAYMENT_STATUSES.includes(status.trim())
  ) {
    errors.push(`status must be one of ${PAYMENT_STATUSES.join(", ")}`);
  }
  if (transaction_id !== undefined && transaction_id !== null && typeof transaction_id !== "string") {
    errors.push("transaction_id must be a string or null");
  }
  if (
    amount === undefined &&
    method === undefined &&
    status === undefined &&
    transaction_id === undefined
  ) {
    errors.push("at least one field must be provided");
  }

  if (errors.length > 0) {
    return fail(res, "Validation failed", 422, errors);
  }
  return next();
}

function validateOrderCreatePayload(req, res, next) {
  const { items, shipping_address, user_id, payment, customer_name, customer_phone } =
    req.body || {};
  const errors = [];

  if (!Array.isArray(items) || items.length === 0) {
    errors.push("items is required and must be a non-empty array");
  }
  if (
    Array.isArray(items) &&
    items.some(
      (item) =>
        !Number.isInteger(item?.variant_id) ||
        !Number.isInteger(item?.quantity) ||
        item.quantity <= 0,
    )
  ) {
    errors.push("items must include variant_id and quantity > 0");
  }
  if (!shipping_address || typeof shipping_address !== "string") {
    errors.push("shipping_address is required and must be a string");
  }
  if (user_id !== undefined && user_id !== null && !Number.isInteger(user_id)) {
    errors.push("user_id must be an integer or null");
  }
  if (customer_name !== undefined && customer_name !== null && typeof customer_name !== "string") {
    errors.push("customer_name must be a string or null");
  }
  if (customer_phone !== undefined && customer_phone !== null && typeof customer_phone !== "string") {
    errors.push("customer_phone must be a string or null");
  }
  if (payment !== undefined && payment !== null && typeof payment !== "object") {
    errors.push("payment must be an object");
  }
  if (payment) {
    if (
      payment.amount !== undefined &&
      (!Number.isInteger(payment.amount) || payment.amount < 0)
    ) {
      errors.push("payment.amount must be a non-negative integer");
    }
    if (payment.method !== undefined && typeof payment.method !== "string") {
      errors.push("payment.method must be a string");
    }
    if (typeof payment.method === "string" && payment.method.trim().length === 0) {
      errors.push("payment.method must be a non-empty string");
    }
    if (
      typeof payment.method === "string" &&
      payment.method.trim().length > 0 &&
      !PAYMENT_METHODS.includes(payment.method.trim())
    ) {
      errors.push(`payment.method must be one of ${PAYMENT_METHODS.join(", ")}`);
    }
    if (payment.status !== undefined && typeof payment.status !== "string") {
      errors.push("payment.status must be a string");
    }
    if (typeof payment.status === "string" && payment.status.trim().length === 0) {
      errors.push("payment.status must be a non-empty string");
    }
    if (
      typeof payment.status === "string" &&
      payment.status.trim().length > 0 &&
      !PAYMENT_STATUSES.includes(payment.status.trim())
    ) {
      errors.push(`payment.status must be one of ${PAYMENT_STATUSES.join(", ")}`);
    }
    if (
      payment.transaction_id !== undefined &&
      payment.transaction_id !== null &&
      typeof payment.transaction_id !== "string"
    ) {
      errors.push("payment.transaction_id must be a string or null");
    }
  }

  if (errors.length > 0) {
    return fail(res, "Validation failed", 422, errors);
  }
  return next();
}

function validateVariantPayload(req, res, next) {
  const { sku, barcode, price, stock_quantity } = req.body || {};
  const errors = [];

  if (sku !== undefined && typeof sku !== "string") {
    errors.push("sku must be a string");
  }
  if (barcode !== undefined && typeof barcode !== "string") {
    errors.push("barcode must be a string");
  }
  if (
    price !== undefined &&
    (!Number.isInteger(price) || Number.isNaN(price) || price < 0)
  ) {
    errors.push("price must be a non-negative integer");
  }
  if (
    stock_quantity !== undefined &&
    (!Number.isInteger(stock_quantity) ||
      Number.isNaN(stock_quantity) ||
      stock_quantity < 0)
  ) {
    errors.push("stock_quantity must be a non-negative integer");
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
  validateBrandPayload,
  validateCollectionPayload,
  validatePromotionPayload,
  validateLoginPayload,
  validateRegisterPayload,
  validateOrderStatusPayload,
  validateOrderPaymentPayload,
  validateOrderCreatePayload,
  validateVariantPayload,
};
