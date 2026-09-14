const { Op } = require("sequelize");
const sequelize = require("../config/database");
const {
  Quiz,
  QuizQuestion,
  QuizOption,
  QuizAttempt,
  QuizAttemptAnswer,
  Lecture,
  CourseModule,
  Course,
  User,
} = require("../models");
const { resolveLanguage } = require("../config/judge0Languages");
const { parseQuizCsv, getSampleCsvString } = require("../utils/quizCsvParser");

/**
 * List all quizzes with optional filters
 */
const listQuizzes = async ({ sessionId, moduleId, courseId, status, search, allowedCourseIds, instructorId }) => {
  const where = {};
  if (sessionId) where.session_id = Number(sessionId);
  if (moduleId) where.module_id = Number(moduleId);
  if (courseId) where.course_id = Number(courseId);
  if (status) where.status = status;
  if (search) {
    where.title = { [Op.like]: `%${search.trim()}%` };
  }

  if (Array.isArray(allowedCourseIds)) {
    const allowedModules =
      allowedCourseIds.length > 0
        ? await CourseModule.findAll({
            where: { course_id: { [Op.in]: allowedCourseIds } },
            attributes: ["id"],
          })
        : [];
    const allowedModuleIds = allowedModules.map((m) => m.id);

    const allowedSessions =
      allowedModuleIds.length > 0
        ? await Lecture.findAll({
            where: { module_id: { [Op.in]: allowedModuleIds } },
            attributes: ["id"],
          })
        : [];
    const allowedSessionIds = allowedSessions.map((s) => s.id);

    const orConditions = [];
    if (allowedCourseIds.length > 0) orConditions.push({ course_id: { [Op.in]: allowedCourseIds } });
    if (allowedModuleIds.length > 0) orConditions.push({ module_id: { [Op.in]: allowedModuleIds } });
    if (allowedSessionIds.length > 0) orConditions.push({ session_id: { [Op.in]: allowedSessionIds } });
    if (instructorId) orConditions.push({ created_by: instructorId });

    if (orConditions.length === 0) {
      return [];
    }

    where[Op.and] = where[Op.and] ? [...where[Op.and], { [Op.or]: orConditions }] : [{ [Op.or]: orConditions }];
  }

  const quizzes = await Quiz.findAll({
    where,
    include: [
      {
        model: Lecture,
        as: "session",
        attributes: ["id", "title", "module_id"],
        required: false,
      },
      {
        model: CourseModule,
        as: "module",
        attributes: ["id", "name", "course_id"],
        required: false,
        include: [
          {
            model: Course,
            as: "course",
            attributes: ["id", "name", "code"],
          },
        ],
      },
      {
        model: Course,
        as: "course",
        attributes: ["id", "name", "code"],
        required: false,
      },
      {
        model: QuizQuestion,
        as: "questions",
        attributes: ["id", "question_type", "marks", "status"],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return quizzes.map((q) => {
    const json = q.toJSON();
    const activeQuestions = (json.questions || []).filter((qn) => qn.status === "ACTIVE");
    return {
      ...json,
      question_count: activeQuestions.length,
      mcq_count: activeQuestions.filter((qn) => qn.question_type === "MCQ").length,
      coding_count: activeQuestions.filter((qn) => qn.question_type === "CODING").length,
    };
  });
};

/**
 * Get a single quiz by ID with full questions and options
 */
const getQuizById = async (quizId, { includeCorrect = true } = {}) => {
  const quiz = await Quiz.findByPk(quizId, {
    include: [
      {
        model: Lecture,
        as: "session",
        attributes: ["id", "title", "session_type", "module_id"],
        required: false,
      },
      {
        model: CourseModule,
        as: "module",
        attributes: ["id", "name", "course_id"],
        required: false,
        include: [
          {
            model: Course,
            as: "course",
            attributes: ["id", "name", "code"],
          },
        ],
      },
      {
        model: Course,
        as: "course",
        attributes: ["id", "name", "code"],
        required: false,
      },
      {
        model: QuizQuestion,
        as: "questions",
        where: { status: "ACTIVE" },
        required: false,
        include: [
          {
            model: QuizOption,
            as: "options",
            attributes: includeCorrect
              ? ["id", "option_label", "option_text", "is_correct", "display_order"]
              : ["id", "option_label", "option_text", "display_order"],
            required: false,
          },
        ],
      },
    ],
    order: [
      [{ model: QuizQuestion, as: "questions" }, "display_order", "ASC"],
      [{ model: QuizQuestion, as: "questions" }, "id", "ASC"],
      [
        { model: QuizQuestion, as: "questions" },
        { model: QuizOption, as: "options" },
        "display_order",
        "ASC",
      ],
      [
        { model: QuizQuestion, as: "questions" },
        { model: QuizOption, as: "options" },
        "id",
        "ASC",
      ],
    ],
  });

  if (!quiz) return null;

  return quiz;
};

/**
 * Create a new quiz
 */
const createQuiz = async ({
  sessionId,
  moduleId,
  courseId,
  title,
  description,
  instructions,
  duration_minutes,
  passing_marks,
  max_attempts = 1,
  available_from,
  available_until,
  userId,
}) => {
  let resolvedModuleId = moduleId ? Number(moduleId) : null;
  let resolvedCourseId = courseId ? Number(courseId) : null;
  let resolvedSessionId = sessionId ? Number(sessionId) : null;

  if (resolvedSessionId && (!resolvedModuleId || !resolvedCourseId)) {
    const session = await Lecture.findByPk(resolvedSessionId, {
      include: [{ model: CourseModule, as: "module" }],
    });
    if (session) {
      if (!resolvedModuleId) resolvedModuleId = session.module_id;
      if (!resolvedCourseId && session.module) resolvedCourseId = session.module.course_id;
    }
  }

  if (resolvedModuleId && !resolvedCourseId) {
    const mod = await CourseModule.findByPk(resolvedModuleId);
    if (mod) resolvedCourseId = mod.course_id;
  }

  if (!resolvedModuleId && !resolvedSessionId && !resolvedCourseId) {
    throw new Error("Course Module or Session is required for creating a quiz");
  }

  const cleanTitle = (title || "").trim();
  if (!cleanTitle) {
    throw new Error("Quiz title is required");
  }

  const parsedDuration = duration_minutes ? Number(duration_minutes) : null;
  if (parsedDuration !== null && (isNaN(parsedDuration) || parsedDuration <= 0)) {
    throw new Error("Duration must be a positive integer in minutes");
  }

  const parsedMaxAttempts = max_attempts !== undefined ? Number(max_attempts) : 1;
  if (isNaN(parsedMaxAttempts) || parsedMaxAttempts <= 0) {
    throw new Error("Max attempts must be at least 1");
  }

  const quiz = await Quiz.create({
    session_id: resolvedSessionId,
    module_id: resolvedModuleId,
    course_id: resolvedCourseId,
    title: cleanTitle,
    description: description ? String(description).trim() : null,
    instructions: instructions ? String(instructions).trim() : null,
    duration_minutes: parsedDuration,
    total_marks: 0.0,
    passing_marks: passing_marks !== undefined && passing_marks !== null && passing_marks !== "" ? Number(passing_marks) : null,
    max_attempts: parsedMaxAttempts,
    status: "DRAFT",
    available_from: available_from ? new Date(available_from) : null,
    available_until: available_until ? new Date(available_until) : null,
    created_by: userId || null,
    updated_by: userId || null,
  });

  return await getQuizById(quiz.id);
};

/**
 * Update quiz metadata
 */
const updateQuiz = async (quizId, data, userId) => {
  const quiz = await Quiz.findByPk(quizId);
  if (!quiz) {
    throw new Error("Quiz not found");
  }

  if (quiz.status === "CLOSED") {
    throw new Error("Cannot edit a closed quiz");
  }

  if (data.title !== undefined) {
    const cleanTitle = String(data.title).trim();
    if (!cleanTitle) throw new Error("Quiz title cannot be empty");
    quiz.title = cleanTitle;
  }

  if (data.description !== undefined) {
    quiz.description = data.description ? String(data.description).trim() : null;
  }

  if (data.instructions !== undefined) {
    quiz.instructions = data.instructions ? String(data.instructions).trim() : null;
  }

  if (data.duration_minutes !== undefined) {
    if (data.duration_minutes === null || data.duration_minutes === "") {
      quiz.duration_minutes = null;
    } else {
      const parsed = Number(data.duration_minutes);
      if (isNaN(parsed) || parsed <= 0) throw new Error("Duration must be a positive integer");
      quiz.duration_minutes = parsed;
    }
  }

  if (data.passing_marks !== undefined) {
    if (data.passing_marks === null || data.passing_marks === "") {
      quiz.passing_marks = null;
    } else {
      const parsed = Number(data.passing_marks);
      if (isNaN(parsed) || parsed < 0) throw new Error("Passing marks must be a non-negative number");
      quiz.passing_marks = parsed;
    }
  }

  if (data.max_attempts !== undefined) {
    const parsed = Number(data.max_attempts);
    if (isNaN(parsed) || parsed <= 0) throw new Error("Max attempts must be at least 1");
    quiz.max_attempts = parsed;
  }

  if (data.available_from !== undefined) {
    quiz.available_from = data.available_from ? new Date(data.available_from) : null;
  }

  if (data.available_until !== undefined) {
    quiz.available_until = data.available_until ? new Date(data.available_until) : null;
  }

  quiz.updated_by = userId || null;
  await quiz.save();

  return await getQuizById(quiz.id);
};

/**
 * Delete a quiz
 */
const deleteQuiz = async (quizId) => {
  const quiz = await Quiz.findByPk(quizId);
  if (!quiz) {
    throw new Error("Quiz not found");
  }

  // Prevent hard deletion if submitted student attempts exist
  const attemptsCount = await QuizAttempt.count({
    where: { quiz_id: quizId, status: { [Op.in]: ["SUBMITTED", "AUTO_SUBMITTED"] } },
  });

  if (attemptsCount > 0) {
    throw new Error(
      `Cannot delete quiz with ${attemptsCount} submitted student attempt(s). You can close or cancel the quiz instead.`
    );
  }

  await quiz.destroy();
  return { success: true, message: "Quiz deleted successfully" };
};

/**
 * Recalculate and update quiz total marks from active questions
 */
const syncQuizTotalMarks = async (quizId) => {
  const questions = await QuizQuestion.findAll({
    where: { quiz_id: quizId, status: "ACTIVE" },
    attributes: ["marks"],
  });

  const total = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
  await Quiz.update({ total_marks: total }, { where: { id: quizId } });
  return total;
};

/**
 * Strict validation and publication of a quiz
 */
const publishQuiz = async (quizId, userId) => {
  const quiz = await Quiz.findByPk(quizId, {
    include: [
      {
        model: Lecture,
        as: "session",
      },
      {
        model: QuizQuestion,
        as: "questions",
        where: { status: "ACTIVE" },
        required: false,
        include: [
          {
            model: QuizOption,
            as: "options",
            required: false,
          },
        ],
      },
    ],
  });

  if (!quiz) {
    throw new Error("Quiz not found");
  }

  if (!quiz.title || !quiz.title.trim()) {
    throw new Error("Quiz title is required to publish");
  }

  if (!quiz.session_id && !quiz.module_id && !quiz.course_id) {
    throw new Error("Quiz must belong to a valid course, module, or session");
  }

  const activeQuestions = quiz.questions || [];
  if (activeQuestions.length === 0) {
    throw new Error("Cannot publish a quiz with no active questions");
  }

  // Validate each question
  for (const q of activeQuestions) {
    const marks = Number(q.marks);
    if (isNaN(marks) || marks <= 0) {
      throw new Error(`Question #${q.id} ("${q.question_text.slice(0, 30)}...") must have marks > 0`);
    }

    if (q.question_type === "MCQ") {
      const options = q.options || [];
      if (options.length < 2) {
        throw new Error(`MCQ Question #${q.id} must have at least 2 options`);
      }
      const correctOptions = options.filter((opt) => Boolean(opt.is_correct));
      if (correctOptions.length !== 1) {
        throw new Error(
          `MCQ Question #${q.id} must have exactly 1 correct option (found ${correctOptions.length})`
        );
      }
    } else if (q.question_type === "CODING") {
      if (!q.programming_language || !q.programming_language.trim()) {
        throw new Error(`Coding Question #${q.id} must have a designated programming language`);
      }
      const resolved = resolveLanguage(q.programming_language);
      if (!resolved) {
        throw new Error(
          `Coding Question #${q.id} has an unsupported programming language: "${q.programming_language}"`
        );
      }
      if (!q.expected_output || !q.expected_output.trim()) {
        throw new Error(`Coding Question #${q.id} must have an expected output configured for test evaluation`);
      }
    }
  }

  // Recalculate total marks
  const totalMarks = await syncQuizTotalMarks(quizId);
  if (totalMarks <= 0) {
    throw new Error("Quiz total marks must be greater than 0");
  }

  // Validate passing marks
  if (quiz.passing_marks !== null && quiz.passing_marks !== undefined) {
    const pass = Number(quiz.passing_marks);
    if (pass > totalMarks) {
      throw new Error(
        `Passing marks (${pass}) cannot be greater than total quiz marks (${totalMarks})`
      );
    }
    if (pass <= 0) {
      throw new Error("Passing marks must be greater than 0");
    }
  }

  quiz.status = "PUBLISHED";
  quiz.total_marks = totalMarks;
  quiz.updated_by = userId || null;
  await quiz.save();

  return await getQuizById(quiz.id);
};

/**
 * Close a quiz
 */
const closeQuiz = async (quizId, userId) => {
  const quiz = await Quiz.findByPk(quizId);
  if (!quiz) {
    throw new Error("Quiz not found");
  }

  quiz.status = "CLOSED";
  quiz.updated_by = userId || null;
  await quiz.save();

  return await getQuizById(quiz.id);
};

/**
 * Add a question to a quiz
 */
const addQuestion = async ({
  quizId,
  question_type,
  question_text,
  marks = 1.0,
  difficulty = "MEDIUM",
  explanation,
  programming_language,
  starter_code,
  constraints,
  expected_output,
  display_order,
  userId,
}) => {
  const quiz = await Quiz.findByPk(quizId);
  if (!quiz) {
    throw new Error("Quiz not found");
  }

  if (quiz.status === "CLOSED") {
    throw new Error("Cannot add questions to a closed quiz");
  }

  if (!["MCQ", "CODING"].includes(question_type)) {
    throw new Error("Invalid question type. Allowed: MCQ, CODING");
  }

  const cleanText = (question_text || "").trim();
  if (!cleanText) {
    throw new Error("Question text is required");
  }

  const parsedMarks = Number(marks);
  if (isNaN(parsedMarks) || parsedMarks <= 0) {
    throw new Error("Question marks must be a positive number");
  }

  if (difficulty && !["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
    throw new Error("Invalid difficulty. Allowed: EASY, MEDIUM, HARD");
  }

  let resolvedLang = null;
  if (question_type === "CODING") {
    if (!programming_language || !String(programming_language).trim()) {
      throw new Error("Programming language is required for coding questions");
    }
    resolvedLang = resolveLanguage(programming_language);
    if (!resolvedLang) {
      throw new Error(`Unsupported programming language: "${programming_language}"`);
    }
  }

  let finalOrder = display_order ? Number(display_order) : null;
  if (!finalOrder) {
    const maxOrder = await QuizQuestion.max("display_order", { where: { quiz_id: quizId } });
    finalOrder = (maxOrder || 0) + 1;
  }

  const question = await QuizQuestion.create({
    quiz_id: quizId,
    question_type,
    question_text: cleanText,
    marks: parsedMarks,
    display_order: finalOrder,
    difficulty: difficulty || "MEDIUM",
    explanation: explanation ? String(explanation).trim() : null,
    programming_language: resolvedLang ? resolvedLang.key : null,
    starter_code: starter_code ? String(starter_code) : (resolvedLang?.default_starter_code || null),
    constraints: constraints ? String(constraints).trim() : null,
    expected_output: expected_output ? String(expected_output).trim() : null,
    status: "ACTIVE",
    created_by: userId || null,
    updated_by: userId || null,
  });

  await syncQuizTotalMarks(quizId);

  return question;
};

/**
 * Update a question
 */
const updateQuestion = async (questionId, data, userId) => {
  const question = await QuizQuestion.findByPk(questionId);
  if (!question) {
    throw new Error("Question not found");
  }

  if (data.question_text !== undefined) {
    const clean = String(data.question_text).trim();
    if (!clean) throw new Error("Question text cannot be empty");
    question.question_text = clean;
  }

  if (data.marks !== undefined) {
    const parsed = Number(data.marks);
    if (isNaN(parsed) || parsed <= 0) throw new Error("Marks must be positive");
    question.marks = parsed;
  }

  if (data.difficulty !== undefined) {
    if (!["EASY", "MEDIUM", "HARD"].includes(data.difficulty)) {
      throw new Error("Invalid difficulty. Allowed: EASY, MEDIUM, HARD");
    }
    question.difficulty = data.difficulty;
  }

  if (data.explanation !== undefined) {
    question.explanation = data.explanation ? String(data.explanation).trim() : null;
  }

  if (data.programming_language !== undefined && question.question_type === "CODING") {
    const resolved = resolveLanguage(data.programming_language);
    if (!resolved) throw new Error(`Unsupported programming language: "${data.programming_language}"`);
    question.programming_language = resolved.key;
  }

  if (data.starter_code !== undefined) {
    question.starter_code = data.starter_code !== null ? String(data.starter_code) : null;
  }

  if (data.constraints !== undefined) {
    question.constraints = data.constraints ? String(data.constraints).trim() : null;
  }

  if (data.expected_output !== undefined) {
    question.expected_output = data.expected_output ? String(data.expected_output).trim() : null;
  }

  if (data.status !== undefined) {
    if (!["ACTIVE", "INACTIVE"].includes(data.status)) {
      throw new Error("Invalid status. Allowed: ACTIVE, INACTIVE");
    }
    question.status = data.status;
  }

  if (data.display_order !== undefined) {
    question.display_order = Number(data.display_order) || question.display_order;
  }

  question.updated_by = userId || null;
  await question.save();

  await syncQuizTotalMarks(question.quiz_id);

  return question;
};

/**
 * Delete a question
 */
const deleteQuestion = async (questionId) => {
  const question = await QuizQuestion.findByPk(questionId);
  if (!question) {
    throw new Error("Question not found");
  }

  const quizId = question.quiz_id;
  await question.destroy();
  await syncQuizTotalMarks(quizId);

  return { success: true, message: "Question deleted successfully" };
};

/**
 * Reorder questions in a quiz
 */
const reorderQuestions = async (quizId, orderList) => {
  if (!Array.isArray(orderList) || orderList.length === 0) {
    throw new Error("Order list must be a non-empty array of { id, display_order }");
  }

  await Promise.all(
    orderList.map((item) =>
      QuizQuestion.update(
        { display_order: Number(item.display_order) || 1 },
        { where: { id: item.id, quiz_id: quizId } }
      )
    )
  );

  return { success: true, message: "Questions reordered successfully" };
};

/**
 * Add an option to an MCQ question
 */
const addOption = async ({
  questionId,
  option_label,
  option_text,
  is_correct = false,
  display_order,
  userId,
}) => {
  const question = await QuizQuestion.findByPk(questionId);
  if (!question) {
    throw new Error("Question not found");
  }

  if (question.question_type !== "MCQ") {
    throw new Error("Options can only be added to MCQ questions");
  }

  const cleanText = (option_text || "").trim();
  if (!cleanText) {
    throw new Error("Option text is required");
  }

  const cleanLabel = (option_label || "").trim().toUpperCase().charAt(0);
  if (!cleanLabel) {
    throw new Error("Option label is required (e.g. A, B, C, D)");
  }

  // Check unique label per question
  const existing = await QuizOption.findOne({
    where: { question_id: questionId, option_label: cleanLabel },
  });
  if (existing) {
    throw new Error(`Option "${cleanLabel}" already exists for this question`);
  }

  let finalOrder = display_order ? Number(display_order) : null;
  if (!finalOrder) {
    const maxOrder = await QuizOption.max("display_order", { where: { question_id: questionId } });
    finalOrder = (maxOrder || 0) + 1;
  }

  const option = await QuizOption.create({
    question_id: questionId,
    option_label: cleanLabel,
    option_text: cleanText,
    is_correct: Boolean(is_correct),
    display_order: finalOrder,
    created_by: userId || null,
    updated_by: userId || null,
  });

  return option;
};

/**
 * Update an option
 */
const updateOption = async (optionId, data, userId) => {
  const option = await QuizOption.findByPk(optionId);
  if (!option) {
    throw new Error("Option not found");
  }

  if (data.option_text !== undefined) {
    const clean = String(data.option_text).trim();
    if (!clean) throw new Error("Option text cannot be empty");
    option.option_text = clean;
  }

  if (data.option_label !== undefined) {
    const cleanLabel = String(data.option_label).trim().toUpperCase().charAt(0);
    if (!cleanLabel) throw new Error("Option label cannot be empty");
    option.option_label = cleanLabel;
  }

  if (data.is_correct !== undefined) {
    option.is_correct = Boolean(data.is_correct);
  }

  if (data.display_order !== undefined) {
    option.display_order = Number(data.display_order) || option.display_order;
  }

  option.updated_by = userId || null;
  await option.save();

  return option;
};

/**
 * Delete an option
 */
const deleteOption = async (optionId) => {
  const option = await QuizOption.findByPk(optionId);
  if (!option) {
    throw new Error("Option not found");
  }

  await option.destroy();
  return { success: true, message: "Option deleted successfully" };
};

/**
 * View all student attempts for a quiz (Instructor/Admin)
 */
const getQuizAttempts = async (quizId) => {
  const quiz = await Quiz.findByPk(quizId, { attributes: ["id", "title", "total_marks", "passing_marks"] });
  if (!quiz) {
    throw new Error("Quiz not found");
  }

  const attempts = await QuizAttempt.findAll({
    where: { quiz_id: quizId },
    include: [
      {
        model: User,
        as: "student",
        attributes: ["id", "first_name", "last_name", "email", "username", "photo"],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return {
    quiz,
    total_attempts: attempts.length,
    attempts,
  };
};

/**
 * View detailed attempt information with questions and answers (Instructor/Admin)
 */
const getAttemptDetails = async (attemptId) => {
  const attempt = await QuizAttempt.findByPk(attemptId, {
    include: [
      {
        model: Quiz,
        as: "quiz",
        include: [
          {
            model: QuizQuestion,
            as: "questions",
            include: [{ model: QuizOption, as: "options" }],
          },
        ],
      },
      {
        model: User,
        as: "student",
        attributes: ["id", "first_name", "last_name", "email", "username", "photo"],
      },
      {
        model: QuizAttemptAnswer,
        as: "answers",
        include: [{ model: QuizOption, as: "selectedOption" }],
      },
    ],
  });

  if (!attempt) {
    throw new Error("Quiz attempt not found");
  }

  return attempt;
};

/**
 * Create a new quiz from CSV content or pre-parsed questions in a single transaction
 */
const createQuizFromCsv = async ({
  sessionId,
  moduleId,
  courseId,
  title,
  description,
  instructions,
  duration_minutes,
  passing_marks,
  max_attempts = 1,
  csvContent,
  questions: inputQuestions,
  userId,
}) => {
  let parsed = { metadata: {}, questions: [] };
  if (csvContent) {
    parsed = parseQuizCsv(csvContent);
  } else if (Array.isArray(inputQuestions) && inputQuestions.length > 0) {
    parsed.questions = inputQuestions;
  } else {
    throw new Error("Either csvContent or a non-empty questions array is required.");
  }

  const effectiveTitle = (title || parsed.metadata.title || "").trim();
  if (!effectiveTitle) {
    throw new Error("Quiz title is required");
  }

  const effectiveDuration =
    duration_minutes !== undefined && duration_minutes !== null && duration_minutes !== ""
      ? Number(duration_minutes)
      : parsed.metadata.duration_minutes || null;

  const effectivePassingMarks =
    passing_marks !== undefined && passing_marks !== null && passing_marks !== ""
      ? Number(passing_marks)
      : parsed.metadata.passing_marks || null;

  let resolvedModuleId = moduleId ? Number(moduleId) : null;
  let resolvedCourseId = courseId ? Number(courseId) : null;
  let resolvedSessionId = sessionId ? Number(sessionId) : null;

  if (resolvedSessionId && (!resolvedModuleId || !resolvedCourseId)) {
    const session = await Lecture.findByPk(resolvedSessionId, {
      include: [{ model: CourseModule, as: "module" }],
    });
    if (session) {
      if (!resolvedModuleId) resolvedModuleId = session.module_id;
      if (!resolvedCourseId && session.module) resolvedCourseId = session.module.course_id;
    }
  }

  if (resolvedModuleId && !resolvedCourseId) {
    const mod = await CourseModule.findByPk(resolvedModuleId);
    if (mod) resolvedCourseId = mod.course_id;
  }

  if (!resolvedModuleId && !resolvedSessionId && !resolvedCourseId) {
    throw new Error("Course Module or Session is required for creating a quiz");
  }

  if (!parsed.questions || parsed.questions.length === 0) {
    throw new Error("Cannot create quiz without any questions");
  }

  // Execute in transaction
  const t = await sequelize.transaction();
  try {
    const quiz = await Quiz.create(
      {
        session_id: resolvedSessionId,
        module_id: resolvedModuleId,
        course_id: resolvedCourseId,
        title: effectiveTitle,
        description: description ? String(description).trim() : null,
        instructions: instructions ? String(instructions).trim() : null,
        duration_minutes: effectiveDuration,
        total_marks: 0.0,
        passing_marks: effectivePassingMarks,
        max_attempts: Number(max_attempts) || 1,
        status: "DRAFT",
        created_by: userId || null,
        updated_by: userId || null,
      },
      { transaction: t }
    );

    let totalMarks = 0;
    for (let i = 0; i < parsed.questions.length; i += 1) {
      const q = parsed.questions[i];
      const qMarks = Number(q.marks) || 1.0;
      totalMarks += qMarks;

      const createdQuestion = await QuizQuestion.create(
        {
          quiz_id: quiz.id,
          question_type: q.question_type === "CODING" ? "CODING" : "MCQ",
          question_text: String(q.question_text).trim(),
          marks: qMarks,
          display_order: i + 1,
          difficulty: ["EASY", "MEDIUM", "HARD"].includes(q.difficulty) ? q.difficulty : "MEDIUM",
          explanation: q.explanation ? String(q.explanation).trim() : null,
          programming_language:
            q.question_type === "CODING"
              ? (q.programming_language || "python").trim().toLowerCase()
              : null,
          starter_code: q.question_type === "CODING" ? q.starter_code || null : null,
          constraints: q.question_type === "CODING" ? q.constraints || null : null,
          expected_output: q.question_type === "CODING" ? q.expected_output || null : null,
          status: "ACTIVE",
          created_by: userId || null,
          updated_by: userId || null,
        },
        { transaction: t }
      );

      if (q.question_type === "MCQ" && Array.isArray(q.options) && q.options.length > 0) {
        const optionsToCreate = q.options.map((opt, optIdx) => ({
          question_id: createdQuestion.id,
          option_label: opt.option_label || String.fromCharCode(65 + optIdx),
          option_text: String(opt.option_text || "").trim(),
          is_correct: Boolean(opt.is_correct),
          display_order: opt.display_order || optIdx + 1,
          created_by: userId || null,
          updated_by: userId || null,
        }));
        await QuizOption.bulkCreate(optionsToCreate, { transaction: t });
      }
    }

    await quiz.update({ total_marks: totalMarks }, { transaction: t });
    await t.commit();

    return await getQuizById(quiz.id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Bulk import questions into an existing quiz from CSV or pre-parsed questions
 */
const importQuestionsFromCsv = async (quizId, { csvContent, questions: inputQuestions, userId }) => {
  const quiz = await Quiz.findByPk(quizId);
  if (!quiz) {
    throw new Error("Quiz not found");
  }

  if (quiz.status === "CLOSED") {
    throw new Error("Cannot add questions to a closed quiz");
  }

  let parsed = { questions: [] };
  if (csvContent) {
    parsed = parseQuizCsv(csvContent);
  } else if (Array.isArray(inputQuestions) && inputQuestions.length > 0) {
    parsed.questions = inputQuestions;
  } else {
    throw new Error("Either csvContent or a non-empty questions array is required.");
  }

  if (!parsed.questions || parsed.questions.length === 0) {
    throw new Error("No valid questions found to import");
  }

  // Get current max display_order
  const maxOrderResult = await QuizQuestion.max("display_order", {
    where: { quiz_id: quizId },
  });
  let nextOrder = (maxOrderResult || 0) + 1;

  const t = await sequelize.transaction();
  try {
    for (let i = 0; i < parsed.questions.length; i += 1) {
      const q = parsed.questions[i];
      const qMarks = Number(q.marks) || 1.0;

      const createdQuestion = await QuizQuestion.create(
        {
          quiz_id: quiz.id,
          question_type: q.question_type === "CODING" ? "CODING" : "MCQ",
          question_text: String(q.question_text).trim(),
          marks: qMarks,
          display_order: nextOrder++,
          difficulty: ["EASY", "MEDIUM", "HARD"].includes(q.difficulty) ? q.difficulty : "MEDIUM",
          explanation: q.explanation ? String(q.explanation).trim() : null,
          programming_language:
            q.question_type === "CODING"
              ? (q.programming_language || "python").trim().toLowerCase()
              : null,
          starter_code: q.question_type === "CODING" ? q.starter_code || null : null,
          constraints: q.question_type === "CODING" ? q.constraints || null : null,
          expected_output: q.question_type === "CODING" ? q.expected_output || null : null,
          status: "ACTIVE",
          created_by: userId || null,
          updated_by: userId || null,
        },
        { transaction: t }
      );

      if (q.question_type === "MCQ" && Array.isArray(q.options) && q.options.length > 0) {
        const optionsToCreate = q.options.map((opt, optIdx) => ({
          question_id: createdQuestion.id,
          option_label: opt.option_label || String.fromCharCode(65 + optIdx),
          option_text: String(opt.option_text || "").trim(),
          is_correct: Boolean(opt.is_correct),
          display_order: opt.display_order || optIdx + 1,
          created_by: userId || null,
          updated_by: userId || null,
        }));
        await QuizOption.bulkCreate(optionsToCreate, { transaction: t });
      }
    }

    await t.commit();
    await syncQuizTotalMarks(quiz.id);

    return await getQuizById(quiz.id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

module.exports = {
  listQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  publishQuiz,
  closeQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  addOption,
  updateOption,
  deleteOption,
  getQuizAttempts,
  getAttemptDetails,
  createQuizFromCsv,
  importQuestionsFromCsv,
  getSampleCsvString,
};
