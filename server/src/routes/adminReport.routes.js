const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  getOverviewStats,
  getStudentProgressReport,
  getQuizPerformanceReport,
  getBatchAnalyticsReport,
  getCourseFeedbackReport,
  getSecurityAuditReport,
  getStudentDossierReport,
} = require("../controllers/report.controller");

const router = express.Router();

// All routes are admin-protected
router.use(authenticate, authorizeRoles("ADMIN"));

// Overview / KPI stats
router.get("/overview", getOverviewStats);

// Report tabs
router.get("/student-progress", getStudentProgressReport);
router.get("/quizzes", getQuizPerformanceReport);
router.get("/batches", getBatchAnalyticsReport);
router.get("/feedback", getCourseFeedbackReport);
router.get("/devices", getSecurityAuditReport);

// Individual Student 360-degree Dossier
router.get("/students/:studentId/dossier", getStudentDossierReport);

module.exports = router;
