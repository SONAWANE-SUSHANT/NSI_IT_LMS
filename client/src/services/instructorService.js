import { getAuthToken } from '../utils/token';

const API_BASE_URL = 'http://localhost:5000/api/instructor';

const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const fetchMyBatches = async () => {
  const response = await fetch(`${API_BASE_URL}/my-batches`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch instructor batches');
  return data.data || [];
};

export const fetchBatchStudents = async (batchId) => {
  const response = await fetch(`${API_BASE_URL}/batches/${batchId}/students`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch batch students');
  return data.data || [];
};

export const fetchBatchCourseContent = async (batchId) => {
  const response = await fetch(`${API_BASE_URL}/batches/${batchId}/content`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch batch course content');
  return data.data || null;
};

export const createBatchSession = async (batchId, sessionData) => {
  const response = await fetch(`${API_BASE_URL}/batches/${batchId}/sessions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(sessionData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to schedule session');
  return data.data;
};
