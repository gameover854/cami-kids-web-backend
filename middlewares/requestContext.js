const crypto = require("crypto");

function requestContext(req, res, next) {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}

function requestLogger(req, res, next) {
  const startedAt = Date.now();
  res.on("finish", () => {
    const elapsed = Date.now() - startedAt;
    console.log(
      `[${req.requestId}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${elapsed}ms)`,
    );
  });
  next();
}

module.exports = {
  requestContext,
  requestLogger,
};
