import { body } from "express-validator";

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

export const updateOrderStatusValidator = [
  body("status").isIn(ORDER_STATUSES).withMessage(`Status must be one of: ${ORDER_STATUSES.join(", ")}`)
];
