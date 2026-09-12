const studentQuizService = require("../services/studentQuiz.service");

const resolveStudentId = (req) => {
  if (req.user && req.user.role === "ADMIN") {
    const overrideId = req.query.student_id || req.headers["x-student-id"];
    if (overrideId) {
      const parsed = parseInt(overrideId, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  }
  return req.user.id;
};

const getAvailableQuizzes = async (req, res) => {
  try {
    const studentId = resolveStudentId(req);
    const quizzes = await studentQuizService.getAvailableQuizzes(studentId);
    return res.json({
      success: true,
      count: quizzes.length,
      data: quizzes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load quizzes",
    });
  }
};

const getQuizDetails = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = resolveStudentId(req);
    const quiz = await studentQuizService.getQuizDetails(Number(quizId), studentId);
    return res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    const status = error.message.includes("not found") ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const startQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = resolveStudentId(req);
    const attemptData = await studentQuizService.startQuiz(Number(quizId), studentId);
    return res.status(201).json({
      success: true,
      message: "Quiz attempt started successfully",
      data: attemptData,
    });
  } catch (error) {
    const status = error.message.includes("not found") ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const getCurrentAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = resolveStudentId(req);
    const current = await studentQuizService.getCurrentAttempt(Number(quizId), studentId);
    return res.json({
      success: true,
      data: current,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const saveAnswer = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const studentId = resolveStudentId(req);
    const result = await studentQuizService.saveAnswer({
      attemptId: Number(attemptId),
      studentId,
      questionId: Number(req.body.question_id),
      selected_option_id: req.body.selected_option_id ? Number(req.body.selected_option_id) : null,
      answer_text: req.body.answer_text,
      code_submission: req.body.code_submission,
    });

    return res.json(result);
  } catch (error) {
    const status = error.message.includes("Unauthorized") ? 403 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const runCode = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const studentId = resolveStudentId(req);
    const result = await studentQuizService.runStudentCode({
      attemptId: Number(attemptId),
      studentId,
      questionId: Number(req.body.question_id),
      code: req.body.code,
      language: req.body.language,
      stdin: req.body.stdin || "",
    });

    return res.json(result);
  } catch (error) {
    const status = error.message.includes("Unauthorized") ? 403 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const studentId = resolveStudentId(req);
    const result = await studentQuizService.submitQuiz({
      attemptId: Number(attemptId),
      studentId,
      isAutoSubmit: false,
    });

    return res.json(result);
  } catch (error) {
    const status = error.message.includes("Unauthorized") ? 403 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const getAttemptResult = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const studentId = resolveStudentId(req);
    const result = await studentQuizService.getAttemptResult(Number(attemptId), studentId);
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const status = error.message.includes("Unauthorized") ? 403 : error.message.includes("not found") ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const getAttemptHistory = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = resolveStudentId(req);
    const history = await studentQuizService.getAttemptHistory(Number(quizId), studentId);
    return res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAvailableQuizzes,
  getQuizDetails,
  startQuiz,
  getCurrentAttempt,
  saveAnswer,
  runCode,
  submitQuiz,
  getAttemptResult,
  getAttemptHistory,
};
