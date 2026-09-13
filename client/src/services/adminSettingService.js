import { API_BASE_URL } from '../config/apiConfig';
import { getAuthToken } from '../utils/token';

function getHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const fetchPlatformSettings = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/settings`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch platform settings');
  }
  return data.data;
};

export const updatePlatformSettings = async (settings) => {
  const res = await fetch(`${API_BASE_URL}/admin/settings`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ settings }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update platform settings');
  }
  return data.data;
};
