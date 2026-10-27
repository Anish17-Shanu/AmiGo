import { body, param } from "express-validator";

export const addToWishlistValidator = [
  body("productId").isMongoId().withMessage("A valid productId is required")
];

export const wishlistProductParamValidator = [
  param("productId").isMongoId().withMessage("Invalid productId")
];
