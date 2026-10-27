import { body } from "express-validator";

export const updateUserRoleValidator = [
  body("role").isIn(["admin", "user"]).withMessage("Role must be admin or user")
];
