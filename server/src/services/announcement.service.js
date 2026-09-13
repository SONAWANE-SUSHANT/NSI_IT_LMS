const { Op } = require("sequelize");
const sequelize = require("../config/database");
const {
  Announcement,
  Course,
  CourseBatch,
  CourseInstructor,
  CourseStudent,
  User,
} = require("../models");
const notificationService = require("./notification.service");

/**
 * Verify instructor authorization for a given course and/or batch
 */
const verifyInstructorScope = async (instructorId, courseId = null, batchId = null) => {
  if (!courseId && !batchId) {
    const error = new Error("Instructors can only create announcements for their assigned courses or batches");
    error.status = 403;
    throw error;
  }

  if (batchId) {
    const assignment = await CourseInstructor.findOne({
      where: {
        instructor_id: instructorId,
        batch_id: batchId,
        status: "ACTIVE",
      },
    });
    if (!assignment) {
      const error = new Error("You are not assigned as an instructor to this batch");
      error.status = 403;
      throw error;
    }
  } else if (courseId) {
    // Find if instructor is assigned to any batch of this course
    const batches = await CourseBatch.findAll({
      where: { course_id: courseId },
      attributes: ["id"],
    });
    const batchIds = batches.map((b) => b.id);
    if (batchIds.length === 0) {
      const error = new Error("No active batches found for this course");
      error.status = 403;
      throw error;
    }

    const assignment = await CourseInstructor.findOne({
      where: {
        instructor_id: instructorId,
        batch_id: { [Op.in]: batchIds },
        status: "ACTIVE",
      },
    });
    if (!assignment) {
      const error = new Error("You are not assigned as an instructor to this course");
      error.status = 403;
      throw error;
    }
  }
};

/**
 * Verify instructor permission to manage an existing announcement
 */
const verifyInstructorAnnouncementAccess = async (instructorId, announcement) => {
  if (!announcement.course_id && !announcement.batch_id) {
    const error = new Error("Instructors cannot manage global announcements");
    error.status = 403;
    throw error;
  }
  await verifyInstructorScope(instructorId, announcement.course_id, announcement.batch_id);
};

/**
 * Create a new announcement
 */
