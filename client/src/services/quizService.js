import { getAuthToken, getViewingInstructorId } from '../utils/token';
import { API_BASE_URL } from '../config/apiConfig';

const getHeaders = () => {
  const token = getAuthToken();
  const viewingInstructorId = getViewingInstructorId();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(viewingInstructorId ? { 'x-instructor-id': String(viewingInstructorId) } : {}),
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
 * Fetch supported Judge0 programming languages
 */
export const fetchSupportedLanguages = async () => {
  const response = await fetch(`${API_BASE_URL}/quizzes/languages`, {
    headers: getHeaders(),
  });
  return handleResponse(response, 'Failed to fetch supported languages');
};

/**
 * List quizzes with optional filters
 * @param {object} [filters]
 * @param {number|string} [filters.sessionId]
 * @param {string} [filters.status]
 * @param {string} [filters.search]
 */
export const fetchQuizzes = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.sessionId) params.append('sessionId', filters.sessionId);
  if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
  if (filters.search?.trim()) params.append('search', filters.search.trim());

  const url = `${API_BASE_URL}/quizzes${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: getHeaders(),
  });
  return handleResponse(response, 'Failed to fetch quizzes');
};

/**
 * Fetch a single quiz with questions and options
 * @param {number|string} quizId
 */
export const fetchQuizById = async (quizId) => {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
    headers: getHeaders(),
  });
  return handleResponse(response, 'Failed to fetch quiz details');
};

/**
 * Create a new quiz
 * @param {object} quizData
 */
export const createQuiz = async (quizData) => {
  const response = await fetch(`${API_BASE_URL}/quizzes`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(quizData),
  });
  return handleResponse(response, 'Failed to create quiz');
};

/**
 * Create a new quiz from CSV
 * @param {object} payload - { course_id, module_id, session_id, title, duration_minutes, passing_marks, max_attempts, csv_content, questions }
 */
export const createQuizFromCsv = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/quizzes/import-csv`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response, 'Failed to create quiz from CSV');
};

/**
 * Import questions from CSV into an existing quiz
 * @param {number|string} quizId
 * @param {object} payload - { csv_content, questions }
 */
export const importQuestionsFromCsv = async (quizId, payload) => {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/import-csv`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response, 'Failed to import questions from CSV');
};

/**
 * Update quiz metadata
 * @param {number|string} quizId
 * @param {object} quizData
 */
export const updateQuiz = async (quizId, quizData) => {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(quizData),
  });
  return handleResponse(response, 'Failed to update quiz');
};

/**
 * Delete a quiz (if no student attempts exist)
 * @param {number|string} quizId
 */
export const deleteQuiz = async (quizId) => {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(response, 'Failed to delete quiz');
};

/**
 * Publish a quiz
 * @param {number|string} quizId
 */
export const publishQuiz = async (quizId) => {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/publish`, {
    method: 'PATCH',
    headers: getHeaders(),
  });
  return handleResponse(response, 'Failed to publish quiz');
};

/**
 * Close an active quiz
 * @param {number|string} quizId
 */
export const closeQuiz = async (quizId) => {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/close`, {
    method: 'PATCH',
    headers: getHeaders(),
  });
  return handleResponse(response, 'Failed to close quiz');
};

/**
 * Add a question to a quiz
 * @param {number|string} quizId
 * @param {object} questionData
 */
export const addQuestion = async (quizId, questionData) => {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/questions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(questionData),
  });
  return handleResponse(response, 'Failed to add question');
};

/**
 * Update question details
 * @param {number|string} questionId
 * @param {object} questionData
 */
export const updateQuestion = async (questionId, questionData) => {
  const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(questionData),
  });
  return handleResponse(response, 'Failed to update question');
};

/**
 * Delete a question
 * @param {number|string} questionId
 */
export const deleteQuestion = async (questionId) => {
  const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(response, 'Failed to delete question');
};

/**
 * Reorder questions in a quiz
 * @param {number|string} quizId
 * @param {Array<{id: number, display_order: number}>} orderList
 */
export const reorderQuestions = async (quizId, orderList) => {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/questions/reorder`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ orderList }),
  });
  return handleResponse(response, 'Failed to reorder questions');
};

/**
 * Add an option to an MCQ question
 * @param {number|string} questionId
 * @param {object} optionData
 */
export const addOption = async (questionId, optionData) => {
  const response = await fetch(`${API_BASE_URL}/questions/${questionId}/options`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(optionData),
  });
  return handleResponse(response, 'Failed to add option');
};

/**
 * Update an option
 * @param {number|string} optionId
 * @param {object} optionData
 */
