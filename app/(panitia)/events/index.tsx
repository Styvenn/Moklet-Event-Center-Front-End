// app/(panitia)/events/index.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { Colors, Spacing, Radius } from "../../../constants/theme";
import { getEvents, EventItem } from "../../../services/panitia/events.service";

function formatDate(d: string) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export default function EventsListScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await getEvents(1, 50);
      setEvents(data);
    } catch {
      setError("Gagal memuat event. Tarik untuk mencoba ulang.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const filteredEvents = events.filter((ev) =>
    ev.name.toLowerCase().includes(search.toLowerCase()) ||
    (ev.description && ev.description.toLowerCase().includes(search.toLowerCase()))
  );

  const renderItem = ({ item }: { item: EventItem }) => {
    const isOngoing = item.status === "ONGOING";
    return (
      <View style={styles.card}>
        {/* Banner with Badge */}
        <View style={styles.bannerWrapper}>
          <Image
            source={{
              uri:
                item.bannerUrl ||
                "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
            }}
            style={styles.banner}
          />
          {isOngoing && (
            <View style={styles.baruBadge}>
              <Text style={styles.baruBadgeText}>Baru</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.cardMeta}>
            <Ionicons name="calendar-outline" size={13} color="#757575" />
            <Text style={styles.cardDate}>{formatDate(item.eventDate)}</Text>
          </View>

          <View style={styles.cardActionRow}>
            <TouchableOpacity
              style={styles.kelolaBtn}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/(panitia)/events/[id]",
                  params: { id: item.id },
                } as any)
              }
            >
              <Text style={styles.kelolaBtnText}>Kelola</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#1E1E1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Semua Event</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/(panitia)/events/create" as any)}
        >
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#9E9E9E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari event..."
            placeholderTextColor="#9E9E9E"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
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
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="calendar-outline" size={52} color="#BDBDBD" />
              <Text style={styles.emptyTitle}>
                {search ? "Event tidak ditemukan" : "Belum ada event"}
              </Text>
              <Text style={styles.emptySub}>
                {search
                  ? "Coba kata kunci pencarian lain."
                  : 'Ketuk tombol "+" di atas untuk membuat event baru.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    paddingTop: Platform.OS === "android" ? 36 : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#B81414",
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#B81414",
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrapper: {
    backgroundColor: "#fff",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1E1E1E",
  },
  list: {
    padding: Spacing.base,
    paddingBottom: 32,
    gap: Spacing.base,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: Radius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  bannerWrapper: {
    width: "100%",
    height: 160,
    position: "relative",
  },
  banner: {
    width: "100%",
    height: "100%",
  },
  baruBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(220, 252, 231, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.round,
  },
  baruBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#166534",
  },
  cardBody: {
    padding: Spacing.base,
    gap: 6,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E1E1E",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 13,
    color: "#757575",
  },
  cardActionRow: {
    alignItems: "flex-end",
    marginTop: 2,
  },
  kelolaBtn: {
    backgroundColor: "#B81414",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: Radius.lg,
  },
  kelolaBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#424242",
  },
  errorSub: {
    fontSize: 13,
    color: "#9E9E9E",
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#424242",
  },
  emptySub: {
    fontSize: 13,
    color: "#9E9E9E",
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
