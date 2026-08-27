// app/(tabs)/history.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, Radius } from '../../constants/theme';
import {
  getRegistrationHistory,
  RegistrationHistoryItem,
} from '../../services/registration.service';

function getCategoryIcon(name: string): any {
  const lower = (name || '').toLowerCase();
  if (lower.includes('futsal') || lower.includes('bola') || lower.includes('football')) return 'football-outline';
  if (lower.includes('basket')) return 'basketball-outline';
  if (lower.includes('esport') || lower.includes('e-sport') || lower.includes('game') || lower.includes('mobile')) return 'game-controller-outline';
  if (lower.includes('tari') || lower.includes('musik') || lower.includes('seni') || lower.includes('band')) return 'musical-notes-outline';
  if (lower.includes('robot') || lower.includes('it') || lower.includes('koding') || lower.includes('web')) return 'hardware-chip-outline';
  if (lower.includes('voli')) return 'fitness-outline';
  if (lower.includes('lari') || lower.includes('atletik')) return 'walk-outline';
  if (lower.includes('badminton') || lower.includes('bulutangkis')) return 'tennisball-outline';
  return 'trophy-outline';
}

export default function HistoryScreen() {
  const [historyList, setHistoryList] = useState<RegistrationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      const data = await getRegistrationHistory();
      setHistoryList(data);
    } catch (err: any) {
      console.warn('Error loading registration history:', err);
      setErrorMsg(err?.formattedMessage || 'Gagal memuat riwayat pendaftaran. Tarik ke bawah untuk mencoba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleCardPress = (item: RegistrationHistoryItem) => {
    if (item.teamId) {
      router.push({ pathname: '/room-tim', params: { teamId: item.teamId } });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Pendaftaran</Text>
        <Text style={styles.headerSub}>Semua pendaftaran event Anda</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchHistory(true)}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Error Banner */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Memuat riwayat pendaftaran...</Text>
          </View>
        ) : historyList.length > 0 ? (
          historyList.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              activeOpacity={item.teamId ? 0.75 : 1}
              onPress={() => handleCardPress(item)}
            >
              {/* Top row: event + badge */}
              <View style={styles.cardTop}>
                <View style={[styles.iconBox, { backgroundColor: item.statusBg }]}>
                  <Ionicons
                    name={getCategoryIcon(item.categoryName)}
                    size={20}
                    color={item.statusColor}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventName}>{item.eventName}</Text>
                  <Text style={styles.branchName}>{item.categoryName}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: item.statusBg }]}>
                  <Text style={[styles.badgeText, { color: item.statusColor }]}>
                    {item.statusLabel}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Bottom row: date + team */}
              <View style={styles.cardBottom}>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={13} color={Colors.textSubtitle} />
                  <Text style={styles.metaText}>{item.dateFormatted}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons
                    name={item.isIndividual ? 'person-outline' : 'people-outline'}
                    size={13}
                    color={Colors.textSubtitle}
                  />
                  <Text style={styles.metaText}>{item.teamName}</Text>
                </View>
                {item.teamId ? (
                  <View style={[styles.metaRow, { marginLeft: 'auto' }]}>
                    <Text style={styles.viewRoomText}>Lihat Tim</Text>
                    <Ionicons name="chevron-forward" size={12} color={Colors.primary} />
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="receipt-outline" size={48} color={Colors.textPlaceholder} />
            </View>
            <Text style={styles.emptyTitle}>Belum Ada Riwayat Pendaftaran</Text>
            <Text style={styles.emptySubtitle}>
              Pendaftaran event yang kamu ikuti akan muncul di sini.
            </Text>
          </View>
        )}

        {/* Empty padding bottom */}
        <View style={{ height: 16 }} />
      </ScrollView>
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
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 13,
    color: Colors.textSubtitle,
    textAlign: 'center',
    marginTop: 2,
  },
  list: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textMain,
  },
  branchName: {
    fontSize: 13,
    color: Colors.textSubtitle,
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.round,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: Spacing.md,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSubtitle,
  },
  viewRoomText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSubtitle,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorText: {
    flex: 1,
    color: Colors.error,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSubtitle,
    textAlign: 'center',
    lineHeight: 19,
  },
});
