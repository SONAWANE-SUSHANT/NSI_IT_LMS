const { Op } = require("sequelize");
const { Course } = require("../models");

const createCourse = async (courseData, adminId) => {
  const code = (courseData.code || courseData.course_code || "").trim();

  const existingCourse = await Course.findOne({
    where: {
      code,
    },
  });

  if (existingCourse) {
    throw new Error("Course code already exists");
  }

  let duration = courseData.duration;
  if (!duration && courseData.duration_value) {
    duration = `${courseData.duration_value} ${courseData.duration_unit || "WEEKS"}`;
  }

  const course = await Course.create({
    code,
    name: courseData.name.trim(),
    description: courseData.description?.trim() || null,
    thumbnail_url: courseData.thumbnail_url?.trim() || null,
    duration: duration?.trim() || null,
    status: courseData.status || "DRAFT",
    created_by: adminId,
    updated_by: adminId,
  });

  return Course.findByPk(course.id);
};

const getCourses = async (filters = {}) => {
  const where = {};

  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  if (filters.search && filters.search.trim()) {
    where[Op.or] = [
      {
        name: {
          [Op.like]: `%${filters.search.trim()}%`,
        },
      },
      {
        code: {
          [Op.like]: `%${filters.search.trim()}%`,
        },
      },
    ];
  }

  return Course.findAll({
    where,
    attributes: ["id", "code", "name", "description", "thumbnail_url", "duration", "status", "created_at", "updated_at"],
    order: [["created_at", "DESC"]],
  });
};

const getCourseById = async (id) => {
  const course = await Course.findByPk(id);

  if (!course) {
    throw new Error("Course not found");
  }

  return course;
};

const updateCourse = async (id, courseData, adminId) => {
  const course = await Course.findByPk(id);

  if (!course) {
    throw new Error("Course not found");
  }

  const code = courseData.code !== undefined ? courseData.code : courseData.course_code;
  if (code !== undefined) {
    const trimmedCode = code.trim();

    const existingCourse = await Course.findOne({
      where: {
        code: trimmedCode,
        id: {
          [Op.ne]: id,
        },
      },
    });

    if (existingCourse) {
      throw new Error("Course code already exists");
    }

    course.code = trimmedCode;
  }

  if (courseData.name !== undefined) {
    course.name = courseData.name.trim();
  }

  if (courseData.description !== undefined) {
    course.description = courseData.description?.trim() || null;
  }

  if (courseData.thumbnail_url !== undefined) {
    course.thumbnail_url = courseData.thumbnail_url?.trim() || null;
  }

  if (courseData.duration !== undefined) {
    course.duration = courseData.duration?.trim() || null;
  } else if (courseData.duration_value !== undefined) {
    course.duration = `${courseData.duration_value} ${courseData.duration_unit || "WEEKS"}`;
  }

  course.updated_by = adminId;
  await course.save();

  return getCourseById(id);
};

const updateCourseStatus = async (id, status, adminId) => {
  const validStatuses = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"];

  if (!validStatuses.includes(status)) {
    throw new Error("Invalid course status");
  }

  const course = await Course.findByPk(id);

  if (!course) {
    throw new Error("Course not found");
  }

  course.status = status;
  course.updated_by = adminId;

  await course.save();

  return getCourseById(id);
};

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  updateCourseStatus,
};