export const updateOption = async (optionId, optionData) => {
  const response = await fetch(`${API_BASE_URL}/options/${optionId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(optionData),
  });
  return handleResponse(response, 'Failed to update option');
};

/**
 * Delete an option
 * @param {number|string} optionId
 */
export const deleteOption = async (optionId) => {
  const response = await fetch(`${API_BASE_URL}/options/${optionId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(response, 'Failed to delete option');
};

/**
 * Fetch all student attempts for a quiz
 * @param {number|string} quizId
 */
export const fetchQuizAttempts = async (quizId) => {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/attempts`, {
    headers: getHeaders(),
  });
  return handleResponse(response, 'Failed to fetch quiz attempts');
};

/**
 * Fetch detailed view of a single attempt (answers, code, student info)
 * @param {number|string} attemptId
 */
export const fetchAttemptDetails = async (attemptId) => {
  const response = await fetch(`${API_BASE_URL}/quizzes/attempts/${attemptId}`, {
    headers: getHeaders(),
  });
  return handleResponse(response, 'Failed to fetch attempt details');
};

/**
 * Fetch candidate sessions for quiz creation dropdown
 * Checks instructor batches and modules/lectures
 */
export const fetchAvailableSessions = async () => {
  try {
    // Attempt to fetch via instructor batches content
    const batchesRes = await fetch(`${API_BASE_URL}/instructor/my-batches`, {
      headers: getHeaders(),
    });
    if (batchesRes.ok) {
      const batchesData = await batchesRes.json();
      const batches = batchesData.data || [];
      const sessionList = [];

      for (const batch of batches) {
        try {
          const contentRes = await fetch(`${API_BASE_URL}/instructor/batches/${batch.id}/content`, {
            headers: getHeaders(),
          });
          if (contentRes.ok) {
            const contentData = await contentRes.json();
            const modules = contentData.data?.modules || [];
            for (const mod of modules) {
              for (const session of mod.lectures || []) {
                sessionList.push({
                  id: session.id,
                  title: `${batch.name} • ${session.title || `Session ${session.id}`}`,
                  module_name: mod.name,
                  batch_name: batch.name,
                });
              }
            }
          }
        } catch {
          // Continue to next batch
        }
      }

      if (sessionList.length > 0) {
        return sessionList;
      }
    }
  } catch {
    // Fallback below
  }

  // Fallback: fetch courses/content if admin or instructor
  try {
    const coursesRes = await fetch(`${API_BASE_URL}/admin/courses`, {
      headers: getHeaders(),
    });
    if (coursesRes.ok) {
      const coursesData = await coursesRes.json();
      const courses = coursesData.data || [];
      const sessionList = [];

      for (const course of courses.slice(0, 5)) {
        try {
          const modRes = await fetch(`${API_BASE_URL}/courses/${course.id}/modules`, {
            headers: getHeaders(),
          });
          if (modRes.ok) {
            const modData = await modRes.json();
            for (const mod of modData.data || []) {
              const lecRes = await fetch(`${API_BASE_URL}/modules/${mod.id}/lectures`, {
                headers: getHeaders(),
              });
              if (lecRes.ok) {
                const lecData = await lecRes.json();
                for (const lec of lecData.data || []) {
                  sessionList.push({
                    id: lec.id,
                    title: `${course.name} • ${lec.title || `Session ${lec.id}`}`,
                    module_name: mod.name,
                    course_name: course.name,
                  });
                }
              }
            }
          }
        } catch {
          // Continue
        }
      }
      return sessionList;
    }
  } catch {
    // Return empty array
  }

  return [];
};

/**
 * Fetch all courses for quiz creation
 */
export const fetchCourses = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses`, {
      headers: getHeaders(),
    });
    if (response.ok) {
      const data = await handleResponse(response);
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Try fallback
  }

  try {
    const adminRes = await fetch(`${API_BASE_URL}/admin/courses`, {
      headers: getHeaders(),
    });
    if (adminRes.ok) {
      const data = await handleResponse(adminRes);
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Try next fallback
  }

  // Fallback: extract distinct courses from instructor batches if viewing as instructor
  try {
    const batchRes = await fetch(`${API_BASE_URL}/instructor/my-batches`, {
      headers: getHeaders(),
    });
    if (batchRes.ok) {
      const batchData = await batchRes.json();
      const batches = batchData.data || [];
      const coursesMap = new Map();
      batches.forEach((b) => {
        const c = b.course || (b.course_id ? { id: b.course_id, name: b.name, code: b.batch_code } : null);
        if (c && !coursesMap.has(c.id)) {
          coursesMap.set(c.id, c);
        }
      });
      if (coursesMap.size > 0) return Array.from(coursesMap.values());
    }
  } catch {
    // Return empty array
  }

  return [];
};

/**
 * Fetch all modules for a selected course
 */
export const fetchModulesByCourse = async (courseId) => {
  if (!courseId) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/modules`, {
      headers: getHeaders(),
    });
    if (response.ok) {
      const data = await handleResponse(response);
      return Array.isArray(data) ? data : data?.modules || [];
    }
  } catch {
    // Fallback
  }

  try {
    const adminRes = await fetch(`${API_BASE_URL}/admin/courses/${courseId}/modules`, {
      headers: getHeaders(),
    });
    if (adminRes.ok) {
      const data = await handleResponse(adminRes);
      return Array.isArray(data) ? data : data?.modules || [];
    }
  } catch {
    // Return empty array
  }

  return [];
};

