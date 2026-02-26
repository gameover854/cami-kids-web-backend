const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const productController = require("../controllers/productController");
const promotionController = require("../controllers/promotionController");
const brandController = require("../controllers/brandController");
const uploadController = require("../controllers/uploadController");
const collectionController = require("../controllers/collectionController");
const {
  validateProductPayload,
  validateCategoryPayload,
  validateUploadPayload,
} = require("../middlewares/validateRequest");

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
router.post("/promotions", promotionController.create);
router.put("/promotions/:id", promotionController.update);
router.delete("/promotions/:id", promotionController.delete);

router.get("/brands", brandController.getAll);
router.get("/brands/:id", brandController.getById);
router.post("/brands", brandController.create);
router.put("/brands/:id", brandController.update);
router.delete("/brands/:id", brandController.delete);

router.get("/collections", collectionController.getAll);
router.get("/collections/:id", collectionController.getById);
router.post("/collections", collectionController.create);
router.put("/collections/:id", collectionController.update);
router.delete("/collections/:id", collectionController.delete);

// router.post(
//   "/upload/single",
//   upload.single("file"),
//   uploadController.uploadSingleImage
// );

router.post("/upload/multiple", validateUploadPayload, uploadController.uploadMultiple);

module.exports = router;
