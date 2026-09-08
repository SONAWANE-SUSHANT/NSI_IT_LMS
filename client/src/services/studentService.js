import { getAuthToken } from '../utils/token';

const API_BASE_URL = 'http://localhost:5000/api/student';

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
