const validateCreateCourse = (req, res, next) => {
  const code = (req.body.code || req.body.course_code || "").trim();
  const name = (req.body.name || "").trim();
  const duration = req.body.duration;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Course code is required",
    });
  }

  if (code.length > 30) {
    return res.status(400).json({
      success: false,
      message: "Course code must not exceed 30 characters",
    });
  }

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Course name is required",
    });
  }

  if (name.length > 200) {
    return res.status(400).json({
      success: false,
      message: "Course name must not exceed 200 characters",
    });
  }

  if (duration && duration.length > 20) {
    return res.status(400).json({
      success: false,
      message: "Duration must not exceed 20 characters",
    });
  }

  next();
};

const validateUpdateCourse = (req, res, next) => {
  const code = req.body.code !== undefined ? req.body.code : req.body.course_code;
  const name = req.body.name;
  const duration = req.body.duration;

  if (code !== undefined) {
    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Course code cannot be empty",
      });
    }

    if (code.trim().length > 30) {
      return res.status(400).json({
        success: false,
        message: "Course code must not exceed 30 characters",
      });
    }
  }

  if (name !== undefined) {
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Course name cannot be empty",
      });
    }

    if (name.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: "Course name must not exceed 200 characters",
      });
    }
  }

  if (duration !== undefined && duration !== null && duration.length > 20) {
    return res.status(400).json({
      success: false,
      message: "Duration must not exceed 20 characters",
    });
  }

  next();
};

module.exports = {
  validateCreateCourse,
  validateUpdateCourse,
};