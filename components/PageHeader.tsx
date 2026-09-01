// components/PageHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  SISWA: 'Siswa',
  PANITIA: 'Panitia',
  ADMIN_KESISWAAN: 'Admin Kesiswaan',
};

interface PageHeaderProps {
  onLogout?: () => void;
}

export default function PageHeader({ onLogout }: PageHeaderProps) {
  const { user, logout } = useAuth();

  const name = user?.student?.name || user?.email?.split('@')[0] || 'Pengguna';
  const avatarUrl = user?.student?.avatarUrl;

  const classLabel = user?.student?.class
    ? `${user.student.class.grade} ${user.student.class.name}`
    : null;
  const subtitle = classLabel || ROLE_LABELS[user?.role || ''] || user?.role || '';

  const handleLogout = onLogout || (() => logout());

  return (
    <View style={styles.card}>
      {avatarUrl ? (
        <Image source={avatarUrl} style={styles.avatar} cachePolicy="memory-disk" />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.textCol}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </View>
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="exit-outline" size={24} color="#3D2723" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    marginBottom: Spacing.base,
    gap: Spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  subtitle: {
    fontSize: 12,
    color: '#757575',
  },
  logoutBtn: {
    padding: 6,
  },
});
