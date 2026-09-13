const { Op, fn, col, literal } = require("sequelize");
const {
  User,
  UserRole,
  Course,
  CourseBatch,
  CourseStudent,
  CourseInstructor,
  CourseModule,
  Lecture,
  Quiz,
  QuizAttempt,
  SessionProgress,
  CourseProgress,
  UserDevice,
  CourseReview,
} = require("../models");

/**
 * Platform Overview / KPI Summary
 */
const getOverviewStats = async () => {
  // 1. User counts
  const [totalStudents, totalInstructors, totalAdmins, activeUsers] = await Promise.all([
    User.count({ where: { role_id: 3 } }),
    User.count({ where: { role_id: 2 } }),
    User.count({ where: { role_id: 1 } }),
    User.count({ where: { status: "ACTIVE" } }),
  ]);

  // 2. Course & Batch counts
  const [totalCourses, activeCourses, totalBatches, activeBatches] = await Promise.all([
    Course.count(),
    Course.count({ where: { status: "ACTIVE" } }),
    CourseBatch.count(),
    CourseBatch.count({ where: { status: "ACTIVE" } }),
  ]);

  // 3. Quizzes & Assessments
  const [totalQuizzes, totalAttempts, passedAttempts] = await Promise.all([
    Quiz.count(),
    QuizAttempt.count({ where: { status: { [Op.in]: ["SUBMITTED", "AUTO_SUBMITTED"] } } }),
    QuizAttempt.count({
      where: {
        status: { [Op.in]: ["SUBMITTED", "AUTO_SUBMITTED"] },
        passed: true,
      },
    }),
  ]);

  const quizPassRate = totalAttempts > 0 ? ((passedAttempts / totalAttempts) * 100).toFixed(1) : 0;

  // 4. Progress averages
  const progressStats = await CourseProgress.findOne({
    attributes: [
      [fn("AVG", col("completion_percentage")), "avgCompletion"],
      [fn("COUNT", col("id")), "totalEnrollmentsTracked"],
    ],
    raw: true,
  });

  const avgCompletionPercentage = progressStats?.avgCompletion
    ? parseFloat(progressStats.avgCompletion).toFixed(1)
    : 0;

  // 5. Course Reviews average
  const reviewStats = await CourseReview.findOne({
    where: { status: "ACTIVE" },
    attributes: [
      [fn("AVG", col("rating")), "avgRating"],
      [fn("COUNT", col("id")), "totalReviews"],
    ],
    raw: true,
  });

  const avgCourseRating = reviewStats?.avgRating
    ? parseFloat(reviewStats.avgRating).toFixed(1)
    : 0;

  // 6. Active Devices
  const activeDevices = await UserDevice.count({ where: { status: "ACTIVE" } });

  return {
    users: {
      totalStudents,
      totalInstructors,
      totalAdmins,
      activeUsers,
    },
    academic: {
      totalCourses,
      activeCourses,
      totalBatches,
      activeBatches,
      avgCompletionPercentage: Number(avgCompletionPercentage),
    },
    assessments: {
      totalQuizzes,
      totalAttempts,
      passedAttempts,
      quizPassRate: Number(quizPassRate),
    },
    reviews: {
      totalReviews: Number(reviewStats?.totalReviews || 0),
      avgCourseRating: Number(avgCourseRating),
    },
    security: {
      activeDevices,
    },
  };
};

/**
 * Student Progress & Completion Report
 */
