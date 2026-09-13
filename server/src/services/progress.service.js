const { Op } = require("sequelize");
const sequelize = require("../config/database");
const {
  Course,
  CourseBatch,
  CourseStudent,
  CourseModule,
  Lecture,
  SessionProgress,
  CourseProgress,
} = require("../models");

/**
 * Verify that the student is enrolled in the course that contains this session.
 * student -> batch_students -> batches -> courses -> course_modules -> session
 */
const verifyStudentSessionAccess = async (studentId, sessionId) => {
  const session = await Lecture.findByPk(sessionId, {
    include: [
      {
        model: CourseModule,
        as: "module",
        attributes: ["id", "course_id", "status"],
      },
    ],
  });

  if (!session) {
    const error = new Error("Session not found");
    error.status = 404;
    throw error;
  }

  const courseId = session.module?.course_id;
  if (!courseId) {
    const error = new Error("Session is not associated with a valid course");
    error.status = 404;
    throw error;
  }

  // Check student active enrollment in any batch of this course
  const batches = await CourseBatch.findAll({
    where: { course_id: courseId },
    attributes: ["id"],
  });
  const batchIds = batches.map((b) => b.id);

  if (!batchIds.length) {
    const error = new Error("No batches found for this course");
    error.status = 403;
    throw error;
  }

  const enrollment = await CourseStudent.findOne({
    where: {
      student_id: studentId,
      batch_id: { [Op.in]: batchIds },
      status: "ACTIVE",
    },
  });

  if (!enrollment) {
    const error = new Error("You are not enrolled in the course for this session");
    error.status = 403;
    throw error;
  }

  return { session, courseId };
};

/**
 * Helper: Find the most recently accessed session progress for a course
 */
const getLastAccessedSessionForCourse = async (studentId, courseId, transaction = null) => {
  const options = transaction ? { transaction } : {};

  const modules = await CourseModule.findAll({
    where: { course_id: courseId, status: "ACTIVE" },
    attributes: ["id"],
    ...options,
  });
  const moduleIds = modules.map((m) => m.id);
  if (!moduleIds.length) return null;

  const publishedSessions = await Lecture.findAll({
    where: { module_id: { [Op.in]: moduleIds }, status: "PUBLISHED" },
    attributes: ["id"],
    ...options,
  });
  const sessionIds = publishedSessions.map((s) => s.id);
  if (!sessionIds.length) return null;

  const lastProgress = await SessionProgress.findOne({
    where: {
      student_id: studentId,
      session_id: { [Op.in]: sessionIds },
    },
    order: [["updated_at", "DESC"]],
    ...options,
  });

  return lastProgress;
};

/**
 * Recalculate course progress and return calculated object
 */
const recalculateCourseProgress = async (studentId, courseId, transaction = null) => {
  const options = transaction ? { transaction } : {};

  const modules = await CourseModule.findAll({
    where: { course_id: courseId, status: "ACTIVE" },
    attributes: ["id"],
    ...options,
  });
  const moduleIds = modules.map((m) => m.id);

  let totalSessions = 0;
  let completedSessions = 0;

  if (moduleIds.length > 0) {
    const publishedSessions = await Lecture.findAll({
      where: {
        module_id: { [Op.in]: moduleIds },
        status: "PUBLISHED",
      },
      attributes: ["id"],
      ...options,
    });

    totalSessions = publishedSessions.length;
    const sessionIds = publishedSessions.map((s) => s.id);

    if (sessionIds.length > 0) {
      completedSessions = await SessionProgress.count({
        where: {
          session_id: { [Op.in]: sessionIds },
          student_id: studentId,
          completed: true,
        },
        ...options,
      });
    }
  }

  const percentage =
    totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 10000) / 100
      : 0;

  const isCompleted = totalSessions > 0 && completedSessions >= totalSessions;

  let [courseProg, created] = await CourseProgress.findOrCreate({
    where: { course_id: courseId, student_id: studentId },
    defaults: {
      completion_percentage: percentage,
      completed_sessions: completedSessions,
      total_sessions: totalSessions,
      completed: isCompleted,
      completed_at: isCompleted ? new Date() : null,
    },
    ...options,
  });

  if (!created) {
    courseProg.completion_percentage = percentage;
    courseProg.completed_sessions = completedSessions;
    courseProg.total_sessions = totalSessions;
    courseProg.completed = isCompleted;
    if (isCompleted && !courseProg.completed_at) {
      courseProg.completed_at = new Date();
    } else if (!isCompleted) {
      courseProg.completed_at = null;
    }
    courseProg.changed("updated_at", true);
    await courseProg.save(options);
  }

  const lastSession = await getLastAccessedSessionForCourse(studentId, courseId, transaction);

  let status = "NOT_STARTED";
  if (isCompleted || percentage >= 100) {
    status = "COMPLETED";
  } else if (completedSessions > 0 || percentage > 0) {
    status = "IN_PROGRESS";
  }

  return {
    course_id: Number(courseId),
    progress_percentage: Number(courseProg.completion_percentage),
    completed_sessions: courseProg.completed_sessions,
    total_sessions: courseProg.total_sessions,
    status,
    completed: Boolean(courseProg.completed),
    completed_at: courseProg.completed_at,
    last_session_id: lastSession?.session_id || null,
    last_accessed_at: lastSession?.updated_at || courseProg.updated_at,
  };
};

