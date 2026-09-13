const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const { getSettings, updateSettings } = require("../controllers/adminSetting.controller");

const router = express.Router();

// All settings routes require Admin authentication
router.use(authenticate);
router.use(authorizeRoles("ADMIN"));

router.get("/", getSettings);
router.put("/", updateSettings);

module.exports = router;
