// app/event-detail.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/theme';
import api from '../services/api';
import { formatDate } from '../utils/date';

export interface EventDetail {
  id: string;
  name: string;
  description?: string;
  eventDate: string;
  status?: string;
  bannerUrl?: string;
  guidebookUrl?: string;
  categories?: any[];
  schedules?: any[];
  committee?: any[];
}

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEventDetail() {
      if (!eventId) {
        setErrorMsg('ID Event tidak ditemukan');
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMsg(null);
      try {
        const res: any = await api.get(`/events/${eventId}`);
        const eventData = res?.data || res;
        setEvent(eventData);
      } catch (err: any) {
        console.warn('Error fetching event detail:', err);
        setErrorMsg('Gagal memuat detail event dari server.');
      } finally {
        setLoading(false);
      }
    }

    fetchEventDetail();
  }, [eventId]);

  const handleDownloadGuidebook = () => {
    if (event?.guidebookUrl) {
      Linking.openURL(event.guidebookUrl).catch(() => {
        Alert.alert('Gagal', 'Tidak dapat membuka tautan guidebook.');
      });
    } else {
      Alert.alert('Informasi', 'Guidebook belum diunggah untuk event ini.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Event</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Memuat detail event...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg || !event) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Event</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorTextTitle}>Terjadi Kesalahan</Text>
          <Text style={styles.errorTextSub}>{errorMsg || 'Event tidak ditemukan'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryBtnText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isClosed = event.status === 'CLOSED';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Event</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* 1. Banner */}
        {event.bannerUrl ? (
          <Image
            source={event.bannerUrl}
            style={styles.banner}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <Ionicons name="image-outline" size={42} color={Colors.textSubtitle} />
            <Text style={styles.bannerPlaceholderText}>Banner tidak tersedia</Text>
          </View>
        )}

        {/* 2. Judul & Tanggal Event */}
        <View style={styles.titleCard}>
          <Text style={styles.eventTitle}>{event.name}</Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={15} color={Colors.textSubtitle} />
            <Text style={styles.dateText}>{formatDate(event.eventDate, { monthStyle: 'long' })}</Text>
          </View>
          {event.status ? (
            <View style={styles.tagsRow}>
              <View
                style={[
                  styles.tag,
                  { backgroundColor: isClosed ? '#FFEBEE' : '#E8F5E9' },
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    { color: isClosed ? Colors.primary : '#2E7D32' },
                  ]}
                >
                  {event.status}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* 3. Deskripsi Event */}
        {event.description ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tentang Event</Text>
            <Text style={styles.descText}>{event.description}</Text>
          </View>
        ) : null}

        {/* 4. Guidebook */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Guidebook</Text>
          <Text style={styles.guidebookDesc}>
            Pelajari peraturan dan panduan lengkap acara {event.name} sebelum mendaftar.
          </Text>
          <TouchableOpacity
            style={[styles.downloadBtn, !event.guidebookUrl && styles.downloadBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleDownloadGuidebook}
          >
            <Ionicons name="download-outline" size={20} color={Colors.white} />
            <Text style={styles.downloadBtnText}>
              {event.guidebookUrl ? 'Unduh Guidebook (PDF)' : 'Guidebook Belum Tersedia'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 5. Informasi Kategori / Cabang Lomba */}
        {event.categories && event.categories.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cabang Lomba ({event.categories.length})</Text>
            {event.categories.map((cat, i) => (
              <React.Fragment key={cat.id || i}>
                {i > 0 && <View style={styles.rowDivider} />}
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBox}>
                    <Ionicons name="trophy-outline" size={18} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoValue}>{cat.name}</Text>
                    <Text style={styles.infoLabel}>
                      Anggota: {cat.minMember} - {cat.maxMember} Orang ({cat.teamCompositionMode || 'FREE'})
                    </Text>
                  </View>
                </View>
              </React.Fragment>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={[styles.ctaBtn, isClosed && styles.ctaBtnDisabled]}
          activeOpacity={0.85}
          disabled={isClosed}
          onPress={() =>
            router.push({ pathname: '/daftar-lomba', params: { eventId: event.id } })
          }
        >
          <Text style={styles.ctaBtnText}>
            {isClosed ? 'Pendaftaran Ditutup' : 'Ajukan Pendaftaran'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    paddingTop: Platform.OS === 'android' ? 36 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F7',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSubtitle,
  },
  errorTextTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textMain,
  },
  errorTextSub: {
    fontSize: 14,
    color: Colors.textSubtitle,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  retryBtnText: {
    color: Colors.white,
    fontWeight: '700',
  },
  banner: {
    width: '100%',
    height: 220,
  },
  bannerPlaceholder: {
    width: '100%',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  bannerPlaceholderText: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.textSubtitle,
  },
  titleCard: {
    backgroundColor: Colors.white,
    margin: Spacing.base,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textMain,
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 14,
    color: Colors.textSubtitle,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.round,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: Spacing.md,
  },
  descText: {
    fontSize: 14,
    color: Colors.textMain,
    lineHeight: 22,
  },
  guidebookDesc: {
    fontSize: 13,
    color: Colors.textSubtitle,
    lineHeight: 19,
    marginBottom: Spacing.base,
  },
  downloadBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: Radius.round,
  },
  downloadBtnDisabled: {
    backgroundColor: '#9E9E9E',
  },
  downloadBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSubtitle,
    marginTop: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMain,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.base,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  ctaBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: Radius.round,
    alignItems: 'center',
  },
  ctaBtnDisabled: {
    backgroundColor: '#9E9E9E',
  },
  ctaBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
