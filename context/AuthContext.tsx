// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { tokenStorage, ApiErrorResponse } from '../services/api';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

export interface StudentProfile {
  id: string;
  name: string;
  nis: string;
  classId?: string;
  avatarUrl?: string;
  class?: {
    id: string;
    grade: string;
    name: string;
  };
}

export interface UserAccount {
  id: string;
  email: string;
  role: 'SISWA' | 'PANITIA' | 'ADMIN_KESISWAAN';
  isEmailVerified: boolean;
  student?: StudentProfile | null;
}

export interface VerifyPasswordResetDto {
  token?: string;
  code?: string;
  email?: string;
  password?: string;
  newPassword?: string;
}

interface AuthContextType {
  user: UserAccount | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string) => Promise<any>;
  verifyOtp: (email: string, code: string) => Promise<any>;
  requestOtp: (email: string) => Promise<any>;
  setupPassword: (password: string) => Promise<any>;
  bindIdentity: (studentId: string) => Promise<any>;
  verifyPasswordReset: (dto: VerifyPasswordResetDto) => Promise<any>;
  refreshMe: () => Promise<UserAccount | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserAccount | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshMe = async (): Promise<UserAccount | null> => {
    try {
      const res: any = await api.get('/auth/me');
      // NestJS response unwrap fallback
      const userData: UserAccount = res?.data || res;
      setUser(userData);
      return userData;
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
      setUser(null);
      return null;
    }
  };

  // Restore Session saat app dibuka
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await tokenStorage.getItem();
        if (storedToken) {
          setToken(storedToken);
          const currentUser = await refreshMe();
          if (!currentUser) {
            // Token expired atau invalid
            await tokenStorage.removeItem();
            setToken(null);
          }
        }
      } catch (e) {
        console.warn('Session restore failed:', e);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const res: any = await api.post('/auth/login', { email, password });
    // Swagger response login: token or accessToken
    const jwtToken = res?.accessToken || res?.token || res?.data?.token || res?.data?.accessToken;
    
    if (jwtToken) {
      await tokenStorage.setItem(jwtToken);
      setToken(jwtToken);
      await refreshMe();
    }
    return res;
  };

  const register = async (email: string, password: string) => {
    return await api.post('/auth/register', { email, password });
  };

  const verifyOtp = async (email: string, code: string) => {
    const res: any = await api.post('/auth/otp/verify', { email, code });
    const jwtToken = res?.accessToken || res?.token || res?.data?.token || res?.data?.accessToken;
    if (jwtToken) {
      await tokenStorage.setItem(jwtToken);
      setToken(jwtToken);
      await refreshMe();
    }
    return res;
  };

  const requestOtp = async (email: string) => {
    return await api.post('/auth/otp/request', { email });
  };

  const setupPassword = async (password: string) => {
    return await api.post('/auth/setup-password', { password });
  };

  const bindIdentity = async (studentId: string) => {
    const res: any = await api.post('/auth/bind-identity', { studentId });
    const jwtToken = res?.accessToken || res?.token || res?.data?.token || res?.data?.accessToken;
    if (jwtToken) {
      await tokenStorage.setItem(jwtToken);
      setToken(jwtToken);
    }
    await refreshMe();
    return res;
  };

  const verifyPasswordReset = async (dto: VerifyPasswordResetDto) => {
    // Sesuai API contract backend, reset password verify menggunakan HTTP POST
    return await api.post('/auth/password/reset-verify', dto);
  };

  const logout = async () => {
    await tokenStorage.removeItem();
    // Hapus seluruh cache query agar data akun sebelumnya
    // tidak tersisa saat siswa lain login di HP yang sama.
    queryClient.clear();
    setToken(null);
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        verifyOtp,
        requestOtp,
        setupPassword,
        bindIdentity,
        verifyPasswordReset,
        refreshMe,
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
