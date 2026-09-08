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

module.exports = router;
