// app/_layout.tsx
import React, { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { focusManager, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/react-query';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  useEffect(() => {
    // Penanganan khusus Android untuk NavigationBar agar tidak memicu warning di iOS
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#F2F2F2');
      NavigationBar.setButtonStyleAsync('dark');
    }

    if (Platform.OS === 'web') return;
    // Sinkronkan fokus TanStack Query dengan lifecycle app:
    // saat app kembali aktif (foreground), query yang stale otomatis refetch.
    const subscription = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
    });
    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#F2F2F2' },
            animation: 'default',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="verify-otp" />
          <Stack.Screen name="setup-password" />
          <Stack.Screen name="complete-profile" />
          <Stack.Screen name="google-oauth" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(panitia)" />
          <Stack.Screen name="event-detail" />
          <Stack.Screen name="daftar-lomba" />
          <Stack.Screen name="room-tim" />
          <Stack.Screen name="arsip-pengumuman" />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
