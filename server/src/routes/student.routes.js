const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const studentController = require("../controllers/student.controller");
const progressController = require("../controllers/progress.controller");

const router = express.Router();

// Protect all student endpoints
router.use(authenticate, authorizeRoles("STUDENT", "ADMIN"));

// Get batches the logged-in student is enrolled in
router.get("/my-batches", studentController.getMyBatches);

// Get curriculum (modules, lectures, notes) for an enrolled batch
router.get("/batches/:batchId/content", studentController.getBatchCourseContent);

// Get upcoming live sessions for the student
router.get("/upcoming-sessions", studentController.getUpcomingSessions);

// Session Tracking & Course Progress routes
router.post("/sessions/:sessionId/access", progressController.recordSessionAccess);
router.post("/sessions/:sessionId/complete", progressController.completeSession);
router.get("/sessions/:sessionId/progress", progressController.getSessionProgress);
router.get("/courses/:courseId/progress", progressController.getCourseProgress);
router.get("/progress", progressController.getAllStudentProgress);

// Student Announcements
const announcementController = require("../controllers/announcement.controller");
router.get("/announcements", announcementController.getStudentAnnouncements);
router.get("/announcements/:id", announcementController.getStudentAnnouncementById);

// Student Notifications
const notificationController = require("../controllers/notification.controller");
router.get("/notifications", notificationController.getMyNotifications);
router.get("/notifications/unread-count", notificationController.getUnreadCount);
router.patch("/notifications/read-all", notificationController.markAllAsRead);
router.put("/notifications/read-all", notificationController.markAllAsRead);
router.patch("/notifications/:id/read", notificationController.markAsRead);
router.put("/notifications/:id/read", notificationController.markAsRead);

// Student Course Reviews & Ratings
const courseReviewController = require("../controllers/courseReview.controller");
router.post("/courses/:courseId/reviews", courseReviewController.createReview);
router.get("/courses/:courseId/reviews/me", courseReviewController.getMyReview);
router.put("/courses/:courseId/reviews/me", courseReviewController.updateMyReview);
router.patch("/courses/:courseId/reviews/me", courseReviewController.updateMyReview);
router.delete("/courses/:courseId/reviews/me", courseReviewController.deleteMyReview);

module.exports = router;


