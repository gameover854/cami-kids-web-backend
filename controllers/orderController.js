const orderModel = require("../models/orderModel");
const { ok, fail, handlePrismaError } = require("../utils/apiResponse");

exports.create = async (req, res) => {
  try {
    const order = await orderModel.createOrderWithPayment(req.body);
    return ok(res, { order }, "Order created successfully", 201);
  } catch (err) {
    if (err.message === "Variant not found") {
      return fail(res, "Variant not found", 404);
    }
    if (err.message === "Insufficient stock") {
      return fail(res, "Insufficient stock", 409);
    }
    if (err.message === "Payment amount cannot exceed order total amount") {
      return fail(res, "Payment amount cannot exceed order total amount", 422);
    }
    return handlePrismaError(res, err);
  }
};

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
    if (err.message === "Order not found") {
      return fail(res, "Order not found", 404);
    }
    if (err.message === "Invalid order status transition") {
      return fail(res, "Invalid order status transition", 409);
    }
    if (err.message === "Insufficient stock for order completion") {
      return fail(res, "Insufficient stock for order completion", 409);
    }
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
    if (err.message === "Order not found") {
      return fail(res, "Order not found", 404);
    }
    if (err.message === "amount, method, status are required for new payment") {
      return fail(res, "amount, method, status are required for new payment", 422);
    }
    if (err.message === "method must be a non-empty string") {
      return fail(res, "method must be a non-empty string", 422);
    }
    if (err.message === "status must be a non-empty string") {
      return fail(res, "status must be a non-empty string", 422);
    }
    if (err.message === "payment amount cannot exceed order total amount") {
      return fail(res, "payment amount cannot exceed order total amount", 422);
    }
    if (err.message === "Invalid payment method") {
      return fail(res, "Invalid payment method", 422);
    }
    if (err.message === "Invalid payment status") {
      return fail(res, "Invalid payment status", 422);
    }
    return handlePrismaError(res, err);
  }
};
