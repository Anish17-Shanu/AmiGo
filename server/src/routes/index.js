import express from "express";
import { StatusCodes } from "http-status-codes";
import authRoutes from "./authRoutes.js";
import productRoutes from "./productRoutes.js";
import cartRoutes from "./cartRoutes.js";
import wishlistRoutes from "./wishlistRoutes.js";
import orderRoutes from "./orderRoutes.js";
import adminRoutes from "./adminRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";
import { isDbReady } from "../config/db.js";

const router = express.Router();

router.get("/health", (_req, res) =>
  res.json({
    success: true,
    status: "ok",
    db: isDbReady() ? "up" : "down",
    uptime: Math.round(process.uptime())
  })
);

router.get("/health/ready", (_req, res) => {
  const ready = isDbReady();
  return res.status(ready ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE).json({
    success: ready,
    status: ready ? "ready" : "not_ready",
    db: ready ? "up" : "down"
  });
});

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/orders", orderRoutes);
router.use("/admin", adminRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
