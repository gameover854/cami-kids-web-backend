function errorHandler(err, req, res, next) {
  const message = err?.message || "Unknown error";
  if (req?.requestId) {
    console.error(`[${req.requestId}]`, err);
  } else {
    console.error(err);
  }
  return res.status(500).json({
    success: false,
    message: "Server Error",
    errors: [message],
    requestId: req?.requestId || null,
  });
}

module.exports = { errorHandler };
