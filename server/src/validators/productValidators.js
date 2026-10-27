import { body } from "express-validator";

const tagsValidator = body("tags")
  .optional()
  .isArray({ max: 20 })
  .withMessage("Tags must be an array of at most 20 values")
  .custom((tags) => !tags || tags.every((tag) => typeof tag === "string" && tag.trim().length > 0));

export const createProductValidator = [
  body("title").trim().isLength({ min: 2, max: 140 }),
  body("category").trim().isLength({ min: 2, max: 80 }),
  body("price").isFloat({ min: 0 }),
  body("inventory").isInt({ min: 0 }),
  body("description").optional().trim().isLength({ max: 2000 }),
  body("imageUrl").optional().isURL({ require_protocol: true }),
  tagsValidator
];

export const updateProductValidator = [
  body("title").optional().trim().isLength({ min: 2, max: 140 }),
  body("category").optional().trim().isLength({ min: 2, max: 80 }),
  body("price").optional().isFloat({ min: 0 }),
  body("inventory").optional().isInt({ min: 0 }),
  body("description").optional().trim().isLength({ max: 2000 }),
  body("imageUrl").optional().isURL({ require_protocol: true }),
  tagsValidator
];
