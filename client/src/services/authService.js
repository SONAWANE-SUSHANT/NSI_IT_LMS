import { API_BASE_URL } from '../config/apiConfig';
import { getDeviceInfo } from '../utils/deviceInfo';

/**
 * Authenticates user credentials with the backend.
 * The browser/device identifier is persistent so returning users are
 * recognized as the same device instead of consuming another slot.
 *
 * @param {string} username - The username
 * @param {string} password - The password
 * @returns {Promise<{token: string, user: object}>}
 */
export async function loginApi(username, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.trim(),
        password,
        device: getDeviceInfo(),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        data?.message ||
        (response.status === 401
          ? 'Invalid username or password.'
          : response.status === 403
          ? 'This account has reached its device limit. Please contact an administrator.'
          : response.status === 400
          ? 'Please provide both username and password.'
          : 'Unable to connect to the server. Please try again later.');
      throw new Error(errorMessage);
    }

    if (!data.success || !data.data?.token || !data.data?.user) {
      throw new Error(data.message || 'Authentication failed. Please try again.');
    }

    return data.data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to authentication server. Please ensure the backend is running.');
    }
    throw error;
  }
}
