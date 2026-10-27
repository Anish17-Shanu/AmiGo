import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItem
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import {
  addToCartValidator,
  productIdParamValidator,
  updateCartItemValidator
} from "../validators/cartValidators.js";

const router = express.Router();

router.use(protect);
router.get("/", getCart);
router.post("/", addToCartValidator, validate, addToCart);
router.patch("/:productId", updateCartItemValidator, validate, updateCartItem);
router.delete("/:productId", productIdParamValidator, validate, removeFromCart);

export default router;
