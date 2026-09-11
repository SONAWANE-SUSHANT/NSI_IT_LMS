export const TOKEN_KEY = 'nsi_lms_token';

export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const removeAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const VIEWING_INSTRUCTOR_KEY = 'nsi_viewing_instructor_id';

export const getViewingInstructorId = () => {
  try {
    return sessionStorage.getItem(VIEWING_INSTRUCTOR_KEY) || localStorage.getItem(VIEWING_INSTRUCTOR_KEY) || null;
  } catch {
    return null;
  }
};

export const setViewingInstructorId = (id) => {
  if (id) {
    try {
      sessionStorage.setItem(VIEWING_INSTRUCTOR_KEY, String(id));
      localStorage.setItem(VIEWING_INSTRUCTOR_KEY, String(id));
    } catch {
      // Storage failure fallback
    }
  } else {
    clearViewingInstructorId();
  }
};

export const clearViewingInstructorId = () => {
  try {
    sessionStorage.removeItem(VIEWING_INSTRUCTOR_KEY);
    localStorage.removeItem(VIEWING_INSTRUCTOR_KEY);
  } catch {
    // Storage failure fallback
  }
};

export const VIEWING_STUDENT_KEY = 'nsi_viewing_student_id';

export const getViewingStudentId = () => {
  try {
    return sessionStorage.getItem(VIEWING_STUDENT_KEY) || localStorage.getItem(VIEWING_STUDENT_KEY) || null;
  } catch {
    return null;
  }
};

export const setViewingStudentId = (id) => {
  if (id) {
    try {
      sessionStorage.setItem(VIEWING_STUDENT_KEY, String(id));
      localStorage.setItem(VIEWING_STUDENT_KEY, String(id));
    } catch {
      // Storage failure fallback
    }
  } else {
    clearViewingStudentId();
  }
};

export const clearViewingStudentId = () => {
  try {
    sessionStorage.removeItem(VIEWING_STUDENT_KEY);
    localStorage.removeItem(VIEWING_STUDENT_KEY);
  } catch {
    // Storage failure fallback
  }
};
