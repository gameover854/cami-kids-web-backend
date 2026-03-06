const dashboardModel = require("../models/dashboardModel");
const { ok, handlePrismaError } = require("../utils/apiResponse");

exports.getSummary = async (req, res) => {
  try {
    const summary = await dashboardModel.getSummary();
    return ok(res, { summary }, "Get dashboard summary successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};
