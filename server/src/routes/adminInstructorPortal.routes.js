const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const { getInstructorPortalView } = require("../controllers/adminInstructorPortal.controller");

const router = express.Router();

// GET /api/admin/instructors/:id/portal
// Protected for ADMIN only. Non-admin will receive 403 Forbidden.
router.get(
  "/instructors/:id/portal",
  authenticate,
  authorizeRoles("ADMIN"),
  getInstructorPortalView
);

module.exports = router;
