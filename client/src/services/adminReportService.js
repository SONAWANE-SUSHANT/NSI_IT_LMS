import { getAuthToken } from '../utils/token';
import { API_BASE_URL } from '../config/apiConfig';

/**
 * Standard fetch helper with Auth headers
 */
async function fetchWithAuth(endpoint, options = {}) {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || 'API request failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Converts params object to URL query string
 */
function buildQueryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  const str = query.toString();
  return str ? `?${str}` : '';
}

/**
 * 1. Overview KPI statistics
 */
export async function getOverviewStats() {
  const res = await fetchWithAuth('/admin/reports/overview');
  return res.data;
}

/**
 * 2. Student Progress & Completion Report
 */
export async function getStudentProgressReport(filters = {}) {
  const qs = buildQueryString(filters);
  const res = await fetchWithAuth(`/admin/reports/student-progress${qs}`);
  return res.data;
}

/**
 * 3. Quiz & Assessments Performance Report
 */
export async function getQuizPerformanceReport(filters = {}) {
  const qs = buildQueryString(filters);
  const res = await fetchWithAuth(`/admin/reports/quizzes${qs}`);
  return res.data;
}

/**
 * 4. Batches & Capacity Utilization Report
 */
export async function getBatchAnalyticsReport(filters = {}) {
  const qs = buildQueryString(filters);
  const res = await fetchWithAuth(`/admin/reports/batches${qs}`);
  return res.data;
}

/**
 * 5. Course Feedback & Reviews Report
 */
export async function getCourseFeedbackReport(filters = {}) {
  const qs = buildQueryString(filters);
  const res = await fetchWithAuth(`/admin/reports/feedback${qs}`);
  return res.data;
}

/**
 * 6. Security, Login & Device Audit Report
 */
export async function getSecurityAuditReport(filters = {}) {
  const qs = buildQueryString(filters);
  const res = await fetchWithAuth(`/admin/reports/devices${qs}`);
  return res.data;
}

/**
 * 7. Individual Student 360° Comprehensive Dossier
 */
export async function getStudentDossierReport(studentId) {
  const res = await fetchWithAuth(`/admin/reports/students/${studentId}/dossier`);
  return res.data;
}
