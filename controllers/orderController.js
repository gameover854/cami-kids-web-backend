const orderModel = require("../models/orderModel");
const { ok, fail, handlePrismaError } = require("../utils/apiResponse");

exports.getAll = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const filters = req.query.filters || {};

    const { orders, totalOrder, totalPage } = await orderModel.findAll(
      page,
      limit,
      filters,
    );

    return ok(
      res,
      {
        orders,
        totalOrder,
        totalPage,
      },
      "Get orders successfully",
    );
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid order id", 400);

    const order = await orderModel.findById(id);
    if (!order) return fail(res, "Order not found", 404);

    return ok(res, { order }, "Get order successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid order id", 400);

    const updatedOrder = await orderModel.updateStatus(id, req.body.status);
    return ok(res, { order: updatedOrder }, "Order status updated successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid order id", 400);

    const payment = await orderModel.updatePayment(id, req.body);
    return ok(res, { payment }, "Order payment updated successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};
