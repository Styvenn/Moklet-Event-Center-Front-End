// app/(admin)/dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { getStudents } from '../../services/admin/students.service';
import { getPanitia } from '../../services/admin/panitia.service';
import api from '../../services/api';

interface DashboardStats {
  totalSiswa: number | null;
  panitiaAktif: number | null;
  eventBerjalan: number | null;
}

export default function AdminDashboardScreen() {
  const { user, logout } = useAuth();
  const adminName = user?.student?.name || user?.email?.split('@')[0] || 'Admin';

  const [stats, setStats] = useState<DashboardStats>({
    totalSiswa: null,
    panitiaAktif: null,
    eventBerjalan: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      // Total Siswa: ambil meta.total dari GET /students?limit=1
      const studentsRes = await getStudents(1, 1);
      const totalSiswa = studentsRes.meta.total;

      // Panitia Aktif: fetch semua panitia, hitung yang isActive === true
      let panitiaAktif = 0;
      try {
        const panitiaList = await getPanitia();
        panitiaAktif = panitiaList.filter((p) => p.isActive).length;
      } catch (e) {
        console.warn('Error fetching panitia stats:', e);
      }

      // Event Berjalan: fetch semua event, hitung yang ONGOING
      let eventBerjalan = 0;
      try {
        const evRes: any = await api.get('/events?limit=100');
        const evList: any[] = Array.isArray(evRes) ? evRes : evRes?.data || [];
        eventBerjalan = evList.filter((e: any) => e.status === 'ONGOING').length;
      } catch { /* ignore event fetch error */ }

      setStats({
        totalSiswa,
        panitiaAktif,
        eventBerjalan,
      });
    } catch (err) {
      console.warn('Error fetching admin dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarBorder}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitial}>
                {adminName.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.headerTitle}>Moklet Event Center</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Page Title */}
        <View style={styles.pageTitleSection}>
          <Text style={styles.pageTitle}>Dashboard Admin</Text>
          <Text style={styles.pageSubtitle}>Ringkasan data operasional hari ini.</Text>
        </View>

        {loading ? (
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
                  {stats.totalSiswa !== null
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
                  {stats.panitiaAktif !== null ? stats.panitiaAktif : '—'}
                </Text>
              </View>

              {/* Event Berjalan */}
              <View style={[styles.statCardHalf, { marginLeft: 8 }]}>
                <View style={[styles.statIconBadgeSmall, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="calendar-outline" size={22} color="#2E7D32" />
                </View>
                <Text style={styles.statLabelSmall}>Event Berjalan</Text>
                <Text style={styles.statValueMid}>
                  {stats.eventBerjalan !== null ? stats.eventBerjalan : '—'}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: Platform.OS === 'android' ? 36 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: { width: 44, alignItems: 'flex-start' },
  avatarBorder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
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
    backgroundColor: Colors.primaryLight,
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
  statPendingNote: {
    fontSize: 10,
    color: '#9E9E9E',
    marginTop: 2,
    fontStyle: 'italic',
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
});
