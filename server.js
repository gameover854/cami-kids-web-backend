require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const routes = require("./routes/api");
const { errorHandler } = require("./middlewares/errorHandler");
const { requestContext, requestLogger } = require("./middlewares/requestContext");
const app = express();
const port = Number(process.env.PORT || 3001);

function parseOrigins(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getAllowedOrigins(env) {
  const legacyOrigins = parseOrigins(process.env.CORS_ORIGIN);
  if (legacyOrigins.length > 0) return legacyOrigins;

  if (env === "production") {
    return parseOrigins(process.env.CORS_ORIGINS_PROD);
  }
  if (env === "staging") {
    return parseOrigins(process.env.CORS_ORIGINS_STAGING);
  }

  const devOrigins = parseOrigins(process.env.CORS_ORIGINS_DEV);
  if (devOrigins.length > 0) return devOrigins;

  return ["http://localhost:3000"];
}

const allowedOrigins = getAllowedOrigins(process.env.NODE_ENV);
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60 * 1000),
  limit: Number(process.env.RATE_LIMIT_MAX || 200),
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(requestContext);
app.use(requestLogger);
app.use(helmet());
if (process.env.NODE_ENV !== "test") {
  app.use(limiter);
}
app.use(express.json({ limit: "5mb" }));
app.set("query parser", "extended");
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin is not allowed: ${origin}`));
    },
    credentials: true,
  }),
);

app.use("/api", routes);
app.use(errorHandler);

function startServer() {
  return app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer,
};
