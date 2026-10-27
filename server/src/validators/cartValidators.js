import { body, param } from "express-validator";

export const addToCartValidator = [
  body("productId").isMongoId().withMessage("A valid productId is required"),
  body("quantity").optional().isInt({ min: 1, max: 99 }).withMessage("Quantity must be 1-99").toInt()
];

export const updateCartItemValidator = [
  param("productId").isMongoId().withMessage("Invalid productId"),
  body("quantity").isInt({ min: 0, max: 99 }).withMessage("Quantity must be 0-99").toInt()
];

export const productIdParamValidator = [
  param("productId").isMongoId().withMessage("Invalid productId")
];
