import express from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct
} from "../controllers/productController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { createProductValidator, updateProductValidator } from "../validators/productValidators.js";

const router = express.Router();

router.get("/", listProducts);
router.get("/:id", getProductById);
router.post("/", protect, authorize("admin"), createProductValidator, validate, createProduct);
router.put("/:id", protect, authorize("admin"), updateProductValidator, validate, updateProduct);
router.delete("/:id", protect, authorize("admin"), deleteProduct);

export default router;
