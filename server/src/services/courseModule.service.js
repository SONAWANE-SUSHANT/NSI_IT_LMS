const { Course, CourseModule } = require("../models");

const createModule = async ({
  courseId,
  name,
  title,
  description,
  display_order,
  duration,
  userId,
}) => {
  const course = await Course.findByPk(courseId);

  if (!course) {
    throw new Error("Course not found");
  }

  const moduleName = (name || title || "").trim();

  const module = await CourseModule.create({
    course_id: courseId,
    name: moduleName,
    description: description || null,
    display_order: display_order ?? 1,
    duration: duration || null,
    status: "ACTIVE",
    created_by: userId || null,
    updated_by: userId || null,
  });

  return module;
};

const getModulesByCourse = async (courseId) => {
  const course = await Course.findByPk(courseId, {
    attributes: ["id"],
    raw: true,
  });

  if (!course) {
    throw new Error("Course not found");
  }

  return await CourseModule.findAll({
    where: {
      course_id: courseId,
    },
    order: [
      ["display_order", "ASC"],
      ["id", "ASC"],
    ],
    raw: true,
  });
};

const getModuleById = async (moduleId) => {
  const module = await CourseModule.findByPk(moduleId);

  if (!module) {
    throw new Error("Course module not found");
  }

  return module;
};

const updateModule = async ({
  moduleId,
  name,
  title,
  description,
  display_order,
  duration,
  userId,
}) => {
  const module = await CourseModule.findByPk(moduleId);

  if (!module) {
    throw new Error("Course module not found");
  }

  if (name !== undefined || title !== undefined) {
    module.name = (name || title || "").trim();
  }

  if (description !== undefined) {
    module.description = description;
  }

  if (display_order !== undefined) {
    module.display_order = display_order;
  }

  if (duration !== undefined) {
    module.duration = duration;
  }

  module.updated_by = userId || null;
  await module.save();

  return module;
};

const updateModuleStatus = async ({ moduleId, status, userId }) => {
  const module = await CourseModule.findByPk(moduleId);

  if (!module) {
    throw new Error("Course module not found");
  }

  if (!["ACTIVE", "INACTIVE"].includes(status)) {
    throw new Error("Invalid status. Allowed values: ACTIVE, INACTIVE");
  }

  module.status = status;
  module.updated_by = userId || null;

  await module.save();

  return module;
};

const updateModuleOrder = async ({ moduleId, display_order, userId }) => {
  const module = await CourseModule.findByPk(moduleId);

  if (!module) {
    throw new Error("Course module not found");
  }

  module.display_order = display_order;
  module.updated_by = userId || null;

  await module.save();

  return module;
};

const deleteModule = async ({ moduleId, userId }) => {
  const module = await CourseModule.findByPk(moduleId);

  if (!module) {
    throw new Error("Course module not found");
  }

  module.status = "INACTIVE";
  module.updated_by = userId || null;

  await module.save();

  return module;
};

module.exports = {
  createModule,
  getModulesByCourse,
  getModuleById,
  updateModule,
  updateModuleStatus,
  updateModuleOrder,
  deleteModule,
};