const instructorService = require("../services/instructor.service");

const resolveInstructorId = (req) => {
  if (req.user && req.user.role === "ADMIN") {
    const overrideId = req.query.instructor_id || req.headers["x-instructor-id"];
    if (overrideId) {
      const parsed = parseInt(overrideId, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  }
  return req.user.id;
};

const getMyBatches = async (req, res) => {
  try {
    const instructorId = resolveInstructorId(req);
    const batches = await instructorService.getMyBatches(instructorId);
    return res.json({
      success: true,
      data: batches,
      count: batches.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load instructor batches",
    });
  }
};

const getBatchStudents = async (req, res) => {
  try {
    const { batchId } = req.params;
    const instructorId = resolveInstructorId(req);
    const students = await instructorService.getBatchStudents(batchId, instructorId);
    return res.json({
      success: true,
      data: students,
      count: students.length,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getBatchCourseContent = async (req, res) => {
  try {
    const { batchId } = req.params;
    const instructorId = resolveInstructorId(req);
    const content = await instructorService.getBatchCourseContent(batchId, instructorId);
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

const createBatchSession = async (req, res) => {
  try {
    const { batchId } = req.params;
    const instructorId = resolveInstructorId(req);
    const session = await instructorService.createBatchSession(batchId, req.body, instructorId);
    return res.status(201).json({
      success: true,
      message: "Session scheduled successfully",
      data: session,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getMyBatches,
  getBatchStudents,
  getBatchCourseContent,
  createBatchSession,
};
