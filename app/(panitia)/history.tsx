// app/(panitia)/history.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { Colors, Spacing, Radius } from "../../constants/theme";
import { getEvents, EventItem } from "../../services/panitia/events.service";

function formatDate(d: string) {
  if (!d) return "-";
  try { return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}

export default function HistoryEventsScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const all = await getEvents(1, 100);
      // Filter event lampau (CLOSED atau tanggal < hari ini)
      const nowStr = new Date().toISOString().split("T")[0];
      const closedList = all.filter((e) => e.status === "CLOSED" || (e.eventDate && e.eventDate < nowStr));
      setEvents(closedList);
    } catch {
      setError("Gagal memuat riwayat event. Tarik untuk mencoba ulang.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));
  const onRefresh = () => { setRefreshing(true); load(); };

  const renderItem = ({ item }: { item: EventItem }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: "/(panitia)/events/[id]", params: { id: item.id } } as any)}
    >
      {item.bannerUrl ? (
        <Image source={{ uri: item.bannerUrl }} style={styles.banner} />
      ) : (
        <View style={styles.bannerPlaceholder}>
          <Ionicons name="image-outline" size={32} color="#BDBDBD" />
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="calendar-outline" size={13} color="#9E9E9E" />
          <Text style={styles.cardDate}>{formatDate(item.eventDate)}</Text>
        </View>
      </View>
      <View style={styles.closedBadge}>
        <Text style={styles.closedText}>Selesai</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Event</Text>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#BDBDBD" />
          <Text style={styles.errorTitle}>Gagal Memuat</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); load(); }}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="time-outline" size={52} color="#BDBDBD" />
              <Text style={styles.emptyTitle}>Belum ada riwayat event</Text>
              <Text style={styles.emptySub}>Event yang telah ditutup atau lampau akan muncul di sini.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FA", paddingTop: Platform.OS === "android" ? 36 : 0 },
  header: {
    backgroundColor: "#fff", paddingHorizontal: Spacing.base, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1E1E1E" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl, gap: 12 },
  errorTitle: { fontSize: 16, fontWeight: "700", color: "#424242" },
  errorSub: { fontSize: 13, color: "#9E9E9E", textAlign: "center" },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: 24, paddingVertical: 10 },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#424242" },
  emptySub: { fontSize: 13, color: "#9E9E9E", textAlign: "center", paddingHorizontal: 24 },
  list: { padding: Spacing.base, paddingBottom: 32, gap: Spacing.sm },
  card: {
    backgroundColor: "#fff", borderRadius: Radius.xl,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    overflow: "hidden",
  },
  banner: { width: "100%", height: 130 },
  bannerPlaceholder: { width: "100%", height: 90, backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" },
  cardBody: { padding: Spacing.base, gap: 4 },
  cardName: { fontSize: 15, fontWeight: "700", color: "#1E1E1E" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardDate: { fontSize: 12, color: "#9E9E9E" },
  closedBadge: {
    position: "absolute", top: 10, right: 10, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#EFEBE9",
  },
  closedText: { fontSize: 11, fontWeight: "700", color: "#6D4C41" },
});
