import { getAuthToken, getViewingStudentId } from '../utils/token';
import { API_BASE_URL as ROOT_API_URL } from '../config/apiConfig';

const API_BASE_URL = `${ROOT_API_URL}/student`;

const getHeaders = () => {
  const token = getAuthToken();
  const viewingStudentId = getViewingStudentId();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(viewingStudentId ? { 'x-student-id': String(viewingStudentId) } : {}),
  };
};

/**
 * Record student accessing/opening a session
 */
export const recordSessionAccess = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/access`, {
    method: 'POST',
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to record session access');
  return data.data;
};

/**
 * Mark a session as completed
 */
export const markSessionComplete = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/complete`, {
    method: 'POST',
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to mark session as completed');
  return data.data;
};

/**
 * Get individual session progress
 */
export const fetchSessionProgress = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/progress`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch session progress');
  return data.data;
};

/**
 * Get progress for a specific course
 */
export const fetchCourseProgress = async (courseId) => {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/progress`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch course progress');
  return data.data;
};

/**
 * Get progress for all enrolled courses
 */
export const fetchAllStudentProgress = async () => {
  const response = await fetch(`${API_BASE_URL}/progress`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch student progress');
  return data.data || [];
};
