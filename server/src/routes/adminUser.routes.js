const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  validateCreateUser,
} = require("../validators/auth.validator");

const {
  createUser,
  getUsers,
  getUser,
  updateUser,
  updateUserStatus,
  importStudents,
  getDevices,
  removeDevice,
} = require("../controllers/adminUser.controller");

const router = express.Router();

// GET all users (with optional query filters: role_id, status, search)
router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  getUsers
);

// GET single user by ID
router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  getUser
);

// POST create user (Student role_id=3, Instructor role_id=2, etc.)
router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  validateCreateUser,
  createUser
);

// POST bulk import students from validated CSV rows
router.post(
  "/students/import",
  authenticate,
  authorizeRoles("ADMIN"),
  importStudents
);

// PUT update user profile
router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  updateUser
);

// PATCH update user status (ACTIVE, INACTIVE, SUSPENDED)
router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("ADMIN"),
  updateUserStatus
);

// GET user devices
router.get(
  "/:id/devices",
  authenticate,
  authorizeRoles("ADMIN"),
  getDevices
);

// DELETE/revoke user device
router.delete(
  "/:id/devices/:deviceId",
  authenticate,
  authorizeRoles("ADMIN"),
  removeDevice
);

module.exports = router;
