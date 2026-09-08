const validateCreateCourseBatch = (req, res, next) => {
  const { name, start_date, end_date, batch_mode, batch_time, batch_schedule } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Batch name is required",
    });
  }

  if (name.trim().length > 100) {
    return res.status(400).json({
      success: false,
      message: "Batch name must not exceed 100 characters",
    });
  }

  if (!start_date) {
    return res.status(400).json({
      success: false,
      message: "Start date is required",
    });
  }

  const start = new Date(start_date);
  if (Number.isNaN(start.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid start date",
    });
  }

  if (end_date) {
    const end = new Date(end_date);
    if (Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid end date",
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }
  }

  if (batch_mode && !["ONLINE", "OFFLINE", "HYBRID"].includes(batch_mode)) {
    return res.status(400).json({
      success: false,
      message: "Invalid batch_mode. Allowed: ONLINE, OFFLINE, HYBRID",
    });
  }

  if (batch_time && !["MORNING", "EVENING"].includes(batch_time)) {
    return res.status(400).json({
      success: false,
      message: "Invalid batch_time. Allowed: MORNING, EVENING",
    });
  }

  if (batch_schedule && !["WEEKDAYS", "WEEKENDS"].includes(batch_schedule)) {
    return res.status(400).json({
      success: false,
      message: "Invalid batch_schedule. Allowed: WEEKDAYS, WEEKENDS",
    });
  }

  next();
};

const validateUpdateCourseBatch = (req, res, next) => {
  const { name, start_date, end_date, batch_mode, batch_time, batch_schedule } = req.body;

  if (name !== undefined) {
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Batch name cannot be empty",
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Batch name must not exceed 100 characters",
      });
    }
  }

  if (start_date && end_date) {
    const start = new Date(start_date);
    const end = new Date(end_date);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date or end date",
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }
  }

  if (batch_mode && !["ONLINE", "OFFLINE", "HYBRID"].includes(batch_mode)) {
    return res.status(400).json({
      success: false,
      message: "Invalid batch_mode. Allowed: ONLINE, OFFLINE, HYBRID",
    });
  }

  if (batch_time && !["MORNING", "EVENING"].includes(batch_time)) {
    return res.status(400).json({
      success: false,
      message: "Invalid batch_time. Allowed: MORNING, EVENING",
    });
  }

  if (batch_schedule && !["WEEKDAYS", "WEEKENDS"].includes(batch_schedule)) {
    return res.status(400).json({
      success: false,
      message: "Invalid batch_schedule. Allowed: WEEKDAYS, WEEKENDS",
    });
  }

  next();
};

module.exports = {
  validateCreateCourseBatch,
  validateUpdateCourseBatch,
};