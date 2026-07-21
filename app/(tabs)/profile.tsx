// app/(tabs)/profile.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { userState } from '../../constants/userState';

export default function ProfileScreen() {
  const username = userState.getNama();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle-outline" size={100} color={Colors.primary} />
          <Text style={styles.name}>{username}</Text>
          <Text style={styles.subtitle}>Siswa SMKN 4 Malang</Text>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={22} color={Colors.textMain} />
            <Text style={styles.menuText}>Pengaturan Akun</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSubtitle} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="shield-checkmark-outline" size={22} color={Colors.textMain} />
            <Text style={styles.menuText}>Privasi & Keamanan</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSubtitle} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={() => router.replace('/login')}
          >
            <Ionicons name="log-out-outline" size={22} color={Colors.primary} />
            <Text style={[styles.menuText, styles.logoutText]}>Keluar</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>
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
    padding: Spacing.xl,
    backgroundColor: Colors.white,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textMain,
    marginTop: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSubtitle,
    marginTop: 2,
  },
  menuContainer: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    backgroundColor: '#FAFAFA',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textMain,
    marginLeft: Spacing.md,
  },
  logoutItem: {
    borderColor: Colors.primaryLight,
    backgroundColor: '#FFF5F5',
  },
  logoutText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
