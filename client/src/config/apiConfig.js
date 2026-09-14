// Dynamic API URL for Local, Deployed & Network (LAN) access
export const getApiBaseUrl = () => {
  // 1. Explicit Vite environment variable (set in .env or Vercel dashboard)
  const envUrl = import.meta.env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    const cleanUrl = envUrl.trim().replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }

  // 2. Production hosted fallback (e.g. Vercel deployment or HTTPS access)
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '';
    if (
      host.includes('vercel.app') ||
      host.includes('onrender.com') ||
      window.location.protocol === 'https:'
    ) {
      return 'https://nsi-it-lms-1.onrender.com/api';
    }
    return `http://${host || 'localhost'}:5000/api`;
  }

  return 'https://nsi-it-lms-1.onrender.com/api';
};

export const API_BASE_URL = getApiBaseUrl();


