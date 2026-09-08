const { body, param } = require("express-validator");

const createModuleValidator = [
  param("courseId")
    .isInt({ min: 1 })
    .withMessage("Course ID must be a valid positive integer"),

  body("name")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Module name cannot exceed 200 characters"),

  body("title")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Module title cannot exceed 200 characters"),

  body().custom((value, { req }) => {
    if (!req.body.name && !req.body.title) {
      throw new Error("Module name is required");
    }
    return true;
  }),

  body("duration")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 50 })
    .withMessage("Duration must not exceed 50 characters"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string"),

  body("display_order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Display order must be a non-negative integer"),
];

const updateModuleValidator = [
  param("moduleId")
    .isInt({ min: 1 })
    .withMessage("Module ID must be a valid positive integer"),

  body("name")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Module name cannot exceed 200 characters"),

  body("title")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Module title cannot exceed 200 characters"),

  body("duration")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 50 })
    .withMessage("Duration must not exceed 50 characters"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string"),

  body("display_order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Display order must be a non-negative integer"),
];

const moduleIdValidator = [
  param("moduleId")
    .isInt({ min: 1 })
    .withMessage("Module ID must be a valid positive integer"),
];

const courseIdValidator = [
  param("courseId")
    .isInt({ min: 1 })
    .withMessage("Course ID must be a valid positive integer"),
];

const updateModuleStatusValidator = [
  param("moduleId")
    .isInt({ min: 1 })
    .withMessage("Module ID must be a valid positive integer"),

  body("status")
    .isIn(["ACTIVE", "INACTIVE"])
    .withMessage("Invalid module status. Allowed: ACTIVE, INACTIVE"),
];

const updateModuleOrderValidator = [
  param("moduleId")
    .isInt({ min: 1 })
    .withMessage("Module ID must be a valid positive integer"),

  body("display_order")
    .isInt({ min: 0 })
    .withMessage("Display order must be a non-negative integer"),
];

module.exports = {
  createModuleValidator,
  updateModuleValidator,
  moduleIdValidator,
  courseIdValidator,
  updateModuleStatusValidator,
  updateModuleOrderValidator,
};