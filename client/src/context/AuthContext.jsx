/**
 * context/AuthContext.jsx — Global auth state
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [loading, setLoading] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      authService.getMe()
        .then(res => setUser(res.data.user))
        .catch(() => logout());
    }
  }, []);

  // Login function — handles both token and accessToken
  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await authService.login(credentials);
      const token = res.data.token || res.data.accessToken;
      const user  = res.data.user;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      return user;
    } finally {
      setLoading(false);
    }
  };

  // Register function — same fix for token
  const register = async (data) => {
    setLoading(true);
    try {
      const res = await authService.register(data);
      const token = res.data.token || res.data.accessToken;
      const user  = res.data.user;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      return user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin     = user?.role === 'admin';
  const isHR        = user?.role === 'hr';
  const isCandidate = user?.role === 'candidate';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isHR, isCandidate }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};