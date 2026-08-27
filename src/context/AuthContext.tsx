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
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (
    data: {
      username: string;
      password: string;
      householdName: string;
      adminName: string;
      email?: string;
      phone?: string;
    },
    rememberMe?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMember, setSelectedMember] = useState<string>('all');

  useEffect(() => {
    // Check saved session in localStorage (persistent) or sessionStorage (session-only)
    try {
      const local = typeof window !== 'undefined' ? localStorage.getItem('medifamily_user') : null;
      const session = typeof window !== 'undefined' ? sessionStorage.getItem('medifamily_user') : null;

      if (local) {
        setUser(JSON.parse(local));
      } else if (session) {
        setUser(JSON.parse(session));
      }
    } catch (e) {
      console.error('Session load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean = true) => {
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

        if (rememberMe) {
          localStorage.setItem('medifamily_user', JSON.stringify(authUser));
          localStorage.setItem('medifamily_saved_username', username);
          sessionStorage.removeItem('medifamily_user');
          // Set 1-year persistent cookie
          document.cookie = `medifamily_user=${encodeURIComponent(JSON.stringify(authUser))}; path=/; max-age=31536000; SameSite=Lax`;
        } else {
          sessionStorage.setItem('medifamily_user', JSON.stringify(authUser));
          localStorage.removeItem('medifamily_user');
          localStorage.removeItem('medifamily_saved_username');
          document.cookie = 'medifamily_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }

        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const register = async (
    data: {
      username: string;
      password: string;
      householdName: string;
      adminName: string;
      email?: string;
      phone?: string;
    },
    rememberMe: boolean = true
  ) => {
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

        if (rememberMe) {
          localStorage.setItem('medifamily_user', JSON.stringify(authUser));
          localStorage.setItem('medifamily_saved_username', data.username);
          sessionStorage.removeItem('medifamily_user');
          document.cookie = `medifamily_user=${encodeURIComponent(JSON.stringify(authUser))}; path=/; max-age=31536000; SameSite=Lax`;
        } else {
          sessionStorage.setItem('medifamily_user', JSON.stringify(authUser));
          localStorage.removeItem('medifamily_user');
          localStorage.removeItem('medifamily_saved_username');
          document.cookie = 'medifamily_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }

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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('medifamily_user');
      sessionStorage.removeItem('medifamily_user');
      document.cookie = 'medifamily_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.href = '/';
    }
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
