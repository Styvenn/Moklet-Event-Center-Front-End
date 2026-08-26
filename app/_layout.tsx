// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  useEffect(() => {
    NavigationBar.setBackgroundColorAsync('#F2F2F2');
    NavigationBar.setButtonStyleAsync('dark');
  }, []);

  return (
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
        <Stack.Screen name="profile" />
      </Stack>
    </AuthProvider>
  );
}
