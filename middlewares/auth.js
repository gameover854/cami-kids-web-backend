const jwt = require("jsonwebtoken");
const { fail } = require("../utils/apiResponse");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return fail(res, "Unauthorized", 401, ["Missing bearer token"]);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return fail(res, "JWT_SECRET is missing", 500);
  }

  try {
    const payload = jwt.verify(token, secret);
    req.user = payload;
    return next();
  } catch (err) {
    return fail(res, "Unauthorized", 401, ["Invalid or expired token"]);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role) {
      return fail(res, "Forbidden", 403, ["Missing user role"]);
    }
    if (!roles.includes(req.user.role)) {
      return fail(res, "Forbidden", 403, ["You do not have permission"]);
    }
    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
