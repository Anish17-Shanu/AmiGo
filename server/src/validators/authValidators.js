import { body, param } from "express-validator";

export const registerValidator = [
  body("name").trim().isLength({ min: 2, max: 80 }).withMessage("Name must be 2-80 characters"),
  body("email").trim().isEmail().withMessage("A valid email is required"),
  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be 8-128 characters")
];

export const loginValidator = [
  body("email").trim().isEmail().withMessage("A valid email is required"),
  body("password").notEmpty().withMessage("Password is required")
];

export const idParamValidator = [param("id").isMongoId().withMessage("Invalid id")];
