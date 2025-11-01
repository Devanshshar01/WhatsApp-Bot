import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchSession, login as apiLogin, logout as apiLogout } from '../api/adminClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        setLoading(true);
        await fetchSession();
        if (isMounted) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (password) => {
    setError(null);
    try {
      await apiLogin(password);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      const message = err?.response?.data?.error || 'Unable to login. Check password and try again.';
      setError(message);
      setIsAuthenticated(false);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      setIsAuthenticated(false);
    }
  };

  const value = useMemo(
    () => ({ isAuthenticated, loading, error, login, logout, clearError: () => setError(null) }),
    [isAuthenticated, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return ctx;
}