/**
 * Record student opening / accessing a session
 */
const recordSessionAccess = async (studentId, sessionId) => {
  const { courseId } = await verifyStudentSessionAccess(studentId, sessionId);

  let [progress, created] = await SessionProgress.findOrCreate({
    where: { session_id: sessionId, student_id: studentId },
    defaults: {
      completed: false,
      completed_at: null,
    },
  });

  if (!created) {
    progress.changed("updated_at", true);
    await progress.save();
  }

  // Ensure course progress record exists and touch updated_at
  const courseProg = await CourseProgress.findOne({
    where: { course_id: courseId, student_id: studentId },
  });

  if (courseProg) {
    courseProg.changed("updated_at", true);
    await courseProg.save();
  } else {
    await recalculateCourseProgress(studentId, courseId);
  }

  return {
    session_id: Number(sessionId),
    completed: Boolean(progress.completed),
    completed_at: progress.completed_at,
    last_accessed_at: progress.updated_at,
  };
};

/**
 * Mark a recorded session completed and recalculate course progress
 */
const markSessionCompleted = async (studentId, sessionId) => {
  const { courseId } = await verifyStudentSessionAccess(studentId, sessionId);

  return await sequelize.transaction(async (t) => {
    let progress = await SessionProgress.findOne({
      where: { session_id: sessionId, student_id: studentId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!progress) {
      progress = await SessionProgress.create(
        {
          session_id: sessionId,
          student_id: studentId,
          completed: true,
          completed_at: new Date(),
        },
        { transaction: t }
      );
    } else {
      if (!progress.completed) {
        progress.completed = true;
        progress.completed_at = new Date();
      }
      progress.changed("updated_at", true);
      await progress.save({ transaction: t });
    }

    const courseProgressResult = await recalculateCourseProgress(studentId, courseId, t);

    return {
      session_progress: {
        session_id: Number(sessionId),
        completed: Boolean(progress.completed),
        completed_at: progress.completed_at,
        last_accessed_at: progress.updated_at,
      },
      course_progress: courseProgressResult,
    };
  });
};

/**
 * Get individual session progress for student
 */
const getSessionProgress = async (studentId, sessionId) => {
  await verifyStudentSessionAccess(studentId, sessionId);

  const progress = await SessionProgress.findOne({
    where: { session_id: sessionId, student_id: studentId },
  });

  if (!progress) {
    return {
      session_id: Number(sessionId),
      completed: false,
      completed_at: null,
      last_accessed_at: null,
    };
  }

  return {
    session_id: Number(sessionId),
    completed: Boolean(progress.completed),
    completed_at: progress.completed_at,
    last_accessed_at: progress.updated_at,
  };
};

/**
 * Get course progress for student
 */
const getCourseProgress = async (studentId, courseId) => {
  const batches = await CourseBatch.findAll({
    where: { course_id: courseId },
    attributes: ["id"],
  });
  const batchIds = batches.map((b) => b.id);

  if (!batchIds.length) {
    const err = new Error("No batches found for this course");
    err.status = 403;
    throw err;
  }

  const enrollment = await CourseStudent.findOne({
    where: {
      student_id: studentId,
      batch_id: { [Op.in]: batchIds },
      status: "ACTIVE",
    },
  });

  if (!enrollment) {
    const err = new Error("You are not enrolled in this course");
    err.status = 403;
    throw err;
  }

  return await recalculateCourseProgress(studentId, courseId);
};

/**
 * Get all courses progress for the student
 */
const getAllStudentCoursesProgress = async (studentId) => {
  const enrollments = await CourseStudent.findAll({
    where: { student_id: studentId, status: "ACTIVE" },
    include: [
      {
        model: CourseBatch,
        as: "batch",
        include: [{ model: Course, as: "course" }],
      },
    ],
  });

  const courseMap = new Map();
  for (const enr of enrollments) {
    const course = enr.batch?.course;
    if (course && !courseMap.has(course.id)) {
      courseMap.set(course.id, course);
    }
  }

  const results = [];
  for (const [courseId, course] of courseMap.entries()) {
    const prog = await recalculateCourseProgress(studentId, courseId);
    results.push({
      course_id: course.id,
      course_name: course.name,
      course_code: course.code,
      progress_percentage: prog.progress_percentage,
      completed_sessions: prog.completed_sessions,
      total_sessions: prog.total_sessions,
      status: prog.status,
      completed: prog.completed,
      completed_at: prog.completed_at,
      last_session_id: prog.last_session_id,
      last_accessed_at: prog.last_accessed_at,
    });
  }

  return results;
};

module.exports = {
  verifyStudentSessionAccess,
  recordSessionAccess,
  markSessionCompleted,
  getSessionProgress,
  getCourseProgress,
  getAllStudentCoursesProgress,
  recalculateCourseProgress,
};
