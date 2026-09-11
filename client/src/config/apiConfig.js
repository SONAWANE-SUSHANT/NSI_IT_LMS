// Dynamic API URL for Local & Network (LAN) access
// Automatically routes to whatever host served the page (e.g. 192.168.1.39 or localhost)
export const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:5000/api';
  const host = window.location.hostname || 'localhost';
  return `http://${host}:5000/api`;
};

export const API_BASE_URL = getApiBaseUrl();
