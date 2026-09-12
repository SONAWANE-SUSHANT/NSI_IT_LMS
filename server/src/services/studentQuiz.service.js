const { Op } = require("sequelize");
const {
  Quiz,
  QuizQuestion,
  QuizOption,
  QuizAttempt,
  QuizAttemptAnswer,
  Lecture,
  CourseModule,
  Course,
  CourseBatch,
  CourseStudent,
} = require("../models");
const judge0Service = require("./judge0.service");

/**
 * Get available quizzes for an enrolled student
 */
const getAvailableQuizzes = async (studentId) => {
  // 1. Get batches the student is enrolled in
  const enrollments = await CourseStudent.findAll({
    where: { student_id: studentId, status: "ACTIVE" },
    attributes: ["batch_id"],
    raw: true,
  });

  const batchIds = enrollments.map((e) => e.batch_id);
  if (!batchIds.length) return [];

  // 2. Get courses for these batches
  const batches = await CourseBatch.findAll({
    where: { id: { [Op.in]: batchIds }, status: "ACTIVE" },
    attributes: ["course_id"],
    raw: true,
  });

  const courseIds = [...new Set(batches.map((b) => b.course_id))];
  if (!courseIds.length) return [];

  // 3. Get modules for these courses
  const modules = await CourseModule.findAll({
    where: { course_id: { [Op.in]: courseIds }, status: "ACTIVE" },
    attributes: ["id"],
    raw: true,
  });

  const moduleIds = modules.map((m) => m.id);

  // 4. Get sessions/lectures
  const sessions = moduleIds.length
    ? await Lecture.findAll({
        where: { module_id: { [Op.in]: moduleIds } },
        attributes: ["id", "title", "module_id"],
      })
    : [];

  const sessionIds = sessions.map((s) => s.id);

  // Build match conditions: quizzes assigned to module, course, or session
  const orConditions = [];
  if (moduleIds.length) orConditions.push({ module_id: { [Op.in]: moduleIds } });
  if (courseIds.length) orConditions.push({ course_id: { [Op.in]: courseIds } });
  if (sessionIds.length) orConditions.push({ session_id: { [Op.in]: sessionIds } });

  if (!orConditions.length) return [];

  // 5. Get PUBLISHED quizzes
  const quizzes = await Quiz.findAll({
    where: {
      [Op.or]: orConditions,
      status: "PUBLISHED",
    },
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
        where: { status: "ACTIVE" },
        attributes: ["id", "question_type", "marks"],
        required: false,
      },
      {
        model: QuizAttempt,
        as: "attempts",
        where: { student_id: studentId },
        required: false,
        attributes: ["id", "attempt_number", "status", "score", "total_marks", "passed", "started_at", "submitted_at"],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  const now = new Date();

  return quizzes.map((q) => {
    const json = q.toJSON();
    const attempts = json.attempts || [];
    const activeAttempt = attempts.find((a) => a.status === "IN_PROGRESS");
    const submittedAttempts = attempts.filter((a) => ["SUBMITTED", "AUTO_SUBMITTED"].includes(a.status));
    
    // Availability check
    let isAvailable = true;
    let availabilityMessage = "Available";

    if (q.available_from && new Date(q.available_from) > now) {
      isAvailable = false;
      availabilityMessage = `Opens on ${new Date(q.available_from).toLocaleString()}`;
    } else if (q.available_until && new Date(q.available_until) < now) {
      isAvailable = false;
      availabilityMessage = `Closed on ${new Date(q.available_until).toLocaleString()}`;
    } else if (submittedAttempts.length >= q.max_attempts && !activeAttempt) {
      isAvailable = false;
      availabilityMessage = "Maximum attempts reached";
    }

    return {
      id: json.id,
      session_id: json.session_id,
      session_title: json.session?.title || null,
      module_id: json.module_id || json.session?.module_id || null,
      module_name: json.module?.name || null,
      course_id: json.course_id || json.module?.course_id || null,
      course_name: json.course?.name || json.module?.course?.name || null,
      title: json.title,
      description: json.description,
      duration_minutes: json.duration_minutes,
      total_marks: json.total_marks,
      passing_marks: json.passing_marks,
      max_attempts: json.max_attempts,
      available_from: json.available_from,
      available_until: json.available_until,
      question_count: (json.questions || []).length,
      attempts_count: submittedAttempts.length,
      has_active_attempt: Boolean(activeAttempt),
      active_attempt_id: activeAttempt ? activeAttempt.id : null,
      is_available: isAvailable,
      availability_message: availabilityMessage,
      best_score: submittedAttempts.length ? Math.max(...submittedAttempts.map((a) => Number(a.score) || 0)) : null,
      latest_attempt: attempts.length ? attempts[0] : null,
    };
  });
};

/**
 * Get sanitized quiz overview and questions for a student
 * Strictly ensures no `is_correct` or explanations are leaked
 */
const getQuizDetails = async (quizId, studentId) => {
  const quiz = await Quiz.findByPk(quizId, {
    where: { status: "PUBLISHED" },
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
        where: { status: "ACTIVE" },
        required: false,
        attributes: [
          "id",
          "question_type",
          "question_text",
          "marks",
          "display_order",
          "difficulty",
          "programming_language",
          "starter_code",
          "constraints",
        ],
        include: [
          {
            model: QuizOption,
            as: "options",
            attributes: ["id", "option_label", "option_text", "display_order"],
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
    ],
  });

  if (!quiz) {
    throw new Error("Quiz not found or not currently published");
  }

  // Count past attempts
  const pastAttempts = await QuizAttempt.findAll({
    where: { quiz_id: quizId, student_id: studentId },
    attributes: ["id", "attempt_number", "status", "score", "total_marks", "passed", "started_at", "submitted_at"],
    order: [["attempt_number", "DESC"]],
  });

  const activeAttempt = pastAttempts.find((a) => a.status === "IN_PROGRESS");
  const submittedCount = pastAttempts.filter((a) => ["SUBMITTED", "AUTO_SUBMITTED"].includes(a.status)).length;

  return {
    ...quiz.toJSON(),
    attempts_made: submittedCount,
    max_attempts: quiz.max_attempts,
    has_active_attempt: Boolean(activeAttempt),
    active_attempt_id: activeAttempt?.id || null,
    past_attempts: pastAttempts,
  };
};

/**
 * Start a new quiz attempt or resume existing active attempt
 */
const startQuiz = async (quizId, studentId) => {
  const quiz = await Quiz.findByPk(quizId, {
    where: { status: "PUBLISHED" },
    include: [
      {
        model: QuizQuestion,
        as: "questions",
        where: { status: "ACTIVE" },
        required: false,
        attributes: [
          "id",
          "question_type",
          "question_text",
          "marks",
          "display_order",
          "difficulty",
          "programming_language",
          "starter_code",
          "constraints",
        ],
        include: [
          {
            model: QuizOption,
            as: "options",
            attributes: ["id", "option_label", "option_text", "display_order"],
            required: false,
          },
        ],
      },
    ],
  });

  if (!quiz) {
    throw new Error("Quiz not found or is not available for testing");
  }

  const now = new Date();

  // Availability checks
  if (quiz.available_from && new Date(quiz.available_from) > now) {
    throw new Error(`This quiz is scheduled to open on ${new Date(quiz.available_from).toLocaleString()}`);
  }
  if (quiz.available_until && new Date(quiz.available_until) < now) {
    throw new Error(`This quiz closed on ${new Date(quiz.available_until).toLocaleString()}`);
  }

  // Check if an IN_PROGRESS attempt already exists
  const existingActive = await QuizAttempt.findOne({
    where: {
      quiz_id: quizId,
      student_id: studentId,
      status: "IN_PROGRESS",
    },
    include: [{ model: QuizAttemptAnswer, as: "answers" }],
  });

  if (existingActive) {
    // Check timer expiration
    if (quiz.duration_minutes) {
      const elapsedMs = now.getTime() - new Date(existingActive.started_at).getTime();
      const limitMs = quiz.duration_minutes * 60 * 1000;
      if (elapsedMs >= limitMs) {
        // Auto submit expired attempt
        await submitQuiz({
          attemptId: existingActive.id,
          studentId,
          isAutoSubmit: true,
        });
        throw new Error("Your previous attempt duration has expired and has been submitted");
      }
    }

    return await formatActiveAttemptResponse(existingActive, quiz);
  }

  // Check maximum attempts
  const completedAttemptsCount = await QuizAttempt.count({
    where: {
      quiz_id: quizId,
      student_id: studentId,
      status: { [Op.in]: ["SUBMITTED", "AUTO_SUBMITTED"] },
    },
  });

  if (completedAttemptsCount >= quiz.max_attempts) {
    throw new Error(
      `You have reached the maximum allowed attempts (${quiz.max_attempts}) for this quiz`
    );
  }

  const nextAttemptNumber = completedAttemptsCount + 1;

  // Create new attempt
  const attempt = await QuizAttempt.create({
    quiz_id: quizId,
    student_id: studentId,
    attempt_number: nextAttemptNumber,
    status: "IN_PROGRESS",
    started_at: now,
    score: 0.0,
    total_marks: quiz.total_marks,
    passed: null,
  });

  const fullAttempt = await QuizAttempt.findByPk(attempt.id, {
    include: [{ model: QuizAttemptAnswer, as: "answers" }],
  });

  return await formatActiveAttemptResponse(fullAttempt, quiz);
};

/**
 * Format active attempt response with sanitized questions and calculated timer
 */
const formatActiveAttemptResponse = async (attempt, quiz) => {
  const now = Date.now();
  const startedAt = new Date(attempt.started_at).getTime();
  let remainingSeconds = null;

  if (quiz.duration_minutes) {
    const totalAllowedSeconds = quiz.duration_minutes * 60;
    const elapsedSeconds = Math.floor((now - startedAt) / 1000);
    remainingSeconds = Math.max(0, totalAllowedSeconds - elapsedSeconds);
  }

  return {
    attempt: {
      id: attempt.id,
      quiz_id: attempt.quiz_id,
      attempt_number: attempt.attempt_number,
      status: attempt.status,
      started_at: attempt.started_at,
      total_marks: quiz.total_marks,
      duration_minutes: quiz.duration_minutes,
      remaining_seconds: remainingSeconds,
    },
    quiz: {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      instructions: quiz.instructions,
      total_marks: quiz.total_marks,
      passing_marks: quiz.passing_marks,
      duration_minutes: quiz.duration_minutes,
    },
    questions: quiz.questions || [],
    saved_answers: (attempt.answers || []).map((ans) => ({
      question_id: ans.question_id,
      selected_option_id: ans.selected_option_id,
      answer_text: ans.answer_text,
      code_submission: ans.code_submission,
      answered_at: ans.answered_at,
    })),
  };
};

/**
 * Get current active attempt for a quiz
 */
const getCurrentAttempt = async (quizId, studentId) => {
  const attempt = await QuizAttempt.findOne({
    where: {
      quiz_id: quizId,
      student_id: studentId,
      status: "IN_PROGRESS",
    },
    include: [{ model: QuizAttemptAnswer, as: "answers" }],
  });

  if (!attempt) return null;

  const quiz = await Quiz.findByPk(quizId, {
    include: [
      {
        model: QuizQuestion,
        as: "questions",
        where: { status: "ACTIVE" },
        required: false,
        attributes: [
          "id",
          "question_type",
          "question_text",
          "marks",
          "display_order",
          "difficulty",
          "programming_language",
          "starter_code",
          "constraints",
        ],
        include: [
          {
            model: QuizOption,
            as: "options",
            attributes: ["id", "option_label", "option_text", "display_order"],
            required: false,
          },
        ],
      },
    ],
  });

  // Check timer
  if (quiz.duration_minutes) {
    const elapsedMs = Date.now() - new Date(attempt.started_at).getTime();
    if (elapsedMs >= quiz.duration_minutes * 60 * 1000) {
      return await submitQuiz({ attemptId: attempt.id, studentId, isAutoSubmit: true });
    }
  }

  return await formatActiveAttemptResponse(attempt, quiz);
};

/**
 * Save or update a student's answer for a question in an active attempt
 */
const saveAnswer = async ({
  attemptId,
  studentId,
  questionId,
  selected_option_id,
  answer_text,
  code_submission,
}) => {
  const attempt = await QuizAttempt.findByPk(attemptId, {
    include: [{ model: Quiz, as: "quiz" }],
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  if (Number(attempt.student_id) !== Number(studentId)) {
    throw new Error("Unauthorized: This attempt does not belong to you");
  }

  if (attempt.status !== "IN_PROGRESS") {
    throw new Error(`Cannot modify answers on a ${attempt.status.toLowerCase()} attempt`);
  }

  // Timer check
  if (attempt.quiz?.duration_minutes) {
    const elapsedMs = Date.now() - new Date(attempt.started_at).getTime();
    if (elapsedMs >= attempt.quiz.duration_minutes * 60 * 1000) {
      await submitQuiz({ attemptId, studentId, isAutoSubmit: true });
      throw new Error("Time expired. Your attempt has been automatically submitted");
    }
  }

  // Verify question belongs to this quiz
  const question = await QuizQuestion.findOne({
    where: { id: questionId, quiz_id: attempt.quiz_id, status: "ACTIVE" },
  });
  if (!question) {
    throw new Error("Question does not belong to this quiz or is inactive");
  }

  // Verify option if selected_option_id passed
  if (selected_option_id) {
    const option = await QuizOption.findOne({
      where: { id: selected_option_id, question_id: questionId },
    });
    if (!option) {
      throw new Error("Selected option does not belong to this question");
    }
  }

  // Upsert into quiz_attempt_answers (uk_attempt_question)
  const [answerRecord, created] = await QuizAttemptAnswer.findOrCreate({
    where: { attempt_id: attemptId, question_id: questionId },
    defaults: {
      attempt_id: attemptId,
      question_id: questionId,
      selected_option_id: selected_option_id || null,
      answer_text: answer_text || null,
      code_submission: code_submission || null,
      answered_at: new Date(),
    },
  });

  if (!created) {
    if (selected_option_id !== undefined) answerRecord.selected_option_id = selected_option_id || null;
    if (answer_text !== undefined) answerRecord.answer_text = answer_text || null;
    if (code_submission !== undefined) answerRecord.code_submission = code_submission || null;
    answerRecord.answered_at = new Date();
    await answerRecord.save();
  }

  return {
    success: true,
    message: "Answer saved successfully",
    data: {
      question_id: questionId,
      selected_option_id: answerRecord.selected_option_id,
      answer_text: answerRecord.answer_text,
      code_submission: answerRecord.code_submission,
      answered_at: answerRecord.answered_at,
    },
  };
};

/**
 * Run student code through Judge0 during an active attempt
 */
const runStudentCode = async ({
  attemptId,
  studentId,
  questionId,
  code,
  language,
  stdin = "",
}) => {
  const attempt = await QuizAttempt.findByPk(attemptId, {
    include: [{ model: Quiz, as: "quiz" }],
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  if (Number(attempt.student_id) !== Number(studentId)) {
    throw new Error("Unauthorized: Attempt does not belong to you");
  }

  if (attempt.status !== "IN_PROGRESS") {
    throw new Error(`Cannot run code on a ${attempt.status.toLowerCase()} attempt`);
  }

  // Timer check
  if (attempt.quiz?.duration_minutes) {
    const elapsedMs = Date.now() - new Date(attempt.started_at).getTime();
    if (elapsedMs >= attempt.quiz.duration_minutes * 60 * 1000) {
      await submitQuiz({ attemptId, studentId, isAutoSubmit: true });
      throw new Error("Time expired. Your attempt has been automatically submitted");
    }
  }

  const question = await QuizQuestion.findOne({
    where: { id: questionId, quiz_id: attempt.quiz_id, status: "ACTIVE" },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  if (question.question_type !== "CODING") {
    throw new Error("Run code is only applicable to CODING questions");
  }

  const targetLanguage = language || question.programming_language;

  // Execute via Judge0 without leaking backend secrets
  const execResult = await judge0Service.executeCode({
    source_code: code,
    language: targetLanguage,
    stdin: stdin || "",
    expected_output: null, // Don't enforce expected output during run test
  });

  return execResult;
};

/**
 * Submit and automatically grade a quiz attempt
 */
const submitQuiz = async ({ attemptId, studentId, isAutoSubmit = false }) => {
  const attempt = await QuizAttempt.findByPk(attemptId, {
    include: [
      {
        model: Quiz,
        as: "quiz",
        include: [
          {
            model: QuizQuestion,
            as: "questions",
            where: { status: "ACTIVE" },
            required: false,
            include: [{ model: QuizOption, as: "options", required: false }],
          },
        ],
      },
      {
        model: QuizAttemptAnswer,
        as: "answers",
      },
    ],
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  if (Number(attempt.student_id) !== Number(studentId)) {
    throw new Error("Unauthorized: This attempt does not belong to you");
  }

  if (attempt.status !== "IN_PROGRESS") {
    throw new Error(`Attempt has already been ${attempt.status.toLowerCase()}`);
  }

  const quiz = attempt.quiz;
  const questions = quiz.questions || [];
  const answersMap = new Map((attempt.answers || []).map((ans) => [ans.question_id, ans]));

  let totalScore = 0.0;

  // Evaluate each question
  for (const question of questions) {
    const answer = answersMap.get(question.id);
    let isCorrect = false;
    let marksAwarded = 0.0;
    const questionMarks = Number(question.marks) || 0;

    if (question.question_type === "MCQ") {
      if (answer && answer.selected_option_id) {
        const correctOption = (question.options || []).find((opt) => Boolean(opt.is_correct));
        if (correctOption && Number(correctOption.id) === Number(answer.selected_option_id)) {
          isCorrect = true;
          marksAwarded = questionMarks;
        }
      }
    } else if (question.question_type === "CODING") {
      if (answer && answer.code_submission && answer.code_submission.trim()) {
        try {
          const evalResult = await judge0Service.executeCode({
            source_code: answer.code_submission,
            language: question.programming_language,
            expected_output: question.expected_output,
          });

          if (evalResult.is_correct) {
            isCorrect = true;
            marksAwarded = questionMarks;
          }
        } catch (err) {
          console.error(`Error evaluating coding question #${question.id}:`, err.message);
          isCorrect = false;
          marksAwarded = 0.0;
        }
      }
    }

    totalScore += marksAwarded;

    // Save answer evaluation
    if (answer) {
      answer.is_correct = isCorrect;
      answer.marks_awarded = marksAwarded;
      await answer.save();
    } else {
      // Create empty answer record so records are consistent
      await QuizAttemptAnswer.create({
        attempt_id: attempt.id,
        question_id: question.id,
        is_correct: false,
        marks_awarded: 0.0,
        answered_at: null,
      });
    }
  }

  // Calculate passed status
  let passed = null;
  if (quiz.passing_marks !== null && quiz.passing_marks !== undefined) {
    passed = totalScore >= Number(quiz.passing_marks);
  }

  const now = new Date();
  attempt.status = isAutoSubmit ? "AUTO_SUBMITTED" : "SUBMITTED";
  attempt.submitted_at = now;
  attempt.score = totalScore;
  attempt.total_marks = quiz.total_marks;
  attempt.passed = passed;
  await attempt.save();

  return {
    success: true,
    message: isAutoSubmit
      ? "Time expired. Attempt auto-submitted successfully"
      : "Quiz submitted and evaluated successfully",
    data: {
      attempt_id: attempt.id,
      status: attempt.status,
      score: totalScore,
      total_marks: quiz.total_marks,
      passing_marks: quiz.passing_marks,
      passed: passed,
      submitted_at: attempt.submitted_at,
    },
  };
};

/**
 * Get detailed result for a submitted attempt
 */
const getAttemptResult = async (attemptId, studentId) => {
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
        model: QuizAttemptAnswer,
        as: "answers",
      },
    ],
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  if (Number(attempt.student_id) !== Number(studentId)) {
    throw new Error("Unauthorized: Attempt does not belong to you");
  }

  if (attempt.status === "IN_PROGRESS") {
    throw new Error("Cannot view results for an in-progress attempt");
  }

  const answersMap = new Map((attempt.answers || []).map((ans) => [ans.question_id, ans]));

  const questionBreakdown = (attempt.quiz?.questions || []).map((q) => {
    const ans = answersMap.get(q.id);
    return {
      question_id: q.id,
      question_type: q.question_type,
      question_text: q.question_text,
      marks: q.marks,
      explanation: q.explanation,
      programming_language: q.programming_language,
      expected_output: q.expected_output,
      options: (q.options || []).map((opt) => ({
        id: opt.id,
        option_label: opt.option_label,
        option_text: opt.option_text,
        is_correct: opt.is_correct,
      })),
      student_answer: ans
        ? {
            selected_option_id: ans.selected_option_id,
            answer_text: ans.answer_text,
            code_submission: ans.code_submission,
            marks_awarded: ans.marks_awarded,
            is_correct: ans.is_correct,
          }
        : null,
    };
  });

  return {
    attempt: {
      id: attempt.id,
      attempt_number: attempt.attempt_number,
      status: attempt.status,
      started_at: attempt.started_at,
      submitted_at: attempt.submitted_at,
      score: attempt.score,
      total_marks: attempt.total_marks,
      passed: attempt.passed,
    },
    quiz: {
      id: attempt.quiz.id,
      title: attempt.quiz.title,
      total_marks: attempt.quiz.total_marks,
      passing_marks: attempt.quiz.passing_marks,
    },
    breakdown: questionBreakdown,
  };
};

/**
 * Get all attempts made by a student for a specific quiz
 */
const getAttemptHistory = async (quizId, studentId) => {
  const attempts = await QuizAttempt.findAll({
    where: { quiz_id: quizId, student_id: studentId },
    order: [["attempt_number", "DESC"]],
  });

  return attempts;
};

module.exports = {
  getAvailableQuizzes,
  getQuizDetails,
  startQuiz,
  getCurrentAttempt,
  saveAnswer,
  runStudentCode,
  submitQuiz,
  getAttemptResult,
  getAttemptHistory,
};
