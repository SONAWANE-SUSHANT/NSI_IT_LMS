const express = require("express");
const router = express.Router();

const quizController = require("../controllers/quiz.controller");
const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const auth = [authenticate, authorizeRoles("ADMIN", "INSTRUCTOR")];

// Language discovery
router.get("/quizzes/languages", auth, quizController.getSupportedLanguages);

// CSV Import & Template
router.get("/quizzes/sample-csv", auth, quizController.getSampleCsv);
router.post("/quizzes/import-csv", auth, quizController.createQuizFromCsv);
router.post("/quizzes/:quizId/import-csv", auth, quizController.importQuestionsFromCsv);

// Quiz CRUD
router.get("/quizzes", auth, quizController.listQuizzes);
router.get("/quizzes/:quizId", auth, quizController.getQuizById);
router.post("/quizzes", auth, quizController.createQuiz);
router.put("/quizzes/:quizId", auth, quizController.updateQuiz);
router.delete("/quizzes/:quizId", auth, quizController.deleteQuiz);

// Session-nested alias
router.get("/sessions/:sessionId/quizzes", auth, (req, res, next) => {
  req.query.sessionId = req.params.sessionId;
  return quizController.listQuizzes(req, res, next);
});
router.post("/sessions/:sessionId/quizzes", auth, (req, res, next) => {
  req.body.session_id = req.params.sessionId;
  return quizController.createQuiz(req, res, next);
});

// Quiz lifecycle
router.patch("/quizzes/:quizId/publish", auth, quizController.publishQuiz);
router.patch("/quizzes/:quizId/close", auth, quizController.closeQuiz);

// Question routes
router.post("/quizzes/:quizId/questions", auth, quizController.addQuestion);
router.put("/questions/:questionId", auth, quizController.updateQuestion);
router.delete("/questions/:questionId", auth, quizController.deleteQuestion);
router.patch("/quizzes/:quizId/questions/reorder", auth, quizController.reorderQuestions);

// Option routes
router.post("/questions/:questionId/options", auth, quizController.addOption);
router.put("/options/:optionId", auth, quizController.updateOption);
router.delete("/options/:optionId", auth, quizController.deleteOption);

// Attempts review
router.get("/quizzes/:quizId/attempts", auth, quizController.getQuizAttempts);
router.get("/quizzes/attempts/:attemptId", auth, quizController.getAttemptDetails);

module.exports = router;
