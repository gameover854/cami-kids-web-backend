function errorHandler(err, req, res, next) {
  const message = err?.message || "Unknown error";
  return res.status(500).json({
    success: false,
    message: "Server Error",
    errors: [message],
  });
}

module.exports = { errorHandler };
