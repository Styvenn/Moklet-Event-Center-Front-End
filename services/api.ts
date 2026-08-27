// services/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://mecbirutelkom.up.railway.app';
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

// Helper generic storage aman untuk Web & Mobile Native (JSON / Objects)
export const appStorage = {
  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      let raw: string | null = null;
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          raw = localStorage.getItem(key);
        }
      } else {
        raw = await SecureStore.getItemAsync(key);
      }
      if (!raw) return defaultValue;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.warn(`Error reading key ${key} from storage:`, e);
      return defaultValue;
    }
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const raw = JSON.stringify(value);
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, raw);
        }
        return;
      }
      await SecureStore.setItemAsync(key, raw);
    } catch (e) {
      console.warn(`Error saving key ${key} to storage:`, e);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn(`Error deleting key ${key} from storage:`, e);
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

/**
 * Helper untuk mengambil pesan error yang ramah pengguna dari object error apapun.
 */
export function getErrorMessage(err: unknown, fallback = 'Terjadi kesalahan pada sistem. Silakan coba lagi.'): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  
  const e = err as any;
  if (e.formattedMessage && typeof e.formattedMessage === 'string') {
    return e.formattedMessage;
  }
  if (typeof e.message === 'string' && e.message.trim().length > 0) {
    return e.message;
  }
  if (Array.isArray(e.message)) {
    return e.message.join('\n');
  }
  if (e.response?.data?.message) {
    const rm = e.response.data.message;
    return Array.isArray(rm) ? rm.join('\n') : String(rm);
  }
  return fallback;
}

// Response Interceptor: Unwrap data standar & Normalisasi error
api.interceptors.response.use(
  (response) => {
    // Jika backend mengirim interceptor standar: { statusCode, message, data, meta }
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    const responseData = error.response?.data;
    const statusCode = error.response?.status || responseData?.statusCode || (error.response ? 500 : 0);
    const rawMessage = responseData?.message || error.message || 'Terjadi kesalahan pada server';

    let formattedMessage = '';
    if (Array.isArray(rawMessage)) {
      formattedMessage = rawMessage.join('\n');
    } else if (typeof rawMessage === 'object' && rawMessage !== null) {
      formattedMessage = JSON.stringify(rawMessage);
    } else {
      formattedMessage = String(rawMessage);
    }

    const lowerMsg = formattedMessage.toLowerCase();

    // Penanganan Network / Offline Error
    if (!error.response || statusCode === 0 || lowerMsg.includes('network error') || lowerMsg.includes('timeout') || lowerMsg.includes('econnrefused')) {
      formattedMessage = 'Tidak dapat terhubung ke server. Pastikan koneksi internet aktif dan server dapat diakses.';
    } else if (statusCode === 500) {
      if (lowerMsg.includes('p2002') || lowerMsg.includes('unique constraint') || lowerMsg.includes('duplicate')) {
        formattedMessage = 'Data sudah terdaftar di sistem (duplikat). Periksa kembali data yang dimasukkan.';
      } else if (
        lowerMsg.includes('p2003') ||
        lowerMsg.includes('foreign key') ||
        lowerMsg.includes('constraint') ||
        lowerMsg.includes('student') ||
        lowerMsg.includes('siswa')
      ) {
        formattedMessage = 'Tidak dapat memproses data karena masih terhubung dengan data lain (misalnya kelas masih memiliki siswa).';
      } else if (lowerMsg === 'internal server error' || lowerMsg.includes('terjadi kesalahan pada server')) {
        formattedMessage = 'Terjadi kendala pada server backend. Pastikan data valid dan tidak melanggar aturan sistem.';
      }
    } else if (statusCode === 400) {
      if (lowerMsg.includes('already exists') || lowerMsg.includes('sudah ada')) {
        formattedMessage = 'Data tersebut sudah ada di sistem.';
      }
    } else if (statusCode === 401) {
      if (lowerMsg === 'unauthorized' || !rawMessage) {
        formattedMessage = 'Email atau password salah. Silakan periksa kembali.';
      }
    } else if (statusCode === 403) {
      if (lowerMsg === 'forbidden' || !rawMessage) {
        formattedMessage = 'Akses ditolak. Akun Anda tidak memiliki izin untuk melakukan tindakan ini.';
      }
    } else if (statusCode === 404) {
      if (lowerMsg.includes('application not found')) {
        formattedMessage = 'Server backend di Railway sedang tidak aktif atau URL server tidak ditemukan.';
      } else if (!rawMessage || lowerMsg === 'not found' || lowerMsg.startsWith('cannot post') || lowerMsg.startsWith('cannot get')) {
        formattedMessage = 'Layanan atau data yang diminta tidak ditemukan di server.';
      }
    }

    // Jika backend mengirim pesan validasi spesifik (misal dari class-validator / NestJS)
    if (responseData?.message && typeof responseData.message === 'string' && responseData.message !== 'Internal server error') {
      formattedMessage = responseData.message;
    } else if (Array.isArray(responseData?.message)) {
      formattedMessage = responseData.message.join('\n');
    }

    const normalizedError: ApiErrorResponse & { response?: any; data?: any } = {
      statusCode,
      message: rawMessage,
      error: responseData?.error || 'Error',
      formattedMessage,
      response: error.response,
      data: responseData,
    };

    return Promise.reject(normalizedError);
  }
);

export default api;
