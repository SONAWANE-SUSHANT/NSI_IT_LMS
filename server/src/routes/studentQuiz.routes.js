const express = require("express");
const router = express.Router();

const studentQuizController = require("../controllers/studentQuiz.controller");
const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const auth = [authenticate, authorizeRoles("STUDENT", "ADMIN")];

// Available quizzes
router.get("/quizzes", auth, studentQuizController.getAvailableQuizzes);

// Quiz details (sanitized)
router.get("/quizzes/:quizId", auth, studentQuizController.getQuizDetails);

// Start quiz attempt
router.post("/quizzes/:quizId/start", auth, studentQuizController.startQuiz);

// Get current in-progress attempt
router.get("/quizzes/:quizId/attempts/current", auth, studentQuizController.getCurrentAttempt);

// Save/update answer during active attempt
router.post("/attempts/:attemptId/answers", auth, studentQuizController.saveAnswer);

// Run code execution via Judge0 during test
router.post("/attempts/:attemptId/run-code", auth, studentQuizController.runCode);

// Submit quiz attempt for grading
router.post("/attempts/:attemptId/submit", auth, studentQuizController.submitQuiz);

// Get submission result
router.get("/attempts/:attemptId/result", auth, studentQuizController.getAttemptResult);

// Get attempt history for a quiz
router.get("/quizzes/:quizId/attempts", auth, studentQuizController.getAttemptHistory);

module.exports = router;
