import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { AuthToken } from '../types';

interface AuthContextType {
  user: AuthToken | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (token: AuthToken) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadUser(): AuthToken | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthToken | null>(loadUser);

  const login = useCallback((token: AuthToken) => {
    localStorage.setItem('access_token', token.access_token);
    localStorage.setItem('user', JSON.stringify(token));
    setUser(token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin: user?.is_admin ?? false,
      isAuthenticated: !!user,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
