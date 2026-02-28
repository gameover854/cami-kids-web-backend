const express = require("express");
const router = express.Router();
const publicRouter = require("./public");
const adminRouter = require("./admin");
const { requireAuth, requireRole } = require("../middlewares/auth");

router.use(publicRouter);
router.use(requireAuth, requireRole("admin"), adminRouter);

module.exports = router;
