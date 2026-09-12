import { API_BASE_URL } from '../config/apiConfig';
const TOKEN_KEY = 'nsi_lms_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponseError(response, defaultMsg = 'An error occurred') {
  let errorData = null;
  try {
    errorData = await response.json();
  } catch {
    // Response body not JSON
  }

  const backendMessage = errorData?.message;

  switch (response.status) {
    case 400:
      throw new Error(backendMessage || 'Please check the entered information.');
    case 401:
      throw new Error('Your session has expired. Please log in again.');
    case 403:
      throw new Error(backendMessage || 'You do not have permission to perform this action.');
    case 404:
      throw new Error(backendMessage || 'Requested user was not found.');
    case 409:
      throw new Error(backendMessage || 'Username or email already exists.');
    case 500:
      throw new Error(backendMessage || 'Something went wrong on the server. Please try again.');
    default:
      throw new Error(backendMessage || defaultMsg);
  }
}

export async function getUsers(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.role_id) params.append('role_id', filters.role_id);
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.search && filters.search.trim()) params.append('search', filters.search.trim());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/admin/users${queryString}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleResponseError(response, 'Failed to fetch users');
    }

    const json = await response.json();
    return json.data || [];
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to LMS server. Please ensure the backend is running.');
    }
    throw error;
  }
}

export async function getUserById(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleResponseError(response, 'Failed to fetch user details');
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to LMS server. Please ensure the backend is running.');
    }
    throw error;
  }
}

export async function createUser(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      await handleResponseError(response, 'Failed to create user account');
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to LMS server. Please ensure the backend is running.');
    }
    throw error;
  }
}

export async function createStudent(studentData) {
  return createUser({
    first_name: studentData.first_name?.trim(),
    last_name: studentData.last_name?.trim(),
    email: studentData.email?.trim(),
    username: studentData.username?.trim(),
    password: studentData.password,
    role_id: 3,
  });
}

export async function createInstructor(instructorData) {
  return createUser({
    first_name: instructorData.first_name?.trim(),
    last_name: instructorData.last_name?.trim(),
    email: instructorData.email?.trim(),
    username: instructorData.username?.trim(),
    password: instructorData.password,
    role_id: 2,
  });
}

export async function updateUser(id, updateData) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      await handleResponseError(response, 'Failed to update user');
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to LMS server. Please ensure the backend is running.');
    }
    throw error;
  }
}

export async function updateUserStatus(id, status) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      await handleResponseError(response, 'Failed to update user status');
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to LMS server. Please ensure the backend is running.');
    }
    throw error;
  }
}

export async function importStudents(rows) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/students/import`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rows }),
    });

    if (!response.ok) {
      await handleResponseError(response, 'Failed to import students');
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to LMS server. Please ensure the backend is running.');
    }
    throw error;
  }
}

export async function fetchUserDevices(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/devices`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleResponseError(response, 'Failed to fetch registered devices');
    }

    const json = await response.json();
    return {
      devices: json.data || [],
      activeCount: Number(json.active_count || 0),
      maxActiveDevices: Number(json.max_active_devices || 2),
    };
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to LMS server. Please ensure the backend is running.');
    }
    throw error;
  }
}

export async function removeUserDevice(userId, deviceId) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/devices/${deviceId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleResponseError(response, 'Failed to remove device');
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to LMS server. Please ensure the backend is running.');
    }
    throw error;
  }
}
