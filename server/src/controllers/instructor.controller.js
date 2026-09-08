const instructorService = require("../services/instructor.service");

const getMyBatches = async (req, res) => {
  try {
    const batches = await instructorService.getMyBatches(req.user.id);
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
    const students = await instructorService.getBatchStudents(batchId, req.user.id);
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
    const content = await instructorService.getBatchCourseContent(batchId, req.user.id);
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
    const session = await instructorService.createBatchSession(batchId, req.body, req.user.id);
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
