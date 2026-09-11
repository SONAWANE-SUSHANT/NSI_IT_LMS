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
 * Get all batches assigned to the instructor
 */
const getMyBatches = async (instructorId) => {
  const assignments = await CourseInstructor.findAll({
    where: {
      instructor_id: instructorId,
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
        ],
      },
    ],
    order: [["assigned_at", "DESC"]],
  });

  const batchesWithStats = await Promise.all(
    assignments.map(async (a) => {
      const batch = a.batch ? a.batch.toJSON() : null;
      if (!batch) return null;

      const [studentCount, moduleCount] = await Promise.all([
        CourseStudent.count({
          where: { batch_id: batch.id, status: "ACTIVE" },
        }),
        CourseModule.count({
          where: { course_id: batch.course_id, status: "ACTIVE" },
        }),
      ]);

      return {
        ...batch,
        student_count: studentCount,
        module_count: moduleCount,
        assigned_at: a.assigned_at,
      };
    })
  );

  return batchesWithStats.filter(Boolean);
};

/**
 * Get students enrolled in an instructor's batch
 */
const getBatchStudents = async (batchId, instructorId) => {
  // Verify instructor assignment
  const assignment = await CourseInstructor.findOne({
    where: {
      batch_id: batchId,
      instructor_id: instructorId,
      status: "ACTIVE",
    },
  });

  if (!assignment) {
    throw new Error("You are not assigned to this batch");
  }

  const enrollments = await CourseStudent.findAll({
    where: {
      batch_id: batchId,
    },
    include: [
      {
        model: User,
        as: "student",
        attributes: [
          "id",
          "first_name",
          "last_name",
          "email",
          "username",
          "contact_no",
          "gender",
          "status",
        ],
      },
    ],
    order: [["enrollment_date", "DESC"]],
  });

  return enrollments.map((e) => ({
    id: e.id,
    batch_id: e.batch_id,
    student_id: e.student_id,
    status: e.status,
    enrollment_date: e.enrollment_date,
    student: e.student,
  }));
};

/**
 * Get course content (modules & lectures) for an instructor's batch
 */
const getBatchCourseContent = async (batchId, instructorId) => {
  const assignment = await CourseInstructor.findOne({
    where: {
      batch_id: batchId,
      instructor_id: instructorId,
      status: "ACTIVE",
    },
    include: [
      {
        model: CourseBatch,
        as: "batch",
        include: [{ model: Course, as: "course" }],
      },
    ],
  });

  if (!assignment || !assignment.batch) {
    throw new Error("You are not assigned to this batch");
  }

  const courseId = assignment.batch.course_id;

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
        include: [
          {
            model: LectureNote,
            as: "notes",
          },
        ],
      },
    ],
  });

  return {
    batch: assignment.batch,
    course: assignment.batch.course,
    modules,
  };
};

/**
 * Create a new live session / lecture
 */
const createBatchSession = async (batchId, sessionData, instructorId) => {
  const assignment = await CourseInstructor.findOne({
    where: {
      batch_id: batchId,
      instructor_id: instructorId,
      status: "ACTIVE",
    },
  });

  if (!assignment) {
    throw new Error("You are not authorized to create sessions for this batch");
  }

  const isRecorded = sessionData.session_type === "RECORDED";
  const recordingUrl = sessionData.recording_url || (isRecorded ? sessionData.session_url : null);
  const sessionUrl = isRecorded ? null : (sessionData.session_url || null);

  const session = await Lecture.create({
    module_id: sessionData.module_id,
    instructor_id: instructorId,
    title: sessionData.title.trim(),
    description: sessionData.description || null,
    session_type: sessionData.session_type || "LIVE",
    status: sessionData.status || "PUBLISHED",
    display_order: sessionData.display_order || 0,
    scheduled_at: sessionData.scheduled_at || new Date(),
    duration_minutes: sessionData.duration_minutes || 60,
    session_url: sessionUrl,
    recording_url: recordingUrl,
    recording_status: recordingUrl ? "AVAILABLE" : "NOT_AVAILABLE",
    created_by: instructorId,
    updated_by: instructorId,
  });

  return session;
};

module.exports = {
  getMyBatches,
  getBatchStudents,
  getBatchCourseContent,
  createBatchSession,
};
