import { getAuthToken } from '../utils/token';
import { API_BASE_URL } from '../config/apiConfig';

/**
 * Fetches student portal context for admin viewing
 * @param {string|number} studentId
 * @returns {Promise<object>}
 */
export const fetchStudentPortalView = async (studentId) => {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/students/${studentId}/portal`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || 'Failed to fetch student portal');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
};