const createAnnouncement = async (
  { title, message, course_id = null, batch_id = null, status = "DRAFT" },
  user
) => {
  if (!title || !title.trim()) {
    const error = new Error("Announcement title is required");
    error.status = 400;
    throw error;
  }
  if (!message || !message.trim()) {
    const error = new Error("Announcement message is required");
    error.status = 400;
    throw error;
  }

  const validStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];
  const targetStatus = validStatuses.includes(status) ? status : "DRAFT";

  // Validate Course
  if (course_id) {
    const course = await Course.findByPk(course_id);
    if (!course) {
      const error = new Error("Referenced course does not exist");
      error.status = 404;
      throw error;
    }
  }

  // Validate Batch
  if (batch_id) {
    const batch = await CourseBatch.findByPk(batch_id);
    if (!batch) {
      const error = new Error("Referenced batch does not exist");
      error.status = 404;
      throw error;
    }
    if (course_id && batch.course_id !== Number(course_id)) {
      const error = new Error("The specified batch does not belong to the selected course");
      error.status = 400;
      throw error;
    }
    if (!course_id) {
      course_id = batch.course_id;
    }
  }

  // Role checks for Instructor
  if (user.role === "INSTRUCTOR") {
    await verifyInstructorScope(user.id, course_id, batch_id);
  } else if (user.role !== "ADMIN") {
    const error = new Error("You are not authorized to create announcements");
    error.status = 403;
    throw error;
  }

  const isPublished = targetStatus === "PUBLISHED";
  const publishedAt = isPublished ? new Date() : null;

  const t = await sequelize.transaction();
  try {
    const announcement = await Announcement.create(
      {
        title: title.trim(),
        message: message.trim(),
        course_id: course_id || null,
        batch_id: batch_id || null,
        status: targetStatus,
        published_at: publishedAt,
        created_by: user.id,
        updated_by: user.id,
      },
      { transaction: t }
    );

    if (isPublished) {
      await notificationService.createAnnouncementNotifications(announcement, t);
    }

    await t.commit();

    return await getAnnouncementById(announcement.id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/**
 * Update an existing announcement
 */
const updateAnnouncement = async (id, data, user) => {
  const announcement = await Announcement.findByPk(id);
  if (!announcement) {
    const error = new Error("Announcement not found");
    error.status = 404;
    throw error;
  }

  if (user.role === "INSTRUCTOR") {
    await verifyInstructorAnnouncementAccess(user.id, announcement);
  } else if (user.role !== "ADMIN") {
    const error = new Error("You are not authorized to edit announcements");
    error.status = 403;
    throw error;
  }

  const { title, message, course_id, batch_id, status } = data;

  if (title !== undefined) {
    if (!title.trim()) {
      const error = new Error("Title cannot be empty");
      error.status = 400;
      throw error;
    }
    announcement.title = title.trim();
  }

  if (message !== undefined) {
    if (!message.trim()) {
      const error = new Error("Message cannot be empty");
      error.status = 400;
      throw error;
    }
    announcement.message = message.trim();
  }

  let finalCourseId = course_id !== undefined ? course_id : announcement.course_id;
  let finalBatchId = batch_id !== undefined ? batch_id : announcement.batch_id;

  if (finalCourseId) {
    const course = await Course.findByPk(finalCourseId);
    if (!course) {
      const error = new Error("Referenced course does not exist");
      error.status = 404;
      throw error;
    }
  }

  if (finalBatchId) {
    const batch = await CourseBatch.findByPk(finalBatchId);
    if (!batch) {
      const error = new Error("Referenced batch does not exist");
      error.status = 404;
      throw error;
    }
    if (finalCourseId && batch.course_id !== Number(finalCourseId)) {
      const error = new Error("The specified batch does not belong to the selected course");
      error.status = 400;
      throw error;
    }
    finalCourseId = batch.course_id;
  }

  if (user.role === "INSTRUCTOR") {
    await verifyInstructorScope(user.id, finalCourseId, finalBatchId);
  }

  announcement.course_id = finalCourseId || null;
  announcement.batch_id = finalBatchId || null;
  announcement.updated_by = user.id;

  const validStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];
  let willPublishNow = false;

  if (status && validStatuses.includes(status)) {
    if (status === "PUBLISHED" && announcement.status !== "PUBLISHED") {
      willPublishNow = true;
      announcement.published_at = announcement.published_at || new Date();
    }
    announcement.status = status;
  }

  const t = await sequelize.transaction();
  try {
    await announcement.save({ transaction: t });

    if (willPublishNow) {
      await notificationService.createAnnouncementNotifications(announcement, t);
    }

    await t.commit();
    return await getAnnouncementById(announcement.id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/**
 * Publish an announcement (Idempotent notification dispatch)
 */
const publishAnnouncement = async (id, user) => {
  const announcement = await Announcement.findByPk(id);
  if (!announcement) {
    const error = new Error("Announcement not found");
    error.status = 404;
    throw error;
  }

  if (user.role === "INSTRUCTOR") {
    await verifyInstructorAnnouncementAccess(user.id, announcement);
  } else if (user.role !== "ADMIN") {
    const error = new Error("You are not authorized to publish announcements");
    error.status = 403;
    throw error;
  }

  const t = await sequelize.transaction();
  try {
    announcement.status = "PUBLISHED";
    announcement.published_at = announcement.published_at || new Date();
    announcement.updated_by = user.id;
    await announcement.save({ transaction: t });

    // Creates notifications for students (skips duplicates safely)
    await notificationService.createAnnouncementNotifications(announcement, t);

    await t.commit();
    return await getAnnouncementById(announcement.id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/**
 * Archive an announcement
 */
const archiveAnnouncement = async (id, user) => {
  const announcement = await Announcement.findByPk(id);
  if (!announcement) {
    const error = new Error("Announcement not found");
    error.status = 404;
    throw error;
  }

  if (user.role === "INSTRUCTOR") {
    await verifyInstructorAnnouncementAccess(user.id, announcement);
  } else if (user.role !== "ADMIN") {
    const error = new Error("You are not authorized to archive announcements");
    error.status = 403;
    throw error;
  }

  announcement.status = "ARCHIVED";
  announcement.updated_by = user.id;
  await announcement.save();

  return await getAnnouncementById(announcement.id);
};

/**
 * Delete an announcement (Admin only)
 */
const deleteAnnouncement = async (id, user) => {
  if (user.role !== "ADMIN") {
    const error = new Error("Only administrators can delete announcements");
    error.status = 403;
    throw error;
  }

  const announcement = await Announcement.findByPk(id);
  if (!announcement) {
    const error = new Error("Announcement not found");
    error.status = 404;
    throw error;
  }

  await announcement.destroy();
  return { success: true, message: "Announcement deleted successfully" };
};

/**
 * Get detailed announcement by ID
 */
const getAnnouncementById = async (id) => {
  return await Announcement.findByPk(id, {
    include: [
      { model: Course, as: "course", attributes: ["id", "name", "code"] },
      { model: CourseBatch, as: "batch", attributes: ["id", "name", "batch_code"] },
      { model: User, as: "creator", attributes: ["id", "first_name", "last_name", "email"] },
      { model: User, as: "updater", attributes: ["id", "first_name", "last_name", "email"] },
    ],
  });
};

/**
 * Admin: Get all announcements with filtering & pagination
 */
const getAdminAnnouncements = async ({
  status,
  course_id,
  batch_id,
  search,
  page = 1,
  limit = 20,
} = {}) => {
  const where = {};
  if (status) where.status = status;
  if (course_id) where.course_id = course_id;
  if (batch_id) where.batch_id = batch_id;

  if (search && search.trim()) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search.trim()}%` } },
      { message: { [Op.like]: `%${search.trim()}%` } },
    ];
  }

  const offset = (Number(page) - 1) * Number(limit);

  const { rows, count } = await Announcement.findAndCountAll({
    where,
    include: [
      { model: Course, as: "course", attributes: ["id", "name", "code"] },
      { model: CourseBatch, as: "batch", attributes: ["id", "name", "batch_code"] },
      { model: User, as: "creator", attributes: ["id", "first_name", "last_name", "email"] },
      { model: User, as: "updater", attributes: ["id", "first_name", "last_name", "email"] },
    ],
    order: [
      ["created_at", "DESC"],
    ],
    limit: Number(limit),
    offset: Number(offset),
  });

  return {
    announcements: rows,
    total: count,
    page: Number(page),
    limit: Number(limit),
    total_pages: Math.ceil(count / Number(limit)) || 1,
  };
};

/**
 * Instructor: Get announcements for instructor's assigned batches and courses
 */
const getInstructorAnnouncements = async (
  instructorId,
  { status, course_id, batch_id, search, page = 1, limit = 20 } = {}
) => {
  const assignments = await CourseInstructor.findAll({
    where: { instructor_id: instructorId, status: "ACTIVE" },
    include: [{ model: CourseBatch, as: "batch", attributes: ["id", "course_id"] }],
  });

  const assignedBatchIds = assignments.map((a) => a.batch_id);
  const assignedCourseIds = [
    ...new Set(assignments.map((a) => a.batch?.course_id).filter(Boolean)),
  ];

  if (assignedBatchIds.length === 0 && assignedCourseIds.length === 0) {
    return { announcements: [], total: 0, page: 1, limit: Number(limit), total_pages: 1 };
  }

  const scopeConditions = [];
  if (assignedBatchIds.length > 0) {
    scopeConditions.push({ batch_id: { [Op.in]: assignedBatchIds } });
  }
  if (assignedCourseIds.length > 0) {
    scopeConditions.push({
      course_id: { [Op.in]: assignedCourseIds },
      batch_id: null,
    });
  }

  const where = {
    [Op.and]: [{ [Op.or]: scopeConditions }],
  };

  if (status) where[Op.and].push({ status });
  if (course_id) where[Op.and].push({ course_id });
  if (batch_id) where[Op.and].push({ batch_id });

  if (search && search.trim()) {
    where[Op.and].push({
      [Op.or]: [
        { title: { [Op.like]: `%${search.trim()}%` } },
        { message: { [Op.like]: `%${search.trim()}%` } },
      ],
    });
  }

  const offset = (Number(page) - 1) * Number(limit);

  const { rows, count } = await Announcement.findAndCountAll({
    where,
    include: [
      { model: Course, as: "course", attributes: ["id", "name", "code"] },
      { model: CourseBatch, as: "batch", attributes: ["id", "name", "batch_code"] },
      { model: User, as: "creator", attributes: ["id", "first_name", "last_name", "email"] },
      { model: User, as: "updater", attributes: ["id", "first_name", "last_name", "email"] },
    ],
    order: [["created_at", "DESC"]],
    limit: Number(limit),
    offset: Number(offset),
  });

  return {
    announcements: rows,
    total: count,
    page: Number(page),
    limit: Number(limit),
    total_pages: Math.ceil(count / Number(limit)) || 1,
  };
};

/**
 * Student: Get all published announcements targeted to student
 */
const getStudentAnnouncements = async (studentId) => {
  const enrollments = await CourseStudent.findAll({
    where: { student_id: studentId, status: "ACTIVE" },
    include: [{ model: CourseBatch, as: "batch", attributes: ["id", "course_id"] }],
  });

  const enrolledBatchIds = enrollments.map((e) => e.batch_id);
  const enrolledCourseIds = [
    ...new Set(enrollments.map((e) => e.batch?.course_id).filter(Boolean)),
  ];

  const orConditions = [
    // Global announcements (both course_id and batch_id are NULL)
    { course_id: null, batch_id: null },
  ];

  if (enrolledBatchIds.length > 0) {
    orConditions.push({ batch_id: { [Op.in]: enrolledBatchIds } });
  }

  if (enrolledCourseIds.length > 0) {
    orConditions.push({
      course_id: { [Op.in]: enrolledCourseIds },
      batch_id: null,
    });
  }

  const announcements = await Announcement.findAll({
    where: {
      status: "PUBLISHED",
      [Op.or]: orConditions,
    },
    include: [
      { model: Course, as: "course", attributes: ["id", "name", "code"] },
      { model: CourseBatch, as: "batch", attributes: ["id", "name", "batch_code"] },
      { model: User, as: "creator", attributes: ["id", "first_name", "last_name"] },
    ],
    order: [
      ["published_at", "DESC"],
      ["created_at", "DESC"],
    ],
  });

  return announcements;
};

/**
 * Student: Get single published announcement by ID with strict scope verification
 */
const getStudentAnnouncementById = async (studentId, announcementId) => {
  const announcement = await Announcement.findOne({
    where: {
      id: announcementId,
      status: "PUBLISHED",
    },
    include: [
      { model: Course, as: "course", attributes: ["id", "name", "code"] },
      { model: CourseBatch, as: "batch", attributes: ["id", "name", "batch_code"] },
      { model: User, as: "creator", attributes: ["id", "first_name", "last_name"] },
    ],
  });

  if (!announcement) {
    const error = new Error("Announcement not found or not available");
    error.status = 404;
    throw error;
  }

  // If global announcement, student has access
  if (!announcement.course_id && !announcement.batch_id) {
    return announcement;
  }

  // Verify student enrollment in course or batch
  const enrollments = await CourseStudent.findAll({
    where: { student_id: studentId, status: "ACTIVE" },
    include: [{ model: CourseBatch, as: "batch", attributes: ["id", "course_id"] }],
  });

  const enrolledBatchIds = enrollments.map((e) => e.batch_id);
  const enrolledCourseIds = enrollments.map((e) => e.batch?.course_id).filter(Boolean);

  let hasAccess = false;
  if (announcement.batch_id && enrolledBatchIds.includes(announcement.batch_id)) {
    hasAccess = true;
  } else if (
    announcement.course_id &&
    !announcement.batch_id &&
    enrolledCourseIds.includes(announcement.course_id)
  ) {
    hasAccess = true;
  }

  if (!hasAccess) {
    const error = new Error("You are not authorized to view this announcement");
    error.status = 403;
    throw error;
  }

  return announcement;
};

module.exports = {
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
  deleteAnnouncement,
  getAnnouncementById,
  getAdminAnnouncements,
  getInstructorAnnouncements,
  getStudentAnnouncements,
  getStudentAnnouncementById,
  verifyInstructorScope,
};
