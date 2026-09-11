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

export const fetchMyBatches = async () => {
  const response = await fetch(`${API_BASE_URL}/my-batches`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch enrolled batches');
  return data.data || [];
};

export const fetchBatchCourseContent = async (batchId) => {
  const response = await fetch(`${API_BASE_URL}/batches/${batchId}/content`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch course curriculum');
  return data.data || null;
};

export const fetchUpcomingSessions = async () => {
  const response = await fetch(`${API_BASE_URL}/upcoming-sessions`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch upcoming sessions');
  return data.data || [];
};
