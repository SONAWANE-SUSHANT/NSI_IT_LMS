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
 * Get public/active course reviews
 */
export const fetchCourseReviews = async (courseId, { page = 1, limit = 10 } = {}) => {
  const query = new URLSearchParams({ page, limit });
  const res = await request(`${API_BASE_URL}/courses/${courseId}/reviews?${query.toString()}`);
  return res;
};

/**
 * Get course review summary & rating distribution
 */
export const fetchCourseReviewSummary = async (courseId) => {
  const res = await request(`${API_BASE_URL}/courses/${courseId}/reviews/summary`);
  return res.data;
};

/**
 * Get authenticated student's own review
 */
export const fetchMyCourseReview = async (courseId) => {
  const res = await request(`${API_BASE_URL}/student/courses/${courseId}/reviews/me`);
  return res.data;
};

/**
 * Submit student review for a course
 */
export const submitCourseReview = async (courseId, { rating, review }) => {
  const res = await request(`${API_BASE_URL}/student/courses/${courseId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ rating, review }),
  });
  return res.data;
};

/**
 * Update student's existing review
 */
export const updateCourseReview = async (courseId, { rating, review }) => {
  const res = await request(`${API_BASE_URL}/student/courses/${courseId}/reviews/me`, {
    method: 'PUT',
    body: JSON.stringify({ rating, review }),
  });
  return res.data;
};

/**
 * Delete student's review
 */
export const deleteCourseReview = async (courseId) => {
  const res = await request(`${API_BASE_URL}/student/courses/${courseId}/reviews/me`, {
    method: 'DELETE',
  });
  return res;
};

/**
 * Admin: Get course reviews (including HIDDEN)
 */
export const fetchAdminCourseReviews = async (courseId, { status, page = 1, limit = 20 } = {}) => {
  const query = new URLSearchParams({ page, limit });
  if (status) query.append('status', status);
  const res = await request(`${API_BASE_URL}/admin/courses/${courseId}/reviews?${query.toString()}`);
  return res;
};

/**
 * Admin: Hide a review
 */
export const hideReview = async (reviewId) => {
  const res = await request(`${API_BASE_URL}/admin/reviews/${reviewId}/hide`, {
    method: 'PATCH',
  });
  return res.data;
};

/**
 * Admin: Restore a hidden review
 */
export const restoreReview = async (reviewId) => {
  const res = await request(`${API_BASE_URL}/admin/reviews/${reviewId}/restore`, {
    method: 'PATCH',
  });
  return res.data;
};

/**
 * Instructor: Get assigned course reviews
 */
export const fetchInstructorCourseReviews = async (courseId, { page = 1, limit = 20 } = {}) => {
  const query = new URLSearchParams({ page, limit });
  const res = await request(`${API_BASE_URL}/instructor/courses/${courseId}/reviews?${query.toString()}`);
  return res;
};
