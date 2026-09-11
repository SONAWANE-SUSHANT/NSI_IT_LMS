const studentService = require("../services/student.service");

const resolveStudentId = (req) => {
  if (req.user && req.user.role === "ADMIN") {
    const overrideId = req.query.student_id || req.headers["x-student-id"];
    if (overrideId) {
      const parsed = parseInt(overrideId, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  }
  return req.user.id;
};

const getMyBatches = async (req, res) => {
  try {
    const studentId = resolveStudentId(req);
    const batches = await studentService.getMyBatches(studentId);
    return res.json({
      success: true,
      data: batches,
      count: batches.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load student batches",
    });
  }
};

const getBatchCourseContent = async (req, res) => {
  try {
    const { batchId } = req.params;
    const studentId = resolveStudentId(req);
    const content = await studentService.getBatchCourseContent(batchId, studentId);
    return res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getUpcomingSessions = async (req, res) => {
  try {
    const studentId = resolveStudentId(req);
    const sessions = await studentService.getMyUpcomingSessions(studentId);
    return res.json({
      success: true,
      data: sessions,
      count: sessions.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load upcoming sessions",
    });
  }
};

module.exports = {
  getMyBatches,
  getBatchCourseContent,
  getUpcomingSessions,
};
