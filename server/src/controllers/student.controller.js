const studentService = require("../services/student.service");

const getMyBatches = async (req, res) => {
  try {
    const batches = await studentService.getMyBatches(req.user.id);
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
    const content = await studentService.getBatchCourseContent(batchId, req.user.id);
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
    const sessions = await studentService.getMyUpcomingSessions(req.user.id);
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
