function ok(res, data = null, message = "OK", status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

function fail(res, message = "Bad Request", status = 400, errors = null) {
  const requestId = res?.req?.requestId || null;
  return res.status(status).json({
    success: false,
    message,
    errors,
    requestId,
  });
}

function handlePrismaError(res, err) {
  if (!err || typeof err !== "object") {
    return fail(res, "Internal server error", 500);
  }

  switch (err.code) {
    case "P2002":
      return fail(res, "Duplicated value", 409, [err.meta?.target || "unique"]);
    case "P2003":
      return fail(res, "Foreign key constraint failed", 409, [err.meta?.field_name || "foreign_key"]);
    case "P2011":
      return fail(res, "Required field is missing", 422);
    case "P2025":
      return fail(res, "Record not found", 404);
    default:
      return fail(res, err.message || "Internal server error", 500);
  }
}

module.exports = {
  ok,
  fail,
  handlePrismaError,
};
