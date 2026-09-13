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

export const fetchMyNotifications = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.unreadOnly) query.append('unreadOnly', String(params.unreadOnly));

  const qs = query.toString() ? `?${query.toString()}` : '';
  return await request(`${API_BASE_URL}/notifications${qs}`);
};

export const fetchUnreadCount = async () => {
  const res = await request(`${API_BASE_URL}/notifications/unread-count`);
  return res?.data?.unread_count ?? 0;
};

export const markNotificationAsRead = async (id) => {
  const res = await request(`${API_BASE_URL}/notifications/${id}/read`, {
    method: 'PATCH',
  });
  return res.data;
};

export const markAllNotificationsAsRead = async () => {
  const res = await request(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
  });
  return res.data;
};
