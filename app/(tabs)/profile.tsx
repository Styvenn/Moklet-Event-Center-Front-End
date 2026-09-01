// app/(tabs)/profile.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { uploadStudentAvatar } from '../../services/admin/students.service';
import { getErrorMessage } from '../../services/api';

export default function ProfileScreen() {
  const { user, refreshMe, logout } = useAuth();
  const username = user?.student?.name || user?.email?.split('@')[0] || 'Siswa';
  const schoolLabel = 'Siswa SMK Telkom Malang';
  const avatarUrl = user?.student?.avatarUrl;
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  const handlePickAndUploadAvatar = async () => {
    try {
      const ImagePicker = require('expo-image-picker');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Izin Ditolak', 'Izin akses galeri diperlukan untuk memilih foto profil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploading(true);
        const fileName = asset.fileName || 'avatar.jpg';
        const mimeType = asset.mimeType || 'image/jpeg';
        await uploadStudentAvatar(asset.uri, fileName, mimeType);
        await refreshMe();
        Alert.alert('Sukses', 'Foto profil berhasil diperbarui.');
      }
    } catch (e: any) {
      Alert.alert('Gagal Upload', getErrorMessage(e, 'Gagal mengunggah foto profil.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Center Avatar & Info (Image 2) */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={handlePickAndUploadAvatar}
            disabled={uploading}
            activeOpacity={0.8}
          >
            {avatarUrl ? (
              <Image source={avatarUrl} style={styles.avatarImg} cachePolicy="memory-disk" />
            ) : (
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={54} color="#FFFFFF" />
              </View>
            )}
            <View style={styles.cameraBadge}>
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>{username}</Text>
          <Text style={styles.profileSubtitle}>{schoolLabel}</Text>
        </View>

        {/* 3 Menu Cards (Image 2) */}
        <View style={styles.menuList}>
          {/* 1. Edit Profile */}
          <TouchableOpacity
            style={styles.menuCard}
            activeOpacity={0.85}
            onPress={() => router.push('/complete-profile' as any)}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="person-outline" size={22} color="#1E1E1E" />
              <Text style={styles.menuLabel}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748B" />
          </TouchableOpacity>

          {/* 2. Ganti Password */}
          <TouchableOpacity
            style={styles.menuCard}
            activeOpacity={0.85}
            onPress={() => router.push('/login' as any)}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="lock-closed-outline" size={22} color="#1E1E1E" />
              <Text style={styles.menuLabel}>Ganti password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748B" />
          </TouchableOpacity>

          {/* 3. Keluar */}
          <TouchableOpacity
            style={styles.logoutCard}
            activeOpacity={0.85}
            onPress={() => setShowLogoutModal(true)}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="log-out-outline" size={22} color="#B81414" />
              <Text style={styles.logoutLabel}>Keluar</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#B81414" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowLogoutModal(false)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={32} color="#B81414" />
            </View>
            <Text style={styles.modalTitle}>Keluar Akun</Text>
            <Text style={styles.modalDesc}>
              Apakah kamu yakin ingin keluar dari aplikasi Moklet Event Center?
            </Text>
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleLogout}>
                <Text style={styles.modalConfirmText}>Ya, Keluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 36 : 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 48,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImg: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#B81414',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  menuList: {
    gap: 14,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    paddingVertical: 18,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF5F5',
    borderRadius: Radius.xl,
    paddingVertical: 18,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  logoutLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#B81414',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: 12,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E1E1E' },
  modalDesc: { fontSize: 13, color: '#757575', textAlign: 'center' },
  modalActionRow: { flexDirection: 'row', gap: Spacing.md, width: '100%', marginTop: 8 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Radius.lg,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Radius.lg,
    backgroundColor: '#B81414',
  },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
