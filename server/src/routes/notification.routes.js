const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const notificationController = require("../controllers/notification.controller");

const router = express.Router();

// Protect all notification routes
router.use(authenticate);

router.get("/", notificationController.getMyNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.patch("/read-all", notificationController.markAllAsRead);
router.put("/read-all", notificationController.markAllAsRead);
router.patch("/:id/read", notificationController.markAsRead);
router.put("/:id/read", notificationController.markAsRead);

module.exports = router;
