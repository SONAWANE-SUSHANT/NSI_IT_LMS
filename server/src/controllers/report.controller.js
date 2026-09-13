const reportService = require("../services/report.service");

/**
 * GET /api/admin/reports/overview
 */
const getOverviewStats = async (req, res, next) => {
  try {
    const data = await reportService.getOverviewStats();
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/reports/student-progress
 */
const getStudentProgressReport = async (req, res, next) => {
  try {
    const { courseId, batchId, status, search } = req.query;
    const data = await reportService.getStudentProgressReport({
      courseId,
      batchId,
      status,
      search,
    });
    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/reports/quizzes
 */
const getQuizPerformanceReport = async (req, res, next) => {
  try {
    const { quizId, courseId, passed, status, search } = req.query;
    const data = await reportService.getQuizPerformanceReport({
      quizId,
      courseId,
      passed,
      status,
      search,
    });
    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/reports/batches
 */
const getBatchAnalyticsReport = async (req, res, next) => {
  try {
    const { status, batchMode, courseId } = req.query;
    const data = await reportService.getBatchAnalyticsReport({
      status,
      batchMode,
      courseId,
    });
    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/reports/feedback
 */
const getCourseFeedbackReport = async (req, res, next) => {
  try {
    const { courseId, rating, status } = req.query;
    const data = await reportService.getCourseFeedbackReport({
      courseId,
      rating,
      status,
    });
    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/reports/devices
 */
const getSecurityAuditReport = async (req, res, next) => {
  try {
    const { status, deviceType, search } = req.query;
    const data = await reportService.getSecurityAuditReport({
      status,
      deviceType,
      search,
    });
    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/reports/students/:studentId/dossier
 */
const getStudentDossierReport = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const data = await reportService.getStudentDossierReport(studentId);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverviewStats,
  getStudentProgressReport,
  getQuizPerformanceReport,
  getBatchAnalyticsReport,
  getCourseFeedbackReport,
  getSecurityAuditReport,
  getStudentDossierReport,
};
