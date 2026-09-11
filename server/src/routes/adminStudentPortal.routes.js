const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const { getStudentPortalView } = require("../controllers/adminStudentPortal.controller");

const router = express.Router();

// GET /api/admin/students/:id/portal
// Protected for ADMIN only. Non-admin will receive 403 Forbidden.
router.get(
  "/students/:id/portal",
  authenticate,
  authorizeRoles("ADMIN"),
  getStudentPortalView
);

module.exports = router;
