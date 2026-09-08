const lectureService = require("../services/lecture.service");

/*
 * Create Lecture
 */
const createLecture = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const lecture = await lectureService.createLecture({
      moduleId: Number(moduleId),

      title: req.body.title,
      description: req.body.description,

      instructorId: req.body.instructor_id || req.body.instructorId,
      session_type: req.body.session_type || req.body.lecture_type,
      lecture_type: req.body.lecture_type || req.body.session_type,
      status: req.body.status,

      display_order: req.body.display_order,

      scheduled_at: req.body.scheduled_at,
      duration_minutes: req.body.duration_minutes,

      session_url: req.body.session_url || req.body.meet_url,
      meet_url: req.body.meet_url || req.body.session_url,

      recording_url: req.body.recording_url,
      recording_provider: req.body.recording_provider,
      recording_status: req.body.recording_status,

      userId: req.user?.id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Lecture created successfully",
      data: lecture,
    });
  } catch (error) {
    console.error("Create lecture error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/*
 * Get all lectures of a module
 */
const getLecturesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const lectures =
      await lectureService.getLecturesByModule(
        Number(moduleId)
      );

    return res.status(200).json({
      success: true,
      message: "Lectures fetched successfully",
      data: lectures,
    });
  } catch (error) {
    console.error("Get lectures error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/*
 * Get single lecture
 */
const getLectureById = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const lecture =
      await lectureService.getLectureById(
        Number(lectureId)
      );

    return res.status(200).json({
      success: true,
      message: "Lecture fetched successfully",
      data: lecture,
    });
  } catch (error) {
    console.error("Get lecture error:", error);

    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/*
 * Update Lecture
 */
const updateLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const lecture =
      await lectureService.updateLecture({
        lectureId: Number(lectureId),

        title: req.body.title,
        description: req.body.description,

        instructorId: req.body.instructor_id || req.body.instructorId,
        session_type: req.body.session_type || req.body.lecture_type,
        lecture_type: req.body.lecture_type || req.body.session_type,

        scheduled_at: req.body.scheduled_at,
        duration_minutes: req.body.duration_minutes,

        session_url: req.body.session_url || req.body.meet_url,
        meet_url: req.body.meet_url || req.body.session_url,

        recording_url: req.body.recording_url,
        recording_provider: req.body.recording_provider,
        recording_status: req.body.recording_status,

        userId: req.user?.id || null,
      });

    return res.status(200).json({
      success: true,
      message: "Lecture updated successfully",
      data: lecture,
    });
  } catch (error) {
    console.error("Update lecture error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/*
 * Update Lecture Status
 */
const updateLectureStatus = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const lecture =
      await lectureService.updateLectureStatus({
        lectureId: Number(lectureId),
        status: req.body.status,
        userId: req.user?.id || null,
      });

    return res.status(200).json({
      success: true,
      message: "Lecture status updated successfully",
      data: lecture,
    });
  } catch (error) {
    console.error(
      "Update lecture status error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/*
 * Update Lecture Order
 */
const updateLectureOrder = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const lecture =
      await lectureService.updateLectureOrder({
        lectureId: Number(lectureId),
        display_order: req.body.display_order,
        userId: req.user?.id || null,
      });

    return res.status(200).json({
      success: true,
      message: "Lecture order updated successfully",
      data: lecture,
    });
  } catch (error) {
    console.error(
      "Update lecture order error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/*
 * Archive Lecture
 */
const deleteLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const lecture =
      await lectureService.deleteLecture({
        lectureId: Number(lectureId),
        userId: req.user?.id || null,
      });

    return res.status(200).json({
      success: true,
      message: "Lecture archived successfully",
      data: lecture,
    });
  } catch (error) {
    console.error("Delete lecture error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createLecture,
  getLecturesByModule,
  getLectureById,
  updateLecture,
  updateLectureStatus,
  updateLectureOrder,
  deleteLecture,
};