// lib/react-query.ts
import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Inisialisasi storage untuk async cache / persistence yang 100% kompatibel dengan Expo Go
export const appStorage = AsyncStorage;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Cache optimal 5 menit
      gcTime: 1000 * 60 * 60 * 24, // Garbage collection 24 jam
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
