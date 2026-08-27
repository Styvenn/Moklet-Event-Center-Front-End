// app/(tabs)/info.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../constants/theme';
import api from '../../services/api';
import { formatDate } from '../../utils/date';
import { AnnouncementItem } from '../../services/panitia/announcements.service';

export default function InfoScreen() {
  const [search, setSearch] = useState('');
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        setLoading(true);
        setError(false);
        const res: any = await api.get('/announcements');
        const list: AnnouncementItem[] = Array.isArray(res) ? res : res?.data || [];
        setAnnouncements(list);
      } catch (err) {
        console.warn('Error fetching announcements in Info:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncements();
  }, []);

  const filtered = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Arsip Pengumuman</Text>
        <Text style={styles.headerSub}>Cari dan temukan pengumuman penting sebelumnya.</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.textPlaceholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari pengumuman..."
            placeholderTextColor={Colors.textPlaceholder}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.stateText}>Memuat pengumuman...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Ionicons name="wifi-outline" size={40} color={Colors.textSubtitle} />
          <Text style={styles.stateText}>Gagal memuat pengumuman.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item: ann }) => (
            <TouchableOpacity style={styles.annCard} activeOpacity={0.85}>
              <View style={styles.annHeaderRow}>
                <Text style={styles.annTitle} numberOfLines={2}>{ann.title}</Text>
              </View>
              <Text style={styles.annDesc} numberOfLines={3}>{ann.content}</Text>
              <View style={styles.annFooter}>
                <Ionicons name="calendar-outline" size={13} color={Colors.textSubtitle} />
                <Text style={styles.annDate}>{formatDate(ann.createdAt, { dayStyle: '2-digit' })}</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={(
            <View style={styles.centerState}>
              <Ionicons name="megaphone-outline" size={40} color={Colors.textSubtitle} />
              <Text style={styles.stateText}>Tidak ada pengumuman ditemukan.</Text>
            </View>
          )}
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.textSubtitle,
    marginTop: 2,
  },
  searchRow: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 46,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textMain,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  stateText: {
    fontSize: 14,
    color: Colors.textSubtitle,
    textAlign: 'center',
  },
  list: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  annCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  annHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  annTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textMain,
    lineHeight: 21,
  },
  annDesc: {
    fontSize: 13,
    color: Colors.textSubtitle,
    lineHeight: 19,
    marginBottom: 12,
  },
  annFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  annDate: {
    fontSize: 12,
    color: Colors.textSubtitle,
    fontWeight: '500',
  },
});
