const { ok, fail } = require("../utils/apiResponse");
const settingService = require("../services/setting.service");

function validateSettingPayload(payload) {
  const errors = [];
  const data = payload || {};

  if (data.store_name !== undefined && typeof data.store_name !== "string") {
    errors.push("store_name must be a string");
  }
  if (data.support_email !== undefined && typeof data.support_email !== "string") {
    errors.push("support_email must be a string");
  }
  if (data.support_phone !== undefined && typeof data.support_phone !== "string") {
    errors.push("support_phone must be a string");
  }
  if (data.timezone !== undefined && typeof data.timezone !== "string") {
    errors.push("timezone must be a string");
  }
  if (
    data.auto_cancel_hours !== undefined &&
    (!Number.isInteger(data.auto_cancel_hours) || data.auto_cancel_hours < 0)
  ) {
    errors.push("auto_cancel_hours must be a non-negative integer");
  }
  if (
    data.low_stock_threshold !== undefined &&
    (!Number.isInteger(data.low_stock_threshold) || data.low_stock_threshold < 0)
  ) {
    errors.push("low_stock_threshold must be a non-negative integer");
  }
  if (
    data.allow_guest_checkout !== undefined &&
    typeof data.allow_guest_checkout !== "boolean"
  ) {
    errors.push("allow_guest_checkout must be a boolean");
  }

  return errors;
}

exports.get = async (req, res) => {
  try {
    const settings = await settingService.getSettings();
    return ok(res, { settings }, "Get settings successfully");
  } catch (err) {
    return fail(res, err.message || "Internal server error", 500);
  }
};

exports.update = async (req, res) => {
  try {
    const errors = validateSettingPayload(req.body);
    if (errors.length > 0) {
      return fail(res, "Validation failed", 422, errors);
    }

    const settings = await settingService.updateSettings(req.body);
    return ok(res, { settings }, "Settings updated successfully");
  } catch (err) {
    return fail(res, err.message || "Internal server error", 500);
  }
};
