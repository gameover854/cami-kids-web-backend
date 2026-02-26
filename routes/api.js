const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const productController = require("../controllers/productController");
const promotionController = require("../controllers/promotionController");
const brandController = require("../controllers/brandController");
const uploadController = require("../controllers/uploadController");
const collectionController = require("../controllers/collectionController");
const orderController = require("../controllers/orderController");
const authController = require("../controllers/authController");
const { requireAuth, requireRole } = require("../middlewares/auth");
const {
  validateProductPayload,
  validateCategoryPayload,
  validateUploadPayload,
  validateBrandPayload,
  validateCollectionPayload,
  validatePromotionPayload,
  validateLoginPayload,
  validateOrderStatusPayload,
  validateOrderPaymentPayload,
} = require("../middlewares/validateRequest");

router.post("/auth/login", validateLoginPayload, authController.login);
router.get("/auth/me", requireAuth, authController.me);

router.get("/categories", requireAuth, requireRole("admin"), categoryController.getAll);
router.get("/categories/:id", requireAuth, requireRole("admin"), categoryController.getById);
router.post("/categories", requireAuth, requireRole("admin"), validateCategoryPayload, categoryController.create);
router.put("/categories/:id", requireAuth, requireRole("admin"), validateCategoryPayload, categoryController.update);
router.delete("/categories/:id", requireAuth, requireRole("admin"), categoryController.delete);

router.get("/products", requireAuth, requireRole("admin"), productController.getAll);
router.get("/products/:id", requireAuth, requireRole("admin"), productController.getById);
router.post("/products", requireAuth, requireRole("admin"), validateProductPayload, productController.create);
router.put("/products/:id", requireAuth, requireRole("admin"), validateProductPayload, productController.update);
router.delete("/products/:id", requireAuth, requireRole("admin"), productController.delete);

router.get("/promotions", requireAuth, requireRole("admin"), promotionController.getAll);
router.get("/promotions/:id", requireAuth, requireRole("admin"), promotionController.getById);
router.post("/promotions", requireAuth, requireRole("admin"), validatePromotionPayload, promotionController.create);
router.put("/promotions/:id", requireAuth, requireRole("admin"), validatePromotionPayload, promotionController.update);
router.delete("/promotions/:id", requireAuth, requireRole("admin"), promotionController.delete);

router.get("/brands", requireAuth, requireRole("admin"), brandController.getAll);
router.get("/brands/:id", requireAuth, requireRole("admin"), brandController.getById);
router.post("/brands", requireAuth, requireRole("admin"), validateBrandPayload, brandController.create);
router.put("/brands/:id", requireAuth, requireRole("admin"), validateBrandPayload, brandController.update);
router.delete("/brands/:id", requireAuth, requireRole("admin"), brandController.delete);

router.get("/collections", requireAuth, requireRole("admin"), collectionController.getAll);
router.get("/collections/:id", requireAuth, requireRole("admin"), collectionController.getById);
router.post("/collections", requireAuth, requireRole("admin"), validateCollectionPayload, collectionController.create);
router.put("/collections/:id", requireAuth, requireRole("admin"), validateCollectionPayload, collectionController.update);
router.delete("/collections/:id", requireAuth, requireRole("admin"), collectionController.delete);

// router.post(
//   "/upload/single",
//   upload.single("file"),
//   uploadController.uploadSingleImage
// );

router.post("/upload/multiple", requireAuth, requireRole("admin"), validateUploadPayload, uploadController.uploadMultiple);

router.get("/orders", requireAuth, requireRole("admin"), orderController.getAll);
router.get("/orders/:id", requireAuth, requireRole("admin"), orderController.getById);
router.put(
  "/orders/:id/status",
  requireAuth,
  requireRole("admin"),
  validateOrderStatusPayload,
  orderController.updateStatus,
);
router.put(
  "/orders/:id/payment",
  requireAuth,
  requireRole("admin"),
  validateOrderPaymentPayload,
  orderController.updatePayment,
);

module.exports = router;
