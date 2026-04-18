import { body } from "express-validator";

export const createOrderValidator = [
  body("items").isArray({ min: 1 }),
  body("items.*.productId").isMongoId(),
  body("items.*.quantity").isInt({ min: 1 })
];

export const updateOrderStatusValidator = [
  body("status").isIn(["pending", "processing", "shipped", "delivered", "cancelled"])
];
