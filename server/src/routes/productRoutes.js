import express from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listCategories,
  listProducts,
  updateProduct
} from "../controllers/productController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { createProductValidator, updateProductValidator } from "../validators/productValidators.js";
import { idParamValidator } from "../validators/authValidators.js";

const router = express.Router();

router.get("/", listProducts);
router.get("/categories", listCategories);
router.get("/:id", idParamValidator, validate, getProductById);
router.post("/", protect, authorize("admin"), createProductValidator, validate, createProduct);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  idParamValidator,
  updateProductValidator,
  validate,
  updateProduct
);
router.delete("/:id", protect, authorize("admin"), idParamValidator, validate, deleteProduct);

export default router;
