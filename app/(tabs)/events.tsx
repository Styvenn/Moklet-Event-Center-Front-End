// app/(tabs)/events.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatDate } from '../../utils/date';
import {
  getManagedEventsForStudent,
  EventItem,
} from '../../services/panitia/events.service';

export default function EventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [managedEventIds, setManagedEventIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const [allRes, managedRes] = await Promise.allSettled([
        api.get('/events'),
        getManagedEventsForStudent(user?.student?.id, user?.id),
      ]);

      if (allRes.status === 'fulfilled') {
        const raw = allRes.value;
        const list = Array.isArray(raw) ? raw : (raw as any)?.data || [];
        setEvents(list);
      }

      if (managedRes.status === 'fulfilled') {
        const ids = new Set(managedRes.value.map((e) => e.id));
        setManagedEventIds(ids);
      }
    } catch (err) {
      console.warn('Error fetching events:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.student?.id, user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchEvents();
    }, [fetchEvents])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const filtered = events.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(search.toLowerCase()))
  );

  const renderEvent = ({ item }: { item: EventItem }) => {
    const isManaged = managedEventIds.has(item.id) || user?.role === 'PANITIA';
    const isOngoing = item.status === 'ONGOING';

    return (
      <View style={styles.card}>
        <View style={styles.bannerWrapper}>
          {item.bannerUrl ? (
            <Image
              source={item.bannerUrl}
              style={styles.banner}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={150}
            />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Ionicons name="image-outline" size={32} color="#94A3B8" />
              <Text style={styles.bannerPlaceholderText}>Banner tidak tersedia</Text>
            </View>
          )}
          {isOngoing && (
            <View style={styles.baruBadge}>
              <Text style={styles.baruBadgeText}>Baru</Text>
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.cardMeta}>
            <Ionicons name="calendar-outline" size={13} color="#757575" />
            <Text style={styles.cardDate}>{formatDate(item.eventDate)}</Text>
          </View>
          <View style={styles.cardActionRow}>
            {isManaged ? (
              <TouchableOpacity
                style={styles.kelolaBtn}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/(panitia)/events/[id]', params: { id: item.id } } as any)}
              >
                <Text style={styles.kelolaBtnText}>Kelola</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.detailBtn}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/event-detail', params: { eventId: item.id } })}
              >
                <Text style={styles.detailBtnText}>Lihat Detail</Text>
                <Ionicons name="chevron-forward" size={16} color="#B81414" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header (Screenshot 3) */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Semua Event</Text>
      </View>

      {/* Search Bar (Screenshot 3) */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#9E9E9E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari event..."
            placeholderTextColor="#9E9E9E"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9E9E9E" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.base }} />}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={(
            <View style={styles.centerBox}>
              <Ionicons name="calendar-outline" size={48} color="#BDBDBD" />
              <Text style={styles.emptyTitle}>{search ? 'Event tidak ditemukan' : 'Belum ada event'}</Text>
              <Text style={styles.emptySub}>
                {search ? 'Coba gunakan kata kunci pencarian lain.' : 'Event yang akan datang akan muncul di sini.'}
              </Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        />
      )}
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#B81414',
  },
  searchRow: {
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E1E1E',
  },
  list: {
    padding: Spacing.base,
    paddingBottom: 32,
    gap: Spacing.base,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  bannerWrapper: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  bannerPlaceholderText: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748B',
  },
  baruBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(220, 252, 231, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.round,
  },
  baruBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  cardBody: {
    padding: Spacing.base,
    gap: 6,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 13,
    color: '#757575',
  },
  cardActionRow: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  kelolaBtn: {
    backgroundColor: '#B81414',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: Radius.lg,
  },
  kelolaBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  detailBtnText: {
    color: '#B81414',
    fontWeight: '700',
    fontSize: 13,
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#424242',
  },
  emptySub: {
    fontSize: 13,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});
