import express from "express";
import { personalizedRecommendations } from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/recommendations", protect, personalizedRecommendations);

export default router;
