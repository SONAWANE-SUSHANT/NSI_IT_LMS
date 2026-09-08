const ALLOWED_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "LIVE",
  "COMPLETED",
  "CANCELLED",
  "PUBLISHED",
];

const validateCreateLecture = (req, res, next) => {
  const title = (req.body.title || "").trim();
  const session_type = req.body.session_type || req.body.lecture_type;
  const status = req.body.status;
  const display_order = req.body.display_order;
  const duration_minutes = req.body.duration_minutes;
  const recording_provider = req.body.recording_provider;
  const recording_status = req.body.recording_status;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: "Lecture title is required",
    });
  }

  if (session_type && !["RECORDED", "LIVE"].includes(session_type)) {
    return res.status(400).json({
      success: false,
      message: "Invalid session/lecture type. Allowed: RECORDED, LIVE",
    });
  }

  if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid lecture status",
    });
  }

  if (
    display_order !== undefined &&
    (!Number.isInteger(Number(display_order)) || Number(display_order) < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "display_order must be a non-negative integer",
    });
  }

  if (
    duration_minutes !== undefined &&
    duration_minutes !== null &&
    (!Number.isInteger(Number(duration_minutes)) || Number(duration_minutes) <= 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "duration_minutes must be a positive integer",
    });
  }

  if (
    recording_provider !== undefined &&
    recording_provider !== null &&
    !["GOOGLE_DRIVE", "S3"].includes(recording_provider)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid recording provider",
    });
  }

  if (
    recording_status !== undefined &&
    !["NOT_AVAILABLE", "AVAILABLE"].includes(recording_status)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid recording status",
    });
  }

  req.body.title = title;
  next();
};

const validateUpdateLecture = (req, res, next) => {
  const session_type = req.body.session_type || req.body.lecture_type;
  const status = req.body.status;
  const display_order = req.body.display_order;
  const duration_minutes = req.body.duration_minutes;
  const recording_provider = req.body.recording_provider;
  const recording_status = req.body.recording_status;

  if (session_type && !["RECORDED", "LIVE"].includes(session_type)) {
    return res.status(400).json({
      success: false,
      message: "Invalid session/lecture type",
    });
  }

  if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid lecture status",
    });
  }

  if (
    display_order !== undefined &&
    (!Number.isInteger(Number(display_order)) || Number(display_order) < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "display_order must be a non-negative integer",
    });
  }

  if (
    duration_minutes !== undefined &&
    duration_minutes !== null &&
    (!Number.isInteger(Number(duration_minutes)) || Number(duration_minutes) <= 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "duration_minutes must be a positive integer",
    });
  }

  if (
    recording_provider !== undefined &&
    recording_provider !== null &&
    !["GOOGLE_DRIVE", "S3"].includes(recording_provider)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid recording provider",
    });
  }

  if (
    recording_status !== undefined &&
    !["NOT_AVAILABLE", "AVAILABLE"].includes(recording_status)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid recording status",
    });
  }

  next();
};

const validateLectureId = (req, res, next) => {
  const { lectureId } = req.params;

  if (!lectureId || !Number.isInteger(Number(lectureId)) || Number(lectureId) <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid lecture ID",
    });
  }

  next();
};

const validateModuleId = (req, res, next) => {
  const { moduleId } = req.params;

  if (!moduleId || !Number.isInteger(Number(moduleId)) || Number(moduleId) <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid module ID",
    });
  }

  next();
};

const validateLectureStatus = (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status is required",
    });
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid lecture status",
    });
  }

  next();
};

const validateLectureOrder = (req, res, next) => {
  const { display_order } = req.body;

  if (
    display_order === undefined ||
    !Number.isInteger(Number(display_order)) ||
    Number(display_order) < 0
  ) {
    return res.status(400).json({
      success: false,
      message: "display_order must be a non-negative integer",
    });
  }

  next();
};

module.exports = {
  validateCreateLecture,
  validateUpdateLecture,
  validateLectureId,
  validateModuleId,
  validateLectureStatus,
  validateLectureOrder,
};