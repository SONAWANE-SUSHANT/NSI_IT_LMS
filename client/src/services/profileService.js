import { API_BASE_URL } from '../config/apiConfig';
import { getAuthToken } from '../utils/token';

function getHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(json.message || 'Request failed');
    error.status = res.status;
    error.data = json;
    throw error;
  }
  return json;
}

/**
 * Fetch authenticated user's own profile
 */
export const fetchMyProfile = async () => {
  const res = await request(`${API_BASE_URL}/profile`);
  return res.data;
};

/**
 * Update authenticated user's profile
 */
export const updateMyProfile = async (payload) => {
  const res = await request(`${API_BASE_URL}/profile`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data;
};

/**
 * Upload profile photo (base64 image or photo URL)
 */
export const uploadProfilePhoto = async (payload) => {
  const res = await request(`${API_BASE_URL}/profile/photo`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data;
};
