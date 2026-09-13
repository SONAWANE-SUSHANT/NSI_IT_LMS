const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const instructorController = require("../controllers/instructor.controller");

const router = express.Router();

// Protect all instructor endpoints
router.use(authenticate, authorizeRoles("INSTRUCTOR", "ADMIN"));

// Get batches assigned to logged-in instructor
router.get("/my-batches", instructorController.getMyBatches);

// Get student roster for a batch
router.get("/batches/:batchId/students", instructorController.getBatchStudents);

// Get course curriculum and sessions for a batch
router.get("/batches/:batchId/content", instructorController.getBatchCourseContent);

// Schedule live session for a batch module
router.post("/batches/:batchId/sessions", instructorController.createBatchSession);

// Announcement management for Instructor
const announcementController = require("../controllers/announcement.controller");
router.post("/announcements", announcementController.createAnnouncement);
router.get("/announcements", announcementController.getInstructorAnnouncements);
router.get("/announcements/:id", announcementController.getAnnouncementById);
router.put("/announcements/:id", announcementController.updateAnnouncement);
router.patch("/announcements/:id/publish", announcementController.publishAnnouncement);
router.put("/announcements/:id/publish", announcementController.publishAnnouncement);
router.patch("/announcements/:id/archive", announcementController.archiveAnnouncement);
router.put("/announcements/:id/archive", announcementController.archiveAnnouncement);

// Instructor Course Reviews
const courseReviewController = require("../controllers/courseReview.controller");
router.get("/courses/:courseId/reviews", courseReviewController.getInstructorCourseReviews);

module.exports = router;
