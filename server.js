require("dotenv").config();
const express = require("express");
const cors = require("cors");
const routes = require("./routes/api");
const { errorHandler } = require("./middlewares/errorHandler");
const app = express();
const port = Number(process.env.PORT || 3001);

const allowedOrigins = [
  process.env.CORS_ORIGIN || "http://localhost:3000",
];

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
