import { body } from "express-validator";

export const createProductValidator = [
  body("title").trim().notEmpty(),
  body("category").trim().notEmpty(),
  body("price").isFloat({ min: 0 }),
  body("inventory").isInt({ min: 0 })
];

export const updateProductValidator = [
  body("title").optional().trim().notEmpty(),
  body("category").optional().trim().notEmpty(),
  body("price").optional().isFloat({ min: 0 }),
  body("inventory").optional().isInt({ min: 0 })
];
