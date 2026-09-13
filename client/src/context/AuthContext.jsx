import { useState, useEffect, useMemo, useCallback } from 'react';
import { AuthContext } from './AuthContextCore';
import { loginApi } from '../services/authService';
import { getAllowedPortalsForRole } from '../utils/roleUtils';

const TOKEN_KEY = 'nsi_lms_token';
const USER_KEY = 'nsi_lms_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sync state with localStorage
  useEffect(() => {
    if (token && user) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }, [token, user]);

  const allowedPortals = useMemo(() => {
    if (!user || !user.role) return [];
    return getAllowedPortalsForRole(user.role);
  }, [user]);

  const isAuthenticated = Boolean(token && user);

  const hasPortalAccess = useCallback(
    (portalName) => {
      if (!portalName) return false;
      return allowedPortals.includes(portalName.toLowerCase());
    },
    [allowedPortals]
  );

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const data = await loginApi(username, password);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      if (!prev) return prev;
      const nextUser = { ...prev, ...updatedFields };
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated,
      isLoading,
      allowedPortals,
      hasPortalAccess,
      login,
      logout,
      updateUser,
    }),
    [token, user, isAuthenticated, isLoading, allowedPortals, hasPortalAccess, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

