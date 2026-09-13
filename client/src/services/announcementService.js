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

// Student Announcements
export const fetchStudentAnnouncements = async () => {
  const res = await request(`${API_BASE_URL}/student/announcements`);
  return res.data || [];
};

export const fetchStudentAnnouncementById = async (id) => {
  const res = await request(`${API_BASE_URL}/student/announcements/${id}`);
  return res.data || null;
};

// Admin Announcements
export const fetchAdminAnnouncements = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.search) query.append('search', params.search);
  if (params.course_id) query.append('course_id', params.course_id);
  if (params.batch_id) query.append('batch_id', params.batch_id);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return await request(`${API_BASE_URL}/admin/announcements${qs}`);
};

export const createAdminAnnouncement = async (data) => {
  const res = await request(`${API_BASE_URL}/admin/announcements`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
};

export const updateAdminAnnouncement = async (id, data) => {
  const res = await request(`${API_BASE_URL}/admin/announcements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data;
};

export const publishAdminAnnouncement = async (id) => {
  const res = await request(`${API_BASE_URL}/admin/announcements/${id}/publish`, {
    method: 'PATCH',
  });
  return res.data;
};

export const archiveAdminAnnouncement = async (id) => {
  const res = await request(`${API_BASE_URL}/admin/announcements/${id}/archive`, {
    method: 'PATCH',
  });
  return res.data;
};

export const deleteAdminAnnouncement = async (id) => {
  return await request(`${API_BASE_URL}/admin/announcements/${id}`, {
    method: 'DELETE',
  });
};

// Instructor Announcements
export const fetchInstructorAnnouncements = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.search) query.append('search', params.search);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return await request(`${API_BASE_URL}/instructor/announcements${qs}`);
};

export const createInstructorAnnouncement = async (data) => {
  const res = await request(`${API_BASE_URL}/instructor/announcements`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
};

export const updateInstructorAnnouncement = async (id, data) => {
  const res = await request(`${API_BASE_URL}/instructor/announcements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data;
};

export const publishInstructorAnnouncement = async (id) => {
  const res = await request(`${API_BASE_URL}/instructor/announcements/${id}/publish`, {
    method: 'PATCH',
  });
  return res.data;
};

export const archiveInstructorAnnouncement = async (id) => {
  const res = await request(`${API_BASE_URL}/instructor/announcements/${id}/archive`, {
    method: 'PATCH',
  });
  return res.data;
};
