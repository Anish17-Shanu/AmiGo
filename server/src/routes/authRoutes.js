import express from "express";
import { login, profile, register } from "../controllers/authController.js";
import { validate } from "../middleware/validateMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import { loginValidator, registerValidator } from "../validators/authValidators.js";

const router = express.Router();

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.get("/me", protect, profile);

export default router;
