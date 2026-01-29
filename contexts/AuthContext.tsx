import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import * as api from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  const checkAuth = useCallback(async () => {
    try {
      const hasStoredToken = await api.hasToken();
      if (hasStoredToken) {
        const currentUser = await api.getCurrentUser();
        if (isMounted.current) {
          setUser(currentUser);
        }
      }
    } catch (error) {
      // Token invalid or expired - silently logout
      await api.logout();
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    checkAuth();
    return () => {
      isMounted.current = false;
    };
  }, [checkAuth]);

  const login = async (email: string, password: string): Promise<User> => {
    const { user: loggedInUser } = await api.login(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (email: string, password: string, name: string): Promise<User> => {
    const { user: registeredUser } = await api.register(email, password, name);
    setUser(registeredUser);
    return registeredUser;
  };

  const logout = async (): Promise<void> => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
