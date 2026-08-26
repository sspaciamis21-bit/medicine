'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthUser {
  id: string;
  username: string;
  role: string;
  householdId: string;
  householdName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  selectedMember: string;
  setSelectedMember: (id: string) => void;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    username: string;
    password: string;
    householdName: string;
    adminName: string;
    email?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMember, setSelectedMember] = useState<string>('all');

  useEffect(() => {
    // Check saved session in localStorage
    try {
      const stored = localStorage.getItem('medifamily_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Session load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        const authUser: AuthUser = {
          id: data.user.id,
          username: data.user.username,
          role: data.user.role,
          householdId: data.user.householdId,
          householdName: data.household?.name || 'My Family',
        };
        setUser(authUser);
        localStorage.setItem('medifamily_user', JSON.stringify(authUser));
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const register = async (data: {
    username: string;
    password: string;
    householdName: string;
    adminName: string;
    email?: string;
  }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (resData.success) {
        const authUser: AuthUser = {
          id: resData.user.id,
          username: resData.user.username,
          role: resData.user.role,
          householdId: resData.user.householdId,
          householdName: resData.household?.name || 'My Family',
        };
        setUser(authUser);
        localStorage.setItem('medifamily_user', JSON.stringify(authUser));
        return { success: true };
      } else {
        return { success: false, error: resData.error || 'Registration failed' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('medifamily_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        selectedMember,
        setSelectedMember,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
