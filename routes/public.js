const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middlewares/auth");
const {
  validateLoginPayload,
  validateRegisterPayload,
} = require("../middlewares/validateRequest");

const router = express.Router();

router.post("/auth/login", validateLoginPayload, authController.login);
router.post("/auth/register", validateRegisterPayload, authController.register);
router.get("/auth/me", requireAuth, authController.me);

module.exports = router;
