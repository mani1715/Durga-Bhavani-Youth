import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'OPERATOR' | 'VIEWER';
  organization_id: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { buildApiUrl } from '../services/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const currentToken = localStorage.getItem('token');

    if (!currentToken) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    fetch(buildApiUrl('/api/auth/me'), {
      headers: { Authorization: `Bearer ${currentToken}` },
      signal: controller.signal,
    })
      .then(async (res) => {
        clearTimeout(timeoutId);
        if (!isMounted) return;

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          try {
            localStorage.setItem('user', JSON.stringify(userData));
          } catch {}
        } else if (res.status === 401 || res.status === 403) {
          // Token is genuinely invalid or expired
          console.warn('[Auth] Session token expired or invalid (401/403). Clearing session.');
          logout();
        } else {
          // Temporary server error (500, 502, 503) - Preserve session!
          console.warn(`[Auth] Backend status ${res.status} during verification. Preserving existing session.`);
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (!isMounted) return;
        // Network timeout or temporary failure - Preserve session!
        console.warn('[Auth] Network error or timeout verifying session. Preserving session:', err.message);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  const login = async (accessToken: string, refreshToken: string) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setToken(accessToken);

    // Fetch user profile immediately
    try {
      const res = await fetch(buildApiUrl('/api/auth/me'), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (e) {
      console.warn('Failed to fetch user details on login:', e);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
