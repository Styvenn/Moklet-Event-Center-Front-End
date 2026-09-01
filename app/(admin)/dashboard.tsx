// app/(admin)/dashboard.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { cacheTime, queryKeys } from '../../constants/query';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import { getStudents } from '../../services/admin/students.service';
import { getPanitia } from '../../services/admin/panitia.service';
import api from '../../services/api';

interface DashboardStats {
  totalSiswa: number | null;
  panitiaAktif: number | null;
  eventBerjalan: number | null;
}

export default function AdminDashboardScreen() {
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Warm cache: ringkasan stats tampil instan saat admin bolak-balik halaman.
  const { data: stats, isLoading, isRefetching, refetch } = useQuery<DashboardStats>({
    queryKey: queryKeys.adminStats,
    staleTime: cacheTime.warm,
    queryFn: async () => {
      // Total Siswa: gunakan limit=100 agar meta.total akurat
      // (limit=1 bisa sebabkan backend return total=1 jika tidak ada proper pagination meta)
      const studentsRes = await getStudents(1, 100);
      const totalSiswa = studentsRes.meta.total;

      // Panitia Aktif: hitung yang isActive === true.
      // Jika endpoint belum siap (404), panitiaAktif tetap null → tampilkan "—"
      let panitiaAktif: number | null = null;
      try {
        const panitiaList = await getPanitia();
        panitiaAktif = panitiaList.filter((p) => p.isActive).length;
      } catch (e: any) {
        const status = e?.response?.status || e?.status;
        if (status !== 404) {
          console.warn('Error fetching panitia stats:', e);
        }
      }

      // Event Berjalan: hitung yang ONGOING
      let eventBerjalan = 0;
      try {
        const evRes: any = await api.get('/events?limit=100');
        const evList: any[] = Array.isArray(evRes) ? evRes : evRes?.data || [];
        eventBerjalan = evList.filter((e: any) => e.status === 'ONGOING').length;
      } catch { /* ignore event fetch error */ }

      return {
        totalSiswa,
        panitiaAktif,
        eventBerjalan,
      };
    },
  });

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <PageHeader onLogout={() => setShowLogoutModal(true)} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} />
        }
      >
        {/* Page Title */}
        <View style={styles.pageTitleSection}>
          <Text style={styles.pageTitle}>Dashboard Admin</Text>
          <Text style={styles.pageSubtitle}>Ringkasan data operasional hari ini.</Text>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            {/* Kartu Total Siswa — Full Width */}
            <View style={styles.statCardFull}>
              <View>
                <Text style={styles.statLabel}>Total Siswa</Text>
                <Text style={styles.statValueLarge}>
                  {stats?.totalSiswa != null
                    ? stats.totalSiswa.toLocaleString('id-ID')
                    : '—'}
                </Text>
              </View>
              <View style={styles.statIconBadge}>
                <Ionicons name="school-outline" size={28} color={Colors.primary} />
              </View>
            </View>

            {/* Row: Panitia Aktif + Event Berjalan */}
            <View style={styles.statRow}>
              {/* Panitia Aktif */}
              <View style={[styles.statCardHalf, { marginRight: 8 }]}>
                <View style={[styles.statIconBadgeSmall, { backgroundColor: '#FFF8E1' }]}>
                  <Ionicons name="id-card-outline" size={22} color="#F57F17" />
                </View>
                <Text style={styles.statLabelSmall}>Panitia Aktif</Text>
                <Text style={styles.statValueMid}>
                  {stats?.panitiaAktif != null ? stats.panitiaAktif : '—'}
                </Text>
              </View>

              {/* Event Berjalan */}
              <View style={[styles.statCardHalf, { marginLeft: 8 }]}>
                <View style={[styles.statIconBadgeSmall, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="calendar-outline" size={22} color="#2E7D32" />
                </View>
                <Text style={styles.statLabelSmall}>Event Berjalan</Text>
                <Text style={styles.statValueMid}>
                  {stats?.eventBerjalan != null ? stats.eventBerjalan : '—'}
                </Text>
              </View>
            </View>

            {/* Aksi Cepat */}
            <Text style={styles.sectionTitle}>Aksi Cepat</Text>

            <TouchableOpacity
              style={styles.quickActionCard}
              activeOpacity={0.85}
              onPress={() => router.push('/(admin)/siswa')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="people-outline" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.quickActionText}>Kelola Data Siswa</Text>
              <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              activeOpacity={0.85}
              onPress={() => router.push('/(admin)/panitia')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFF8E1' }]}>
                <Ionicons name="person-add-outline" size={22} color="#F57F17" />
              </View>
              <Text style={styles.quickActionText}>Kelola Panitia</Text>
              <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowLogoutModal(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={32} color={Colors.primary} />
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
    backgroundColor: '#F5F7FA',
    paddingTop: Platform.OS === 'android' ? 36 : 0,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 32,
  },
  pageTitleSection: {
    marginBottom: Spacing.base,
    marginTop: Spacing.sm,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  // Full-width stat card (Total Siswa)
  statCardFull: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#757575',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValueLarge: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  statIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Half-width stat cards
  statRow: {
    flexDirection: 'row',
    marginBottom: Spacing.base,
  },
  statCardHalf: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconBadgeSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabelSmall: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
    marginBottom: 2,
  },
  statValueMid: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  // Section title
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E1E1E',
    marginBottom: Spacing.md,
  },
  // Quick action cards
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    gap: Spacing.md,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E1E1E',
  },
  // Modal styles
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
    backgroundColor: Colors.primary,
  },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
