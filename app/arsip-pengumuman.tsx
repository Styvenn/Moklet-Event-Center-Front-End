// app/arsip-pengumuman.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/theme';
import api from '../services/api';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  eventId?: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function ArsipPengumumanScreen() {
  const [search, setSearch] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        setLoading(true);
        setError(false);
        const res: any = await api.get('/announcements');
        const list: Announcement[] = Array.isArray(res) ? res : res?.data || [];
        setAnnouncements(list);
      } catch (err) {
        console.warn('Error fetching announcements:', err);
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
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textMain} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Arsip Pengumuman</Text>
          <Text style={styles.headerSub}>Cari dan temukan pengumuman sebelumnya.</Text>
        </View>
        <View style={{ width: 40 }} />
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
              <View style={styles.annContent}>
                <View style={styles.annTopRow}>
                  <Text style={styles.annTitle} numberOfLines={2}>{ann.title}</Text>
                </View>
                <Text style={styles.annDesc} numberOfLines={2}>{ann.content}</Text>
                <View style={styles.annFooter}>
                  <Ionicons name="calendar-outline" size={11} color={Colors.textSubtitle} />
                  <Text style={styles.annDate}>{formatDate(ann.createdAt)}</Text>
                </View>
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
    backgroundColor: '#F5F5F7',
    paddingTop: Platform.OS === 'android' ? 36 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
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
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.textSubtitle,
    marginTop: 1,
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
    backgroundColor: '#F5F5F7',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
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
    padding: Spacing.base,
    gap: Spacing.md,
  },
  annCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  annContent: {
    flex: 1,
  },
  annTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 5,
  },
  annTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMain,
    lineHeight: 20,
  },
  annDesc: {
    fontSize: 12,
    color: Colors.textSubtitle,
    lineHeight: 17,
    marginBottom: 8,
  },
  annFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  annDate: {
    fontSize: 11,
    color: Colors.textSubtitle,
    fontWeight: '500',
  },
});