const getStudentProgressReport = async (filters = {}) => {
  const { courseId, batchId, status, search } = filters;

  const whereStudent = { role_id: 3 };
  if (status) {
    whereStudent.status = status;
  }
  if (search) {
    whereStudent[Op.or] = [
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { contact_no: { [Op.like]: `%${search}%` } },
      { username: { [Op.like]: `%${search}%` } },
    ];
  }

  const batchStudentWhere = {};
  if (batchId) {
    batchStudentWhere.batch_id = Number(batchId);
  }

  const courseWhere = {};
  if (courseId) {
    courseWhere.id = Number(courseId);
  }

  // Fetch student batch enrollments with course and progress
  const enrollments = await CourseStudent.findAll({
    where: batchStudentWhere,
    include: [
      {
        model: User,
        as: "student",
        where: whereStudent,
        attributes: [
          "id",
          "first_name",
          "last_name",
          "username",
          "email",
          "contact_no",
          "status",
          "created_at",
        ],
      },
      {
        model: CourseBatch,
        as: "batch",
        include: [
          {
            model: Course,
            as: "course",
            where: courseWhere,
            attributes: ["id", "code", "name"],
          },
        ],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  // Collect progress records for student-course pairs
  const studentIds = [...new Set(enrollments.map((e) => e.student_id))];
  const courseIds = [...new Set(enrollments.map((e) => e.batch?.course?.id).filter(Boolean))];

  const progressRecords = await CourseProgress.findAll({
    where: {
      student_id: { [Op.in]: studentIds },
      course_id: { [Op.in]: courseIds },
    },
    raw: true,
  });

  const progressMap = new Map();
  progressRecords.forEach((pr) => {
    progressMap.set(`${pr.student_id}_${pr.course_id}`, pr);
  });

  return enrollments.map((enrollment) => {
    const student = enrollment.student;
    const batch = enrollment.batch;
    const course = batch?.course;
    const progress = (course && student) ? progressMap.get(`${student.id}_${course.id}`) : null;

    return {
      enrollment_id: enrollment.id,
      student_id: student?.id,
      student_name: student ? `${student.first_name} ${student.last_name}`.trim() : "Unknown",
      username: student?.username || "",
      email: student?.email || "",
      contact_no: student?.contact_no || "",
      student_status: student?.status || "INACTIVE",
      enrollment_date: enrollment.enrollment_date,
      enrollment_status: enrollment.status,
      batch_id: batch?.id,
      batch_name: batch?.name || "Unassigned",
      batch_code: batch?.batch_code || "",
      course_id: course?.id,
      course_code: course?.code || "",
      course_name: course?.name || "Unassigned",
      completion_percentage: progress ? Number(progress.completion_percentage) : 0,
      completed_sessions: progress ? Number(progress.completed_sessions) : 0,
      total_sessions: progress ? Number(progress.total_sessions) : 0,
      is_completed: progress ? Boolean(progress.completed) : false,
      completed_at: progress?.completed_at || null,
    };
  });
};

/**
 * Quiz & Assessment Performance Report
 */
const getQuizPerformanceReport = async (filters = {}) => {
  const { quizId, courseId, passed, status, search } = filters;

  const attemptWhere = {};
  if (status) {
    attemptWhere.status = status;
  }
  if (passed !== undefined && passed !== "") {
    attemptWhere.passed = passed === "true" || passed === true;
  }
  if (quizId) {
    attemptWhere.quiz_id = Number(quizId);
  }

  const studentWhere = {};
  if (search) {
    studentWhere[Op.or] = [
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { username: { [Op.like]: `%${search}%` } },
    ];
  }

  const quizWhere = {};
  if (courseId) {
    quizWhere.course_id = Number(courseId);
  }

  const attempts = await QuizAttempt.findAll({
    where: attemptWhere,
    include: [
      {
        model: User,
        as: "student",
        where: studentWhere,
        attributes: ["id", "first_name", "last_name", "username", "email", "contact_no"],
      },
      {
        model: Quiz,
        as: "quiz",
        where: quizWhere,
        attributes: [
          "id",
          "title",
          "passing_marks",
          "course_id",
          "duration_minutes",
        ],
        include: [
          {
            model: Course,
            as: "course",
            attributes: ["id", "code", "name"],
          },
        ],
      },
    ],
    order: [["submitted_at", "DESC"], ["created_at", "DESC"]],
  });

  return attempts.map((att) => {
    const student = att.student;
    const quiz = att.quiz;
    const course = quiz?.course;
    const score = Number(att.score || 0);
    const totalMarks = Number(att.total_marks || 0);
    const scorePct = totalMarks > 0 ? ((score / totalMarks) * 100).toFixed(1) : "0.0";

    return {
      attempt_id: att.id,
      student_id: student?.id,
      student_name: student ? `${student.first_name} ${student.last_name}`.trim() : "Unknown",
      student_email: student?.email || "",
      quiz_id: quiz?.id,
      quiz_title: quiz?.title || "Untitled Quiz",
      course_id: course?.id,
      course_name: course?.name || "N/A",
      course_code: course?.code || "",
      attempt_number: att.attempt_number,
      status: att.status,
      score,
      total_marks: totalMarks,
      percentage: Number(scorePct),
      passing_marks: Number(quiz?.passing_marks || 0),
      passed: Boolean(att.passed),
      started_at: att.started_at,
      submitted_at: att.submitted_at,
    };
  });
};

/**
 * Batches & Capacity Utilization Report
 */
const getBatchAnalyticsReport = async (filters = {}) => {
  const { status, batchMode, courseId } = filters;

  const whereClause = {};
  if (status) whereClause.status = status;
  if (batchMode) whereClause.batch_mode = batchMode;
  if (courseId) whereClause.course_id = Number(courseId);

  const batches = await CourseBatch.findAll({
    where: whereClause,
    include: [
      {
        model: Course,
        as: "course",
        attributes: ["id", "code", "name", "duration"],
      },
      {
        model: CourseStudent,
        as: "students",
        attributes: ["id", "status"],
      },
      {
        model: CourseInstructor,
        as: "instructors",
        include: [
          {
            model: User,
            as: "instructor",
            attributes: ["id", "first_name", "last_name", "email"],
          },
        ],
      },
    ],
    order: [["start_date", "DESC"]],
  });

  return batches.map((batch) => {
    const students = batch.students || [];
    const activeStudents = students.filter((s) => s.status === "ACTIVE").length;
    const completedStudents = students.filter((s) => s.status === "COMPLETED").length;
    const droppedStudents = students.filter((s) => s.status === "DROPPED").length;

    const instructors = (batch.instructors || [])
      .map((ci) => (ci.instructor ? `${ci.instructor.first_name} ${ci.instructor.last_name}`.trim() : null))
      .filter(Boolean);

    return {
      batch_id: batch.id,
      batch_name: batch.name,
      batch_code: batch.batch_code || "",
      course_id: batch.course?.id,
      course_code: batch.course?.code || "",
      course_name: batch.course?.name || "Unassigned",
      status: batch.status,
      batch_mode: batch.batch_mode,
      batch_time: batch.batch_time,
      batch_schedule: batch.batch_schedule,
      start_date: batch.start_date,
      end_date: batch.end_date,
      instructors: instructors.join(", ") || "None",
      total_enrolled: students.length,
      active_enrolled: activeStudents,
      completed_enrolled: completedStudents,
      dropped_enrolled: droppedStudents,
    };
  });
};

/**
 * Course Feedback & Student Reviews Report
 */
const getCourseFeedbackReport = async (filters = {}) => {
  const { courseId, rating, status } = filters;

  const whereClause = {};
  if (courseId) whereClause.course_id = Number(courseId);
  if (rating) whereClause.rating = Number(rating);
  if (status) whereClause.status = status;

  const reviews = await CourseReview.findAll({
    where: whereClause,
    include: [
      {
        model: Course,
        as: "course",
        attributes: ["id", "code", "name"],
      },
      {
        model: User,
        as: "student",
        attributes: ["id", "first_name", "last_name", "email", "username"],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return reviews.map((rev) => ({
    review_id: rev.id,
    course_id: rev.course?.id,
    course_code: rev.course?.code || "",
    course_name: rev.course?.name || "",
    student_id: rev.student?.id,
    student_name: rev.student ? `${rev.student.first_name} ${rev.student.last_name}`.trim() : "Anonymous",
    student_email: rev.student?.email || "",
    rating: rev.rating,
    review_text: rev.review || "",
    status: rev.status,
    submitted_at: rev.created_at,
  }));
};

/**
 * Security, Device & Login Audit Report
 */
const getSecurityAuditReport = async (filters = {}) => {
  const { status, deviceType, search } = filters;

  const whereClause = {};
  if (status) whereClause.status = status;
  if (deviceType) whereClause.device_type = deviceType;

  const userWhere = {};
  if (search) {
    userWhere[Op.or] = [
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { username: { [Op.like]: `%${search}%` } },
    ];
  }

  const devices = await UserDevice.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: "user",
        where: userWhere,
        attributes: ["id", "first_name", "last_name", "username", "email", "role_id", "status"],
        include: [
          {
            model: UserRole,
            as: "role",
            attributes: ["id", "name"],
          },
        ],
      },
    ],
    order: [["last_active_at", "DESC"], ["created_at", "DESC"]],
  });

  return devices.map((dev) => ({
    id: dev.id,
    user_id: dev.user?.id,
    user_name: dev.user ? `${dev.user.first_name} ${dev.user.last_name}`.trim() : "Unknown",
    username: dev.user?.username || "",
    email: dev.user?.email || "",
    role: dev.user?.role?.name || (dev.user?.role_id === 1 ? "ADMIN" : dev.user?.role_id === 2 ? "INSTRUCTOR" : "STUDENT"),
    user_status: dev.user?.status || "ACTIVE",
    device_id: dev.device_id,
    device_name: dev.device_name || "Standard Browser",
    device_type: dev.device_type || "DESKTOP",
    browser: dev.browser || "Unknown",
    operating_system: dev.operating_system || "Unknown",
    last_ip_address: dev.last_ip_address || "N/A",
    last_login_at: dev.last_login_at,
    last_active_at: dev.last_active_at,
    device_status: dev.status,
  }));
};

/**
 * Individual Student 360° Comprehensive Dossier Report
 * Aggregates complete academic, session, quiz, review, and security history for one student.
 */
const getStudentDossierReport = async (studentId) => {
  const numericId = Number(studentId);
  if (!numericId || isNaN(numericId)) {
    throw new Error("Invalid student ID provided");
  }

  // 1. Fetch Student Profile
  const student = await User.findOne({
    where: { id: numericId },
    attributes: [
      "id",
      "first_name",
      "last_name",
      "username",
      "email",
      "contact_no",
      "gender",
      "date_of_birth",
      "status",
      "photo",
      "created_at",
      "updated_at",
    ],
    include: [
      {
        model: UserRole,
        as: "role",
        attributes: ["id", "name"],
      },
    ],
  });

  if (!student) {
    throw new Error("Student not found");
  }

  // 2. Fetch Enrolled Batches & Courses
  const enrollments = await CourseStudent.findAll({
    where: { student_id: numericId },
    include: [
      {
        model: CourseBatch,
        as: "batch",
        include: [
          {
            model: Course,
            as: "course",
            attributes: ["id", "code", "name", "description", "duration"],
          },
          {
            model: CourseInstructor,
            as: "instructors",
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
    order: [["created_at", "DESC"]],
  });

  // 3. Course Progress Records
  const courseProgressList = await CourseProgress.findAll({
    where: { student_id: numericId },
    include: [
      {
        model: Course,
        as: "course",
        attributes: ["id", "code", "name"],
      },
    ],
  });

  // 4. Session Progress Records
  const sessionProgressList = await SessionProgress.findAll({
    where: { student_id: numericId },
    include: [
      {
        model: Lecture,
        as: "session",
        attributes: [
          "id",
          "title",
          "session_type",
          "status",
          "duration_minutes",
          "scheduled_at",
          "module_id",
        ],
        include: [
          {
            model: CourseModule,
            as: "module",
            attributes: ["id", "title", "course_id"],
            include: [
              {
                model: Course,
                as: "course",
                attributes: ["id", "code", "name"],
              },
            ],
          },
        ],
      },
    ],
    order: [["completed_at", "DESC"], ["created_at", "DESC"]],
  });

  // 5. Quiz Attempts History
  const quizAttempts = await QuizAttempt.findAll({
    where: { student_id: numericId },
    include: [
      {
        model: Quiz,
        as: "quiz",
        attributes: [
          "id",
          "title",
          "duration_minutes",
          "passing_marks",
          "course_id",
          "module_id",
          "session_id",
        ],
        include: [
          {
            model: Course,
            as: "course",
            attributes: ["id", "code", "name"],
          },
        ],
      },
    ],
    order: [["submitted_at", "DESC"], ["created_at", "DESC"]],
  });

  // 6. Registered Devices
  const devices = await UserDevice.findAll({
    where: { user_id: numericId },
    order: [["last_active_at", "DESC"]],
  });

  // 7. Course Reviews Submitted
  const reviews = await CourseReview.findAll({
    where: { student_id: numericId },
    include: [
      {
        model: Course,
        as: "course",
        attributes: ["id", "code", "name"],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  // Compute 360 KPIs
  const totalEnrolled = enrollments.length;
  const completedCourses = courseProgressList.filter((cp) => cp.completed).length;
  const totalSessionsCompleted = sessionProgressList.filter((sp) => sp.completed).length;

  const totalAttempts = quizAttempts.length;
  const passedAttempts = quizAttempts.filter((qa) => qa.passed).length;
  const avgQuizScore =
    totalAttempts > 0
      ? (
          quizAttempts.reduce((acc, curr) => {
            const score = Number(curr.score || 0);
            const total = Number(curr.total_marks || 0);
            return acc + (total > 0 ? (score / total) * 100 : 0);
          }, 0) / totalAttempts
        ).toFixed(1)
      : 0;

  const overallAvgProgress =
    courseProgressList.length > 0
      ? (
          courseProgressList.reduce(
            (acc, curr) => acc + Number(curr.completion_percentage || 0),
            0
          ) / courseProgressList.length
        ).toFixed(1)
      : 0;

  return {
    student: {
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      full_name: `${student.first_name} ${student.last_name}`.trim(),
      username: student.username,
      email: student.email,
      contact_no: student.contact_no,
      gender: student.gender,
      date_of_birth: student.date_of_birth,
      status: student.status,
      photo: student.photo,
      created_at: student.created_at,
    },
    kpi: {
      total_courses_enrolled: totalEnrolled,
      completed_courses: completedCourses,
      overall_avg_progress: Number(overallAvgProgress),
      total_sessions_completed: totalSessionsCompleted,
      total_quiz_attempts: totalAttempts,
      passed_quiz_attempts: passedAttempts,
      avg_quiz_score_pct: Number(avgQuizScore),
      active_devices_count: devices.filter((d) => d.status === "ACTIVE").length,
    },
    enrollments: enrollments.map((e) => {
      const batch = e.batch;
      const course = batch?.course;
      const progress = courseProgressList.find((cp) => cp.course_id === course?.id);

      return {
        enrollment_id: e.id,
        enrollment_date: e.enrollment_date,
        enrollment_status: e.status,
        batch_id: batch?.id,
        batch_name: batch?.name || "N/A",
        batch_code: batch?.batch_code || "",
        batch_mode: batch?.batch_mode,
        course_id: course?.id,
        course_code: course?.code || "",
        course_name: course?.name || "N/A",
        instructors: (batch?.instructors || [])
          .map((i) => (i.instructor ? `${i.instructor.first_name} ${i.instructor.last_name}`.trim() : null))
          .filter(Boolean)
          .join(", "),
        completion_percentage: progress ? Number(progress.completion_percentage) : 0,
        completed_sessions: progress ? Number(progress.completed_sessions) : 0,
        total_sessions: progress ? Number(progress.total_sessions) : 0,
        is_completed: progress ? Boolean(progress.completed) : false,
        completed_at: progress?.completed_at || null,
      };
    }),
    sessions: sessionProgressList.map((sp) => ({
      id: sp.id,
      session_id: sp.session_id,
      title: sp.session?.title || "Untitled Session",
      session_type: sp.session?.session_type,
      duration_minutes: sp.session?.duration_minutes,
      module_title: sp.session?.module?.title || "N/A",
      course_name: sp.session?.module?.course?.name || "N/A",
      course_code: sp.session?.module?.course?.code || "",
      completed: Boolean(sp.completed),
      completed_at: sp.completed_at,
    })),
    quizzes: quizAttempts.map((qa) => {
      const quiz = qa.quiz;
      const course = quiz?.course;
      const score = Number(qa.score || 0);
      const totalMarks = Number(qa.total_marks || 0);
      const pct = totalMarks > 0 ? ((score / totalMarks) * 100).toFixed(1) : 0;

      return {
        attempt_id: qa.id,
        quiz_id: quiz?.id,
        quiz_title: quiz?.title || "Untitled Quiz",
        course_code: course?.code || "",
        course_name: course?.name || "N/A",
        attempt_number: qa.attempt_number,
        status: qa.status,
        score,
        total_marks: totalMarks,
        percentage: Number(pct),
        passed: Boolean(qa.passed),
        passing_marks: Number(quiz?.passing_marks || 0),
        started_at: qa.started_at,
        submitted_at: qa.submitted_at,
      };
    }),
    devices: devices.map((d) => ({
      id: d.id,
      device_id: d.device_id,
      device_name: d.device_name,
      device_type: d.device_type,
      browser: d.browser,
      operating_system: d.operating_system,
      last_ip_address: d.last_ip_address,
      last_login_at: d.last_login_at,
      last_active_at: d.last_active_at,
      status: d.status,
    })),
    reviews: reviews.map((r) => ({
      id: r.id,
      course_id: r.course_id,
      course_code: r.course?.code || "",
      course_name: r.course?.name || "",
      rating: r.rating,
      review: r.review,
      status: r.status,
      created_at: r.created_at,
    })),
  };
};

module.exports = {
  getOverviewStats,
  getStudentProgressReport,
  getQuizPerformanceReport,
  getBatchAnalyticsReport,
  getCourseFeedbackReport,
  getSecurityAuditReport,
  getStudentDossierReport,
};
