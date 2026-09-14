// Dynamic API URL for Local, Deployed & Network (LAN) access
export const getApiBaseUrl = () => {
  // 1. Check for Vite environment variable (e.g. VITE_API_URL=https://nsi-it-lms-1.onrender.com)
  const envUrl = import.meta.env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string') {
    const cleanUrl = envUrl.trim().replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }

  // 2. Fallback to current host or localhost
  if (typeof window === 'undefined') return 'http://localhost:5000/api';
  const host = window.location.hostname || 'localhost';
  return `http://${host}:5000/api`;
};

export const API_BASE_URL = getApiBaseUrl();

