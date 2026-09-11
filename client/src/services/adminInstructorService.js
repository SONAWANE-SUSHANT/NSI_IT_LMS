import { getAuthToken } from '../utils/token';
import { API_BASE_URL } from '../config/apiConfig';

/**
 * Fetches instructor portal context for admin viewing
 * @param {string|number} instructorId
 * @returns {Promise<object>}
 */
export const fetchInstructorPortalView = async (instructorId) => {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/instructors/${instructorId}/portal`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || 'Failed to fetch instructor portal');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
};
