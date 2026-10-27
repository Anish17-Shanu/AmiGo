import express from "express";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist
} from "../controllers/wishlistController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import {
  addToWishlistValidator,
  wishlistProductParamValidator
} from "../validators/wishlistValidators.js";

const router = express.Router();

router.use(protect);
router.get("/", getWishlist);
router.post("/", addToWishlistValidator, validate, addToWishlist);
router.delete("/:productId", wishlistProductParamValidator, validate, removeFromWishlist);

export default router;
