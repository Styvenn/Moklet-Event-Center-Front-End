// services/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://birumoklet.up.railway.app';
const TOKEN_KEY = 'mec_auth_token';

// Helper storage aman untuk Web & Mobile Native
export const tokenStorage = {
  async getItem(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          return localStorage.getItem(TOKEN_KEY);
        }
        return null;
      }
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn('Error reading token from storage:', e);
      return null;
    }
  },

  async setItem(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          localStorage.setItem(TOKEN_KEY, token);
        }
        return;
      }
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
      console.warn('Error saving token to storage:', e);
    }
  },

  async removeItem(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(TOKEN_KEY);
        }
        return;
      }
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn('Error deleting token from storage:', e);
    }
  },
};

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Tempel Authorization Header jika token tersedia
api.interceptors.request.use(
  async (config) => {
    const token = await tokenStorage.getItem();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interface Error terstruktur
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  formattedMessage: string;
}

// Response Interceptor: Unwrap data standar & Normalisasi error
api.interceptors.response.use(
  (response) => {
    // Jika backend mengirim interceptor standar: { statusCode, message, data, meta }
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data;
    }
    return response.data;
  },
  (error) => {
    const responseData = error.response?.data;
    const statusCode = error.response?.status || responseData?.statusCode || 500;
    const rawMessage = responseData?.message || error.message || 'Terjadi kesalahan pada server';
    
    let formattedMessage = '';
    if (Array.isArray(rawMessage)) {
      formattedMessage = rawMessage.join('\n');
    } else {
      formattedMessage = String(rawMessage);
    }

    const normalizedError: ApiErrorResponse = {
      statusCode,
      message: rawMessage,
      error: responseData?.error || 'Error',
      formattedMessage,
    };

    return Promise.reject(normalizedError);
  }
);

export default api;
