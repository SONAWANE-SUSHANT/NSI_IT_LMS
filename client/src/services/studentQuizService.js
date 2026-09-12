import { getAuthToken, getViewingStudentId } from '../utils/token';
import { API_BASE_URL } from '../config/apiConfig';

const getHeaders = () => {
  const token = getAuthToken();
  const viewingStudentId = getViewingStudentId();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(viewingStudentId ? { 'x-student-id': String(viewingStudentId) } : {}),
  };
};

const handleResponse = async (response, defaultErrorMsg = 'Request failed') => {
  let data = null;
  try {
    data = await response.json();
  } catch {
    // Response might not be JSON
  }

  if (!response.ok) {
    throw new Error(data?.message || defaultErrorMsg);
  }

  return data?.data !== undefined ? data.data : data;
};

/**
 * Fetch available quizzes for the logged in / viewing student
 */
export const fetchAvailableQuizzes = async () => {
  const response = await fetch(`${API_BASE_URL}/student/quizzes`, {
    headers: getHeaders(),
  });
  return handleResponse(response, 'Failed to fetch available quizzes');
};

/**
 * Fetch sanitized quiz details before starting an assessment
 * @param {number|string} quizId
 */
export const fetchQuizDetails = async (quizId) => {
  const response = await fetch(`${API_BASE_URL}/student/quizzes/${quizId}`, {
    headers: getHeaders(),
  });
  return handleResponse(response, 'Failed to fetch quiz details');
};

/**
 * Start a new quiz attempt or resume existing active attempt
 * @param {number|string} quizId
 */
export const startQuiz = async (quizId) => {
  const response = await fetch(`${API_BASE_URL}/student/quizzes/${quizId}/start`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return handleResponse(response, 'Failed to start quiz');
};

/**
 * Fetch current in-progress attempt for a quiz
 * @param {number|string} quizId
 */
export const getCurrentAttempt = async (quizId) => {
  const response = await fetch(`${API_BASE_URL}/student/quizzes/${quizId}/attempts/current`, {
    headers: getHeaders(),
  });
  return handleResponse(response, 'Failed to fetch current quiz attempt');
};

/**
 * Save or update answer during an active quiz attempt
 * @param {number|string} attemptId
 * @param {object} answerData
 * @param {number} answerData.question_id
 * @param {number|null} [answerData.selected_option_id]
 * @param {string|null} [answerData.answer_text]
 * @param {string|null} [answerData.code_submission]
 */
export const saveAnswer = async (attemptId, answerData) => {
  const response = await fetch(`${API_BASE_URL}/student/attempts/${attemptId}/answers`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(answerData),
  });
  return handleResponse(response, 'Failed to save answer');
};

/**
 * Run student code through backend Judge0 service
 * @param {number|string} attemptId
 * @param {object} executionData
 * @param {number} executionData.question_id
 * @param {string} executionData.code
 * @param {string} executionData.language
 * @param {string} [executionData.stdin]
 */
export const runCode = async (attemptId, executionData) => {
  const response = await fetch(`${API_BASE_URL}/student/attempts/${attemptId}/run-code`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(executionData),
  });
  return handleResponse(response, 'Code execution failed');
};

/**
 * Submit quiz attempt for automatic grading and scoring
 * @param {number|string} attemptId
 */
export const submitQuiz = async (attemptId) => {
  const response = await fetch(`${API_BASE_URL}/student/attempts/${attemptId}/submit`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return handleResponse(response, 'Failed to submit quiz');
};

/**
 * Fetch detailed submission result with score, explanations, and review
 * @param {number|string} attemptId
 */
export const fetchAttemptResult = async (attemptId) => {
  const response = await fetch(`${API_BASE_URL}/student/attempts/${attemptId}/result`, {
    headers: getHeaders(),
  });
  return handleResponse(response, 'Failed to fetch attempt result');
};

/**
 * Fetch student's attempt history for a specific quiz
 * @param {number|string} quizId
 */
export const fetchAttemptHistory = async (quizId) => {
  const response = await fetch(`${API_BASE_URL}/student/quizzes/${quizId}/attempts`, {
    headers: getHeaders(),
  });
  return handleResponse(response, 'Failed to fetch attempt history');
};
