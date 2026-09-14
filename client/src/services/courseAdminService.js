import { API_BASE_URL } from '../config/apiConfig';
import { getAuthToken, getViewingInstructorId } from '../utils/token';

function getAuthHeaders() {
  const token = getAuthToken();
  const viewingInstructorId = getViewingInstructorId();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(viewingInstructorId ? { 'x-instructor-id': String(viewingInstructorId) } : {}),
  };
}

async function handleResponse(response, defaultMsg) {
  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      // Ignore invalid JSON error bodies.
    }
    throw new Error(errorData?.message || defaultMsg);
  }

  const json = await response.json();
  return json.data || [];
}

async function request(path, options = {}, defaultMsg = 'Request failed') {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
    });
    return handleResponse(response, defaultMsg);
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to LMS server. Please ensure the backend is running.');
    }
    throw error;
  }
}

function queryString(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'ALL') {
      params.append(key, value);
    }
  });
  return params.toString() ? `?${params.toString()}` : '';
}

export const getCourses = (filters) =>
  request(`/courses${queryString(filters)}`, {}, 'Failed to load courses');

export const createCourse = (data) =>
  request('/admin/courses', {
    method: 'POST',
    body: JSON.stringify(data),
  }, 'Failed to create course');

export const updateCourse = (id, data) =>
  request(`/admin/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, 'Failed to update course');

export const updateCourseStatus = (id, status) =>
  request(`/admin/courses/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }, 'Failed to update course status');

export const getCourseBatches = (courseId, filters) =>
  request(`/admin/courses/${courseId}/batches${queryString(filters)}`, {}, 'Failed to load batches');

export const createCourseBatch = (courseId, data) =>
  request(`/admin/courses/${courseId}/batches`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, 'Failed to create batch');

export const updateCourseBatch = (id, data) =>
  request(`/admin/batches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, 'Failed to update batch');

export const updateCourseBatchStatus = (id, status) =>
  request(`/admin/batches/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }, 'Failed to update batch status');

export const getBatchInstructors = (batchId) =>
  request(`/admin/batches/${batchId}/instructors`, {}, 'Failed to load batch instructors');

export const assignBatchInstructor = (batchId, instructorId) =>
  request(`/admin/batches/${batchId}/instructors`, {
    method: 'POST',
    body: JSON.stringify({ instructor_id: instructorId }),
  }, 'Failed to assign instructor');

export const updateBatchInstructorStatus = (batchId, instructorId, status) =>
  request(`/admin/batches/${batchId}/instructors/${instructorId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }, 'Failed to update instructor assignment');

export const removeBatchInstructor = (batchId, instructorId) =>
  request(`/admin/batches/${batchId}/instructors/${instructorId}`, {
    method: 'DELETE',
  }, 'Failed to remove instructor assignment');

export const getBatchStudents = (batchId) =>
  request(`/admin/batches/${batchId}/students`, {}, 'Failed to load batch students');

export const enrollBatchStudent = (batchId, studentId) =>
  request(`/admin/batches/${batchId}/students`, {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId }),
  }, 'Failed to enroll student');

export const updateBatchStudentStatus = (batchId, studentId, status) =>
  request(`/admin/batches/${batchId}/students/${studentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }, 'Failed to update student enrollment');

export const removeBatchStudent = (batchId, studentId) =>
  request(`/admin/batches/${batchId}/students/${studentId}`, {
    method: 'DELETE',
  }, 'Failed to remove student enrollment');

// ─── Course Modules ───────────────────────────────────────────────────────────

export const getModulesByCourse = (courseId) =>
  request(`/courses/${courseId}/modules`, {}, 'Failed to load modules');

export const createModule = (courseId, data) =>
  request(`/courses/${courseId}/modules`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, 'Failed to create module');

export const updateModule = (moduleId, data) =>
  request(`/modules/${moduleId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, 'Failed to update module');

export const updateModuleStatus = (moduleId, status) =>
  request(`/modules/${moduleId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }, 'Failed to update module status');

export const deleteModule = (moduleId) =>
  request(`/modules/${moduleId}`, {
    method: 'DELETE',
  }, 'Failed to archive module');

// ─── Lectures ─────────────────────────────────────────────────────────────────

export const getLecturesByModule = (moduleId) =>
  request(`/modules/${moduleId}/lectures`, {}, 'Failed to load lectures');

export const createLecture = (moduleId, data) =>
  request(`/modules/${moduleId}/lectures`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, 'Failed to create lecture');

export const updateLecture = (lectureId, data) =>
  request(`/lectures/${lectureId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, 'Failed to update lecture');

export const updateLectureStatus = (lectureId, status) =>
  request(`/lectures/${lectureId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }, 'Failed to update lecture status');

export const deleteLecture = (lectureId) =>
  request(`/lectures/${lectureId}`, {
    method: 'DELETE',
  }, 'Failed to archive lecture');

// ─── Lecture Notes & Materials ────────────────────────────────────────────────

export const getLectureNotes = (lectureId) =>
  request(`/lectures/${lectureId}/notes`, {}, 'Failed to load notes');

export const createLectureNote = (lectureId, data) =>
  request(`/lectures/${lectureId}/notes`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, 'Failed to create note');

export const updateLectureNote = (noteId, data) =>
  request(`/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, 'Failed to update note');

export const updateLectureNoteStatus = (noteId, status) =>
  request(`/notes/${noteId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }, 'Failed to update note status');

export const deleteLectureNote = (noteId) =>
  request(`/notes/${noteId}`, {
    method: 'DELETE',
  }, 'Failed to delete note');

