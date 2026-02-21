import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';
import type { UserResponse, LoginData, RegisterData } from '../services/api';

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (err) {
      // User is not logged in, that's okay
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginData): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.login(data);
      if (response.success && response.data) {
        setUser(response.data);
        setLoading(false);
        return true;
      } else {
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : response.error?.message || 'Login failed';
        setError(errorMsg);
        setLoading(false);
        return false;
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      setLoading(false);
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.register(data);
      if (response.success && response.data) {
        setUser(response.data);
        setLoading(false);
        return true;
      } else {
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : response.error?.message || 'Registration failed';
        setError(errorMsg);
        setLoading(false);
        return false;
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
