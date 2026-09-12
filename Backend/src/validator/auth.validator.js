
import { body } from "express-validator";

export const registerValidator = [
  // Username
  body("userName")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be between 3 and 20 characters")
    .matches(/^[a-zA-Z0-9_ ]+$/)
    .withMessage(
      "Username can only contain letters, numbers, spaces and underscores"
    ),

  // Email
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  // Password
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 30 })
    .withMessage("Password must be between 8 and 30 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain at least one special character"),

  // Confirm Password
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((confirmPassword, { req }) => {
      if (confirmPassword !== req.body.password) {
        throw new Error("Passwords do not match");
      }

      return true;
    }),
];

export const loginValidator = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please enter a valid email")
        .normalizeEmail(),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
];



