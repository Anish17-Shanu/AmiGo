import express from "express";
import {
  getAdvancedAnalytics,
  getDashboard,
  getUsers,
  updateUserRole
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));
router.get("/dashboard", getDashboard);
router.get("/users", getUsers);
router.patch("/users/:id/role", updateUserRole);
router.get("/advanced-analytics", getAdvancedAnalytics);

export default router;
