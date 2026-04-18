import express from "express";
import {
  checkout,
  listAllOrders,
  listMyOrders,
  listTrendingProducts,
  updateOrderStatus
} from "../controllers/orderController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { updateOrderStatusValidator } from "../validators/orderValidators.js";

const router = express.Router();

router.post("/checkout", protect, checkout);
router.get("/my", protect, listMyOrders);
router.get("/trending", listTrendingProducts);
router.get("/", protect, authorize("admin"), listAllOrders);
router.patch("/:id/status", protect, authorize("admin"), updateOrderStatusValidator, validate, updateOrderStatus);

export default router;
