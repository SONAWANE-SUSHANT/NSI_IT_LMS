const progressService = require("../services/progress.service");

/**
 * POST /api/student/sessions/:sessionId/access
 * Records or updates session access for authenticated student
 */
const recordSessionAccess = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { sessionId } = req.params;

    const data = await progressService.recordSessionAccess(studentId, sessionId);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/student/sessions/:sessionId/complete
 * Marks a session as completed and updates course progress
 */
const completeSession = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { sessionId } = req.params;

    const data = await progressService.markSessionCompleted(studentId, sessionId);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/sessions/:sessionId/progress
 * Get progress for a specific session
 */
const getSessionProgress = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { sessionId } = req.params;

    const data = await progressService.getSessionProgress(studentId, sessionId);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/courses/:courseId/progress
 * Get course progress for authenticated student
 */
const getCourseProgress = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.params;

    const data = await progressService.getCourseProgress(studentId, courseId);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/progress
 * Get progress across all enrolled courses for authenticated student
 */
const getAllStudentProgress = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const data = await progressService.getAllStudentCoursesProgress(studentId);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordSessionAccess,
  completeSession,
  getSessionProgress,
  getCourseProgress,
  getAllStudentProgress,
};
