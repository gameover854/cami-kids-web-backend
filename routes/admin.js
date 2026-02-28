const express = require("express");
const categoryController = require("../controllers/categoryController");
const productController = require("../controllers/productController");
const promotionController = require("../controllers/promotionController");
const brandController = require("../controllers/brandController");
const uploadController = require("../controllers/uploadController");
const collectionController = require("../controllers/collectionController");
const orderController = require("../controllers/orderController");
const {
  validateProductPayload,
  validateCategoryPayload,
  validateUploadPayload,
  validateBrandPayload,
  validateCollectionPayload,
  validatePromotionPayload,
  validateOrderStatusPayload,
  validateOrderPaymentPayload,
} = require("../middlewares/validateRequest");

const router = express.Router();

router.get("/categories", categoryController.getAll);
router.get("/categories/:id", categoryController.getById);
router.post("/categories", validateCategoryPayload, categoryController.create);
router.put("/categories/:id", validateCategoryPayload, categoryController.update);
router.delete("/categories/:id", categoryController.delete);

router.get("/products", productController.getAll);
router.get("/products/:id", productController.getById);
router.post("/products", validateProductPayload, productController.create);
router.put("/products/:id", validateProductPayload, productController.update);
router.delete("/products/:id", productController.delete);

router.get("/promotions", promotionController.getAll);
router.get("/promotions/:id", promotionController.getById);
router.post("/promotions", validatePromotionPayload, promotionController.create);
router.put("/promotions/:id", validatePromotionPayload, promotionController.update);
router.delete("/promotions/:id", promotionController.delete);

router.get("/brands", brandController.getAll);
router.get("/brands/:id", brandController.getById);
router.post("/brands", validateBrandPayload, brandController.create);
router.put("/brands/:id", validateBrandPayload, brandController.update);
router.delete("/brands/:id", brandController.delete);

router.get("/collections", collectionController.getAll);
router.get("/collections/:id", collectionController.getById);
router.post("/collections", validateCollectionPayload, collectionController.create);
router.put("/collections/:id", validateCollectionPayload, collectionController.update);
router.delete("/collections/:id", collectionController.delete);

router.post("/upload/multiple", validateUploadPayload, uploadController.uploadMultiple);

router.get("/orders", orderController.getAll);
router.get("/orders/:id", orderController.getById);
router.put("/orders/:id/status", validateOrderStatusPayload, orderController.updateStatus);
router.put("/orders/:id/payment", validateOrderPaymentPayload, orderController.updatePayment);

module.exports = router;
