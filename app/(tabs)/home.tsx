// app/(tabs)/home.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  getManagedEventsForStudent,
  EventItem,
} from '../../services/panitia/events.service';
import {
  getAnnouncements,
  AnnouncementItem,
} from '../../services/panitia/announcements.service';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - Spacing.xl * 2;

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    return dateStr;
  }
}

function formatRelativeTime(isoStr: string): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      return `Hari ini, ${hours}:${mins}`;
    } else if (diffDays === 1) {
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      return `Kemarin, ${hours}:${mins}`;
    } else {
      return `${diffDays} Hari lalu`;
    }
  } catch {
    return isoStr;
  }
}

function getAnnouncementIcon(index: number): { name: any; bg: string; color: string } {
  const icons = [
    { name: 'megaphone', bg: '#FEE2E2', color: '#B81414' },
    { name: 'time', bg: '#FEF3C7', color: '#D97706' },
    { name: 'people', bg: '#D1FAE5', color: '#059669' },
    { name: 'information-circle', bg: '#E0E7FF', color: '#4F46E5' },
  ];
  return icons[index % icons.length];
}

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const studentName = user?.student?.name || user?.email?.split('@')[0] || 'Siswa';
  const classLabel = user?.student?.class
    ? `${user.student.class.grade} ${user.student.class.name}`
    : user?.role || 'Siswa';

  const [managedEvents, setManagedEvents] = useState<EventItem[]>([]);
  const [generalEvents, setGeneralEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isCommittee = managedEvents.length > 0;

  const loadData = useCallback(async () => {
    try {
      const [managedRes, eventsRes, annRes] = await Promise.allSettled([
        getManagedEventsForStudent(user?.student?.id, user?.id),
        api.get('/events?limit=5'),
        getAnnouncements(1, 4),
      ]);

      if (managedRes.status === 'fulfilled') {
        setManagedEvents(managedRes.value);
      }

      if (eventsRes.status === 'fulfilled') {
        const raw = eventsRes.value;
        const list = Array.isArray(raw) ? raw : (raw as any)?.data || [];
        setGeneralEvents(list);
      }

      if (annRes.status === 'fulfilled') {
        setAnnouncements(annRes.value.data);
      }
    } catch (err) {
      console.warn('Error fetching home data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.student?.id, user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  const managedEventNames = managedEvents.map((e) => e.name).join(', ');

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ─── CASE 1: SISWA IS A COMMITTEE MEMBER (DASHBOARD KOMITE EVENT - Screenshot 4) ─── */}
      {isCommittee ? (
        <>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerProfile}>
              {user?.student?.avatarUrl ? (
                <Image source={{ uri: user.student.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>{studentName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.headerTextCol}>
                <Text style={styles.headerBrand}>Moklet Event Center</Text>
                <Text style={styles.headerSub}>Dashboard Komite event</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.logoutBtn}
              activeOpacity={0.7}
              onPress={() => setShowLogoutModal(true)}
            >
              <Ionicons name="log-out-outline" size={22} color="#78909C" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
              />
            }
          >
            {loading ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : (
              <>
                {/* Welcome Card */}
                <View style={styles.welcomeCard}>
                  <Text style={styles.greeting}>Halo, {studentName}</Text>
                  <Text style={styles.subtitle}>
                    Selamat datang dan selamat bekerja. Kamu jadi anggota komite event [
                    {managedEventNames}].
                  </Text>
                </View>

                {/* Section: Event yang Dikelola */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Event yang Dikelola</Text>
                </View>

                {managedEvents.map((ev) => {
                  const isOngoing = ev.status === 'ONGOING';
                  return (
                    <View key={ev.id} style={styles.eventCard}>
                      <View style={styles.bannerWrapper}>
                        <Image
                          source={{
                            uri:
                              ev.bannerUrl ||
                              'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
                          }}
                          style={styles.eventBanner}
                        />
                        <View
                          style={[
                            styles.statusBadgeOverlay,
                            isOngoing ? styles.statusOngoing : styles.statusClosed,
                          ]}
                        >
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: isOngoing ? '#22C55E' : '#9E9E9E' },
                            ]}
                          />
                          <Text
                            style={[
                              styles.statusText,
                              { color: isOngoing ? '#166534' : '#424242' },
                            ]}
                          >
                            {isOngoing ? 'Sedang Berjalan' : 'Selesai'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.eventBody}>
                        <Text style={styles.eventName}>{ev.name}</Text>
                        <View style={styles.dateRow}>
                          <Ionicons name="calendar-outline" size={13} color="#757575" />
                          <Text style={styles.dateText}>{formatDate(ev.eventDate)}</Text>
                        </View>

                        <View style={styles.eventBottomRow}>
                          <View>
                            <Text style={styles.pendaftarLabel}>Total Pendaftar</Text>
                            <Text style={styles.pendaftarVal}>
                              {ev.totalRegistrations !== undefined && ev.totalRegistrations > 0
                                ? `${ev.totalRegistrations} Tim`
                                : `${ev.totalCategories || 0} Cabang Lomba`}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.kelolaBtn}
                            activeOpacity={0.85}
                            onPress={() =>
                              router.push({
                                pathname: '/(panitia)/events/[id]',
                                params: { id: ev.id },
                              } as any)
                            }
                          >
                            <Text style={styles.kelolaBtnText}>Kelola</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}

                {/* Section: Pengumuman Terbaru */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Pengumuman Terbaru</Text>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/info')}>
                    <Text style={styles.seeAllText}>Lihat Semua →</Text>
                  </TouchableOpacity>
                </View>

                {announcements.length > 0 ? (
                  announcements.map((ann, index) => {
                    const iconInfo = getAnnouncementIcon(index);
                    return (
                      <View key={ann.id} style={styles.announcementCard}>
                        <View style={[styles.annIconBox, { backgroundColor: iconInfo.bg }]}>
                          <Ionicons name={iconInfo.name} size={20} color={iconInfo.color} />
                        </View>
                        <View style={styles.annContent}>
                          <Text style={styles.annTitle} numberOfLines={1}>
                            {ann.title}
                          </Text>
                          <Text style={styles.annBody} numberOfLines={2}>
                            {ann.content}
                          </Text>
                          <Text style={styles.annTime}>{formatRelativeTime(ann.createdAt)}</Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyBoxSmall}>
                    <Text style={styles.emptySubtitle}>Belum ada pengumuman terbaru.</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </>
      ) : (
        /* ─── CASE 2: REGULAR SISWA (NOT A COMMITTEE MEMBER) ─── */
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        >
          {/* Top Profile Card Header */}
          <View style={styles.profileCard}>
            <View style={styles.avatarBorder}>
              <Image
                source={{
                  uri:
                    user?.student?.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
                }}
                style={styles.avatarImage}
              />
            </View>
            <View style={styles.profileTextContainer}>
              <Text style={styles.profileName} numberOfLines={1}>
                {studentName}
              </Text>
              <Text style={styles.profileSubtitle} numberOfLines={1}>
                {classLabel}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.logoutIconButton}
              activeOpacity={0.7}
              onPress={() => setShowLogoutModal(true)}
            >
              <Ionicons name="exit-outline" size={24} color="#3D2723" />
            </TouchableOpacity>
          </View>

          {/* Event Banner Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Event Terdekat</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/events')}>
              <Text style={styles.sectionLink}>Lihat Semua →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loaderText}>Memuat event...</Text>
            </View>
          ) : generalEvents.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={BANNER_WIDTH + Spacing.md}
              contentContainerStyle={styles.bannerContainer}
            >
              {generalEvents.map((banner) => (
                <TouchableOpacity
                  key={banner.id}
                  style={[styles.bannerCard, { width: BANNER_WIDTH }]}
                  activeOpacity={0.93}
                  onPress={() =>
                    router.push({ pathname: '/event-detail', params: { eventId: banner.id } })
                  }
                >
                  <Image
                    source={{
                      uri:
                        banner.bannerUrl ||
                        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
                    }}
                    style={styles.bannerImage}
                  />
                  <View style={styles.bannerOverlay} />
                  <View style={styles.bannerTag}>
                    <Text style={styles.bannerTagText}>{banner.status || 'EVENT'}</Text>
                  </View>
                  <View style={styles.bannerBottom}>
                    <Text style={styles.bannerTitle} numberOfLines={1}>
                      {banner.name}
                    </Text>
                    <View style={styles.bannerMeta}>
                      <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.85)" />
                      <Text style={styles.bannerMetaText}>{formatDate(banner.eventDate)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Belum ada event tersedia saat ini.</Text>
            </View>
          )}

          {/* Pengumuman Terbaru Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pengumuman Terbaru</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/info')}>
              <Text style={styles.sectionLink}>Lihat Semua →</Text>
            </TouchableOpacity>
          </View>

          {announcements.length > 0 ? (
            announcements.map((ann, idx) => (
              <View key={ann.id || idx} style={styles.newsCard}>
                <View style={styles.newsIconBox}>
                  <Ionicons name="megaphone" size={18} color="#B81414" />
                </View>
                <View style={styles.newsContent}>
                  <Text style={styles.newsTitle} numberOfLines={1}>
                    {ann.title}
                  </Text>
                  <Text style={styles.newsBody} numberOfLines={2}>
                    {ann.content}
                  </Text>
                  <Text style={styles.newsTime}>{formatRelativeTime(ann.createdAt)}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Belum ada pengumuman terbaru.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Logout Modal */}
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
              Apakah kamu yakin ingin keluar dari Moklet Event Center?
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
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  headerTextCol: {
    gap: 2,
  },
  headerBrand: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B81414',
  },
  headerSub: {
    fontSize: 12,
    color: '#757575',
  },
  logoutBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: Spacing.base,
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1E1E',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#757575',
    lineHeight: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B81414',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    marginBottom: Spacing.base,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bannerWrapper: {
    width: '100%',
    height: 150,
    position: 'relative',
  },
  eventBanner: {
    width: '100%',
    height: '100%',
  },
  statusBadgeOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusOngoing: {
    backgroundColor: 'rgba(220, 252, 231, 0.95)',
  },
  statusClosed: {
    backgroundColor: 'rgba(243, 244, 246, 0.95)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  eventBody: {
    padding: Spacing.base,
    gap: 4,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#757575',
  },
  eventBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  pendaftarLabel: {
    fontSize: 11,
    color: '#757575',
    fontWeight: '500',
  },
  pendaftarVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#B81414',
  },
  kelolaBtn: {
    backgroundColor: '#B81414',
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: Radius.lg,
  },
  kelolaBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  announcementCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    gap: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  annIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  annContent: {
    flex: 1,
    gap: 3,
  },
  annTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  annBody: {
    fontSize: 12,
    color: '#757575',
    lineHeight: 18,
  },
  annTime: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 2,
  },
  loaderBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyBoxSmall: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9E9E9E',
    textAlign: 'center',
  },

  // Regular Siswa Styles
  scrollContainer: { flex: 1 },
  scrollContent: { padding: Spacing.base, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    gap: Spacing.md,
    elevation: 1,
  },
  avatarBorder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  profileTextContainer: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '800', color: '#1E1E1E' },
  profileSubtitle: { fontSize: 12, color: '#757575', marginTop: 2 },
  logoutIconButton: { padding: 6 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionLink: { fontSize: 13, color: '#B81414', fontWeight: '700' },
  bannerContainer: { gap: Spacing.md, paddingVertical: 4 },
  bannerCard: {
    height: 180,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
  },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bannerTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#B81414',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  bannerTagText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  bannerBottom: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    gap: 4,
  },
  bannerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  bannerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bannerMetaText: { color: 'rgba(255,255,255,0.85)', fontSize: 11 },
  loaderContainer: { paddingVertical: 30, alignItems: 'center', gap: 8 },
  loaderText: { fontSize: 12, color: '#757575' },
  emptyContainer: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#9E9E9E' },
  newsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    alignItems: 'center',
  },
  newsIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsContent: { flex: 1, gap: 2 },
  newsTitle: { fontSize: 14, fontWeight: '700', color: '#1E1E1E' },
  newsBody: { fontSize: 12, color: '#757575', lineHeight: 17 },
  newsTime: { fontSize: 10, color: '#9E9E9E', marginTop: 2 },
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
