const { Op } = require("sequelize");
const { Course, CourseBatch } = require("../models");

const createCourseBatch = async (courseId, batchData, adminId) => {
  const course = await Course.findByPk(courseId);

  if (!course) {
    throw new Error("Course not found");
  }

  const batch = await CourseBatch.create({
    course_id: courseId,
    name: batchData.name.trim(),
    description: batchData.description?.trim() || null,
    start_date: batchData.start_date,
    end_date: batchData.end_date || null,
    batch_mode: batchData.batch_mode || "ONLINE",
    batch_time: batchData.batch_time || "MORNING",
    batch_schedule: batchData.batch_schedule || "WEEKDAYS",
    status: batchData.status || "UPCOMING",
    created_by: adminId,
    updated_by: adminId,
  });

  // Reload to get the generated batch_code
  await batch.reload();

  return CourseBatch.findByPk(batch.id, {
    include: [
      {
        model: Course,
        as: "course",
        attributes: ["id", "code", "name", "status"],
      },
    ],
  });
};

const getCourseBatches = async (courseId, filters = {}) => {
  const where = {};

  if (courseId) {
    where.course_id = courseId;
  }

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
        batch_code: {
          [Op.like]: `%${filters.search.trim()}%`,
        },
      },
    ];
  }

  return CourseBatch.findAll({
    where,
    include: [
      {
        model: Course,
        as: "course",
        attributes: ["id", "code", "name", "status"],
      },
    ],
    order: [["created_at", "DESC"]],
    raw: true,
    nest: true,
  });
};

const getCourseBatchById = async (id) => {
  const batch = await CourseBatch.findByPk(id, {
    include: [
      {
        model: Course,
        as: "course",
        attributes: ["id", "code", "name", "status"],
      },
    ],
  });

  if (!batch) {
    throw new Error("Batch not found");
  }

  return batch;
};

const updateCourseBatch = async (id, batchData, adminId) => {
  const batch = await CourseBatch.findByPk(id);

  if (!batch) {
    throw new Error("Batch not found");
  }

  if (batchData.name !== undefined) {
    batch.name = batchData.name.trim();
  }

  if (batchData.description !== undefined) {
    batch.description = batchData.description?.trim() || null;
  }

  if (batchData.start_date !== undefined) {
    batch.start_date = batchData.start_date;
  }

  if (batchData.end_date !== undefined) {
    batch.end_date = batchData.end_date || null;
  }

  if (batchData.batch_mode !== undefined) {
    batch.batch_mode = batchData.batch_mode;
  }

  if (batchData.batch_time !== undefined) {
    batch.batch_time = batchData.batch_time;
  }

  if (batchData.batch_schedule !== undefined) {
    batch.batch_schedule = batchData.batch_schedule;
  }

  if (batchData.status !== undefined) {
    batch.status = batchData.status;
  }

  batch.updated_by = adminId;
  await batch.save();
  await batch.reload();

  return getCourseBatchById(id);
};

const updateCourseBatchStatus = async (id, status, adminId) => {
  const validStatuses = ["UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"];

  if (!validStatuses.includes(status)) {
    throw new Error("Invalid batch status");
  }

  const batch = await CourseBatch.findByPk(id);

  if (!batch) {
    throw new Error("Batch not found");
  }

  batch.status = status;
  batch.updated_by = adminId;

  await batch.save();

  return getCourseBatchById(id);
};

module.exports = {
  createCourseBatch,
  getCourseBatches,
  getCourseBatchById,
  updateCourseBatch,
  updateCourseBatchStatus,
};