const { Op } = require("sequelize");
const {
  Course,
  CourseBatch,
  CourseInstructor,
  CourseModule,
  Lecture,
  Quiz,
} = require("../models");

/**
 * Resolves active instructor ID considering admin proxy header (x-instructor-id)
 */
const resolveInstructorId = (req) => {
  if (req.user && req.user.role === "ADMIN") {
    const overrideId = req.query.instructor_id || req.headers["x-instructor-id"];
    if (overrideId) {
      const parsed = parseInt(overrideId, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return null; // pure admin without proxy: unrestricted
  }
  return req.user ? req.user.id : null;
};

/**
 * Get all course IDs that an instructor has authorized access to
 * (via active batch assignments in batch_instructors or created_by)
 */
const getInstructorCourseIds = async (instructorId) => {
  if (!instructorId) return [];

  const [batchAssignments, createdCourses] = await Promise.all([
    CourseInstructor.findAll({
      where: {
        instructor_id: instructorId,
        status: "ACTIVE",
      },
      include: [
        {
          model: CourseBatch,
          as: "batch",
          attributes: ["id", "course_id"],
          required: true,
        },
      ],
      attributes: ["id", "batch_id"],
    }),
    Course.findAll({
      where: {
        created_by: instructorId,
      },
      attributes: ["id"],
    }),
  ]);

  const fromBatches = batchAssignments
    .map((a) => a.batch?.course_id)
    .filter((id) => id !== null && id !== undefined);

  const fromCreated = createdCourses.map((c) => c.id);

  return [...new Set([...fromBatches, ...fromCreated])];
};

/**
 * Checks if user/instructor has access to a specific course
 */
const hasCourseAccess = async (user, courseId, overrideInstructorId = null) => {
  if (!user) return false;
  if (user.role === "ADMIN" && !overrideInstructorId) return true;

  const instructorId = overrideInstructorId || user.id;
  const allowedIds = await getInstructorCourseIds(instructorId);
  return allowedIds.includes(Number(courseId));
};

/**
 * Checks if user/instructor has access to a specific course module
 */
const hasModuleAccess = async (user, moduleId, overrideInstructorId = null) => {
  if (!user) return false;
  if (user.role === "ADMIN" && !overrideInstructorId) return true;

  const mod = await CourseModule.findByPk(moduleId);
  if (!mod) return false;

  return hasCourseAccess(user, mod.course_id, overrideInstructorId);
};

/**
 * Checks if user/instructor has access to a specific quiz
 */
const hasQuizAccess = async (user, quizId, overrideInstructorId = null) => {
  if (!user) return false;
  if (user.role === "ADMIN" && !overrideInstructorId) return true;

  const instructorId = overrideInstructorId || user.id;

  const quiz = await Quiz.findByPk(quizId, {
    include: [
      {
        model: Lecture,
        as: "session",
        attributes: ["id", "module_id"],
      },
    ],
  });

  if (!quiz) return false;

  // Creator always has access
  if (quiz.created_by && Number(quiz.created_by) === Number(instructorId)) {
    return true;
  }

  // Check direct course_id
  if (quiz.course_id) {
    return hasCourseAccess(user, quiz.course_id, instructorId);
  }

  // Check module_id
  if (quiz.module_id) {
    return hasModuleAccess(user, quiz.module_id, instructorId);
  }

  // Check session module
  if (quiz.session?.module_id) {
    return hasModuleAccess(user, quiz.session.module_id, instructorId);
  }

  return false;
};

module.exports = {
  resolveInstructorId,
  getInstructorCourseIds,
  hasCourseAccess,
  hasModuleAccess,
  hasQuizAccess,
};
