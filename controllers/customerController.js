const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { ok, fail, handlePrismaError } = require("../utils/apiResponse");

exports.getAll = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const keyword = String(req.query.keyword || "").trim();

    const where = {
      role: "customer",
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword } },
              { email: { contains: keyword } },
              { phone: { contains: keyword } },
            ],
          }
        : {}),
    };

    const customers = await prisma.user.findMany({
      where,
      skip: page === 1 ? 0 : (page - 1) * limit,
      take: limit,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        created_at: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    const totalCustomer = await prisma.user.count({ where });
    const totalPage = Math.ceil(totalCustomer / limit);

    return ok(res, { customers, totalCustomer, totalPage }, "Get customers successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid customer id", 400);

    const customer = await prisma.user.findFirst({
      where: { id, role: "customer" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            orders: true,
          },
        },
        orders: {
          take: 5,
          orderBy: { created_at: "desc" },
          select: {
            id: true,
            status: true,
            total_amount: true,
            created_at: true,
          },
        },
      },
    });

    if (!customer) return fail(res, "Customer not found", 404);
    return ok(res, { customer }, "Get customer successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body || {};
    if (!email || typeof email !== "string") {
      return fail(res, "email is required", 422, ["email must be a string"]);
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return fail(res, "password is required", 422, ["password must be at least 8 characters"]);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const customer = await prisma.user.create({
      data: {
        name: typeof name === "string" ? name.trim() : null,
        email: email.trim(),
        phone: typeof phone === "string" ? phone.trim() : null,
        password: hashedPassword,
        role: "customer",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        created_at: true,
      },
    });

    return ok(res, { customer }, "Customer created successfully", 201);
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid customer id", 400);

    const existed = await prisma.user.findFirst({
      where: { id, role: "customer" },
      select: { id: true },
    });
    if (!existed) return fail(res, "Customer not found", 404);

    const { name, phone } = req.body || {};
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(phone !== undefined ? { phone: phone === null ? null : String(phone).trim() } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        updated_at: true,
      },
    });

    return ok(res, { customer: updated }, "Customer updated successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

exports.delete = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return fail(res, "Invalid customer id", 400);

    const existed = await prisma.user.findFirst({
      where: { id, role: "customer" },
      select: { id: true },
    });
    if (!existed) return fail(res, "Customer not found", 404);

    await prisma.user.delete({ where: { id } });
    return ok(res, { id }, "Customer deleted successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};
