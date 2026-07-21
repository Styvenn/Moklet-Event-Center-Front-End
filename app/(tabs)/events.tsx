// app/(tabs)/events.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants/theme';

export default function EventsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Ionicons name="calendar-outline" size={64} color={Colors.primary} />
        <Text style={styles.title}>Daftar Event</Text>
        <Text style={styles.subtitle}>
          Semua event sekolah yang akan datang dan telah selesai akan ditampilkan di sini.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textMain,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSubtitle,
    textAlign: 'center',
    lineHeight: 20,
  },
});
