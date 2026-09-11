const { Op } = require("sequelize");
const {
  Course,
  CourseBatch,
  CourseInstructor,
  CourseStudent,
  CourseModule,
  Lecture,
  LectureNote,
  User,
} = require("../models");

/**
 * Get all batches the student is enrolled in
 */
const getMyBatches = async (studentId) => {
  const enrollments = await CourseStudent.findAll({
    where: {
      student_id: studentId,
      status: "ACTIVE",
    },
    include: [
      {
        model: CourseBatch,
        as: "batch",
        include: [
          {
            model: Course,
            as: "course",
            attributes: ["id", "name", "code", "duration", "status"],
          },
          {
            model: CourseInstructor,
            as: "instructors",
            where: { status: "ACTIVE" },
            required: false,
            include: [
              {
                model: User,
                as: "instructor",
                attributes: ["id", "first_name", "last_name", "email", "photo"],
              },
            ],
          },
        ],
      },
    ],
    order: [["enrollment_date", "DESC"]],
  });

  const batchesWithDetails = await Promise.all(
    enrollments.map(async (e) => {
      const batch = e.batch ? e.batch.toJSON() : null;
      if (!batch) return null;

      const moduleCount = await CourseModule.count({
        where: { course_id: batch.course_id, status: "ACTIVE" },
      });

      return {
        enrollment_id: e.id,
        enrollment_date: e.enrollment_date,
        enrollment_status: e.status,
        ...batch,
        module_count: moduleCount,
      };
    })
  );

  return batchesWithDetails.filter(Boolean);
};

/**
 * Get course content, modules, sessions and notes for an enrolled student batch
 */
const getBatchCourseContent = async (batchId, studentId) => {
  const enrollment = await CourseStudent.findOne({
    where: {
      batch_id: batchId,
      student_id: studentId,
      status: "ACTIVE",
    },
    include: [
      {
        model: CourseBatch,
        as: "batch",
        include: [
          { model: Course, as: "course" },
          {
            model: CourseInstructor,
            as: "instructors",
            where: { status: "ACTIVE" },
            required: false,
            include: [
              {
                model: User,
                as: "instructor",
                attributes: ["id", "first_name", "last_name", "email"],
              },
            ],
          },
        ],
      },
    ],
  });

  if (!enrollment || !enrollment.batch) {
    throw new Error("You are not enrolled in this batch");
  }

  const courseId = enrollment.batch.course_id;

  const modules = await CourseModule.findAll({
    where: { course_id: courseId, status: "ACTIVE" },
    order: [
      ["display_order", "ASC"],
      ["id", "ASC"],
    ],
    include: [
      {
        model: Lecture,
        as: "lectures",
        where: { status: "PUBLISHED" },
        required: false,
        include: [
          {
            model: LectureNote,
            as: "notes",
            where: { status: "ACTIVE" },
            required: false,
          },
        ],
      },
    ],
  });

  return {
    enrollment: {
      id: enrollment.id,
      enrollment_date: enrollment.enrollment_date,
      status: enrollment.status,
    },
    batch: enrollment.batch,
    course: enrollment.batch.course,
    instructors: enrollment.batch.instructors?.map((bi) => bi.instructor).filter(Boolean) || [],
    modules,
  };
};

/**
 * Get all upcoming live sessions for the student across their active batches
 */
const getMyUpcomingSessions = async (studentId) => {
  const enrollments = await CourseStudent.findAll({
    where: {
      student_id: studentId,
      status: "ACTIVE",
    },
    attributes: ["batch_id"],
  });

  const batchIds = enrollments.map((e) => e.batch_id);
  if (!batchIds.length) return [];

  const batches = await CourseBatch.findAll({
    where: { id: { [Op.in]: batchIds } },
    attributes: ["id", "name", "batch_code", "course_id"],
  });

  const courseIds = batches.map((b) => b.course_id);

  const modules = await CourseModule.findAll({
    where: { course_id: { [Op.in]: courseIds } },
    attributes: ["id", "name", "course_id"],
  });

  const moduleIds = modules.map((m) => m.id);
  if (!moduleIds.length) return [];

  const sessions = await Lecture.findAll({
    where: {
      module_id: { [Op.in]: moduleIds },
      status: "PUBLISHED",
    },
    include: [
      {
        model: User,
        as: "instructor",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ],
    order: [["scheduled_at", "ASC"], ["created_at", "DESC"]],
    limit: 10,
  });

  const moduleMap = new Map(modules.map((m) => [m.id, m]));
  const courseBatchMap = new Map(batches.map((b) => [b.course_id, b]));

  return sessions.map((s) => {
    const mod = moduleMap.get(s.module_id);
    const batch = mod ? courseBatchMap.get(mod.course_id) : null;
    return {
      ...s.toJSON(),
      module_name: mod?.name || "Module",
      batch_name: batch?.name || "Batch",
      batch_code: batch?.batch_code || "",
    };
  });
};

module.exports = {
  getMyBatches,
  getBatchCourseContent,
  getMyUpcomingSessions,
};
