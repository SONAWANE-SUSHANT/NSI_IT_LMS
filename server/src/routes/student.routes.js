const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const studentController = require("../controllers/student.controller");

const router = express.Router();

// Protect all student endpoints
router.use(authenticate, authorizeRoles("STUDENT", "ADMIN"));

// Get batches the logged-in student is enrolled in
router.get("/my-batches", studentController.getMyBatches);

// Get curriculum (modules, lectures, notes) for an enrolled batch
router.get("/batches/:batchId/content", studentController.getBatchCourseContent);

// Get upcoming live sessions for the student
router.get("/upcoming-sessions", studentController.getUpcomingSessions);

module.exports = router;
