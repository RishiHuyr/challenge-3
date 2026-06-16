import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<UserProfile>;
  signup: (name: string, email: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  updateProfile: (name?: string, email?: string, password?: string) => Promise<UserProfile>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session and fetch CSRF token on startup
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Trigger health endpoint to seed XSRF-TOKEN cookie
        await apiRequest('/health');
        
        // Fetch current user details
        const res = await apiRequest('/auth/me');
        if (res.success && res.data) {
          setUser(res.data);
        }
      } catch (err: any) {
        // Fail silently on boot if not logged in
        console.log('User session not active');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    setError(null);
    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.success && res.data) {
        setUser(res.data);
        return res.data;
      }
      throw new Error('Invalid credentials returned');
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<UserProfile> => {
    setError(null);
    try {
      const res = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      if (res.success && res.data) {
        setUser(res.data);
        return res.data;
      }
      throw new Error('Registration failed');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error on backend', err);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (
    name?: string,
    email?: string,
    password?: string
  ): Promise<UserProfile> => {
    setError(null);
    try {
      const res = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, email, password }),
      });
      if (res.success && res.data) {
        setUser(res.data);
        return res.data;
      }
      throw new Error('Profile update failed');
    } catch (err: any) {
      setError(err.message || 'Profile update failed');
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        signup,
        logout,
        updateProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
