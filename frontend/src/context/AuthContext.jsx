import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on startup
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('ordercraft_token');
      const storedUser = localStorage.getItem('ordercraft_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Failed to parse stored user:', err);
      localStorage.removeItem('ordercraft_token');
      localStorage.removeItem('ordercraft_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const response = await authApi.login({ username, password });
    const { accessToken, user: userData } = response.data;

    localStorage.setItem('ordercraft_token', accessToken);
    localStorage.setItem('ordercraft_user', JSON.stringify(userData));

    setToken(accessToken);
    setUser(userData);
    return userData;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('ordercraft_token');
    localStorage.removeItem('ordercraft_user');
    setToken(null);
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (role) => {
      return user?.role === role;
    },
    [user]
  );

  const hasAnyRole = useCallback(
    (roles) => {
      if (!user) return false;
      // ADMIN has superuser privileges across all modules
      if (user.role === 'ADMIN') return true;
      return roles.includes(user.role);
    },
    [user]
  );

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
