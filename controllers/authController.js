const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { ok, fail, handlePrismaError } = require("../utils/apiResponse");

function isBcryptHash(value) {
  return typeof value === "string" && value.startsWith("$2");
}

async function hashPassword(plainPassword) {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
  return bcrypt.hash(plainPassword, saltRounds);
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return fail(res, "Email and password are required", 422, [
        "email is required",
        "password is required",
      ]);
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return fail(res, "Invalid credentials", 401);
    }
    if (user.role !== "admin") {
      return fail(res, "Forbidden", 403, ["Only admin can login"]);
    }

    let validPassword = false;
    if (isBcryptHash(user.password)) {
      validPassword = await bcrypt.compare(password, user.password);
    } else {
      // Backward compatibility for old seeded users using plain password.
      validPassword = password === user.password;
    }

    if (!validPassword) {
      return fail(res, "Invalid credentials", 401);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return fail(res, "JWT_SECRET is missing", 500);
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" },
    );

    return ok(
      res,
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      "Login successful",
    );
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

exports.register = async (req, res) => {
  try {
    const { email, password, name, phone } = req.body || {};

    const existedUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existedUser) {
      return fail(res, "Email already exists", 409, ["email is already in use"]);
    }

    const hashedPassword = await hashPassword(password);
    const createdUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        phone: phone || null,
        role: "customer",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
      },
    });

    return ok(res, { user: createdUser }, "Register successful", 201);
  } catch (err) {
    return handlePrismaError(res, err);
  }
};

exports.me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
      },
    });

    if (!user) return fail(res, "User not found", 404);
    return ok(res, { user }, "Get profile successfully");
  } catch (err) {
    return handlePrismaError(res, err);
  }
};
