import express from "express";
import {
  getAdvancedAnalytics,
  getDashboard,
  getUsers,
  updateUserRole
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { idParamValidator } from "../validators/authValidators.js";
import { updateUserRoleValidator } from "../validators/adminValidators.js";

const router = express.Router();

router.use(protect, authorize("admin"));
router.get("/dashboard", getDashboard);
router.get("/users", getUsers);
router.patch(
  "/users/:id/role",
  idParamValidator,
  updateUserRoleValidator,
  validate,
  updateUserRole
);
router.get("/advanced-analytics", getAdvancedAnalytics);

export default router;
