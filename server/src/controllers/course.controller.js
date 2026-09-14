const {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  updateCourseStatus,
} = require("../services/course.service");
const courseAccessService = require("../services/courseAccess.service");

const create = async (req, res) => {
  try {
    const course = await createCourse(
      req.body,
      req.user.id
    );

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAll = async (req, res) => {
  try {
    const {
      status,
      search,
    } = req.query;

    const filters = {
      status,
      search,
    };

    // If requester is an instructor or proxying as an instructor
    const instructorId = courseAccessService.resolveInstructorId(req);
    if (instructorId) {
      const allowedCourseIds = await courseAccessService.getInstructorCourseIds(instructorId);
      filters.courseIds = allowedCourseIds;
    }

    const courses = await getCourses(filters);

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve courses",
    });
  }
};

const getOne = async (req, res) => {
  try {
    const courseId = req.params.id;

    const instructorId = courseAccessService.resolveInstructorId(req);
    if (instructorId) {
      const hasAccess = await courseAccessService.hasCourseAccess(req.user, courseId, instructorId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to access this course",
        });
      }
    }

    const course = await getCourseById(courseId);

    return res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    const statusCode =
      error.message === "Course not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const update = async (req, res) => {
  try {
    const course = await updateCourse(
      req.params.id,
      req.body,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    const statusCode =
      error.message === "Course not found" ? 404 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const course = await updateCourseStatus(
      req.params.id,
      status,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: `Course status updated to ${status}`,
      data: course,
    });
  } catch (error) {
    const statusCode =
      error.message === "Course not found" ? 404 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  create,
  getAll,
  getOne,
  update,
  updateStatus,
};