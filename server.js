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

const allowedOrigins = [
  process.env.CORS_ORIGIN || "http://localhost:3000",
];
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
    origin: allowedOrigins,
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
