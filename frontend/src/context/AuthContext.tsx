import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { setAuthToken, setLogoutCallback } from '../services/api';

interface AuthContextValue {
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const isAuthenticated = token !== null;

  const logout = useCallback(() => {
    setToken(null);
    setAuthToken(null);
  }, []);

  // Register the logout callback so the axios interceptor can call it on 401
  useEffect(() => {
    setLogoutCallback(logout);
    return () => setLogoutCallback(null);
  }, [logout]);

  // Keep axios in sync whenever token changes
  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const detail = body?.detail;
      throw new Error(typeof detail === 'string' ? detail : 'Invalid email or password');
    }

    const data = await response.json();
    setToken(data.access_token);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
