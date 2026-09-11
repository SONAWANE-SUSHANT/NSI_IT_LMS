const express = require("express");

const router = express.Router();

const courseModuleController = require("../controllers/courseModule.controller");
const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  createModuleValidator,
  updateModuleValidator,
  moduleIdValidator,
  courseIdValidator,
  updateModuleStatusValidator,
  updateModuleOrderValidator,
} = require("../validators/courseModule.validator");

const auth = [authenticate, authorizeRoles("ADMIN", "INSTRUCTOR")];

// Create module
router.post(
  "/courses/:courseId/modules",
  auth,
  createModuleValidator,
  courseModuleController.createModule
);

// Get all modules of a course
router.get(
  "/courses/:courseId/modules",
  auth,
  courseIdValidator,
  courseModuleController.getModulesByCourse
);

// Get single module
router.get(
  "/modules/:moduleId",
  auth,
  moduleIdValidator,
  courseModuleController.getModuleById
);

// Update module
router.put(
  "/modules/:moduleId",
  auth,
  updateModuleValidator,
  courseModuleController.updateModule
);

// Update module status
router.patch(
  "/modules/:moduleId/status",
  auth,
  updateModuleStatusValidator,
  courseModuleController.updateModuleStatus
);

// Change module order
router.patch(
  "/modules/:moduleId/order",
  auth,
  updateModuleOrderValidator,
  courseModuleController.updateModuleOrder
);

// Archive module
router.delete(
  "/modules/:moduleId",
  auth,
  moduleIdValidator,
  courseModuleController.deleteModule
);

module.exports = router;