const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const {
  getUserDeviceList,
  removeUserDevice,
} = require("../controllers/adminUser.controller");

const router = express.Router();

// Mounted at /api/admin/users. Admin can view/revoke devices only.
router.get(
  "/:id/devices",
  authenticate,
  authorizeRoles("ADMIN"),
  getUserDeviceList
);

router.delete(
  "/:id/devices/:deviceId",
  authenticate,
  authorizeRoles("ADMIN"),
  removeUserDevice
);

module.exports = router;
