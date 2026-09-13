const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const announcementController = require("../controllers/announcement.controller");

const router = express.Router();

// Protect all admin announcement routes
router.use(authenticate, authorizeRoles("ADMIN"));

router.post("/", announcementController.createAnnouncement);
router.get("/", announcementController.getAdminAnnouncements);
router.get("/:id", announcementController.getAnnouncementById);
router.put("/:id", announcementController.updateAnnouncement);
router.patch("/:id/publish", announcementController.publishAnnouncement);
router.put("/:id/publish", announcementController.publishAnnouncement);
router.patch("/:id/archive", announcementController.archiveAnnouncement);
router.put("/:id/archive", announcementController.archiveAnnouncement);
router.delete("/:id", announcementController.deleteAnnouncement);

module.exports = router;
