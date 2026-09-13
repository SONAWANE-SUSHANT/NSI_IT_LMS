const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const profileController = require("../controllers/profile.controller");

const router = express.Router();

// Protect all profile endpoints with authentication
router.use(authenticate);

// GET /api/profile
router.get("/", profileController.getMyProfile);

// PUT & PATCH /api/profile
router.put("/", profileController.updateMyProfile);
router.patch("/", profileController.updateMyProfile);

// PUT & PATCH /api/profile/photo
router.put("/photo", profileController.uploadMyPhoto);
router.patch("/photo", profileController.uploadMyPhoto);

module.exports = router;
