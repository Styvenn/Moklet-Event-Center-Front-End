// app/(panitia)/dashboard.tsx
import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, Platform, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl, Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "expo-router";
import { Colors, Spacing, Radius } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { getEvents, EventItem } from "../../services/panitia/events.service";

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch { return dateStr; }
}

function StatusBadge({ status }: { status: string }) {
  const isOngoing = status === "ONGOING";
  return (
    <View style={[sb.badge, isOngoing ? sb.ongoing : sb.closed]}>
      <Text style={[sb.text, isOngoing ? sb.ongoingText : sb.closedText]}>
        {isOngoing ? "Berlangsung" : "Selesai"}
      </Text>
    </View>
  );
}

const sb = StyleSheet.create({
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  ongoing: { backgroundColor: "#E8F5E9" }, closed: { backgroundColor: "#EFEBE9" },
  text: { fontSize: 11, fontWeight: "700" },
  ongoingText: { color: "#2E7D32" }, closedText: { color: "#6D4C41" },
});

export default function PanitiaDashboardScreen() {
  const { user, logout } = useAuth();
  const displayName = user?.student?.name || user?.email?.split("@")[0] || "Panitia";

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const all = await getEvents(1, 50);
      setEvents(all);
    } catch {
      setError("Gagal memuat data. Tarik untuk mencoba ulang.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));
  const onRefresh = () => { setRefreshing(true); load(); };

  const totalLomba = 0; // akan diisi setelah fetch detail per event (tidak di-batch dulu)
  const ongoingCount = events.filter((e) => e.status === "ONGOING").length;
  const recentEvents = events.slice(0, 3);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.headerTitle}>MEC Panitia</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#78909C" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        <Text style={styles.greeting}>Halo, {displayName} 👋</Text>
        <Text style={styles.subtitle}>Berikut ringkasan aktivitas event kamu.</Text>

        {loading ? (
          <View style={styles.loaderBox}><ActivityIndicator size="large" color={Colors.primary} /></View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: "#FFEBEE" }]}>
                  <Ionicons name="calendar" size={22} color={Colors.primary} />
                </View>
                <Text style={styles.statValue}>{events.length}</Text>
                <Text style={styles.statLabel}>Total Event</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: "#E8F5E9" }]}>
                  <Ionicons name="play-circle" size={22} color="#2E7D32" />
                </View>
                <Text style={styles.statValue}>{ongoingCount}</Text>
                <Text style={styles.statLabel}>Berlangsung</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: "#E3F2FD" }]}>
                  <Ionicons name="checkmark-circle" size={22} color="#1565C0" />
                </View>
                <Text style={styles.statValue}>{events.length - ongoingCount}</Text>
                <Text style={styles.statLabel}>Selesai</Text>
              </View>
            </View>

            {/* Quick actions */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Aksi Cepat</Text>
            </View>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(panitia)/events/create" as any)}>
              <View style={[styles.actionIcon, { backgroundColor: "#FFEBEE" }]}>
                <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>Buat Event Baru</Text>
              <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(panitia)/announcements" as any)}>
              <View style={[styles.actionIcon, { backgroundColor: "#FFF8E1" }]}>
                <Ionicons name="megaphone-outline" size={22} color="#F57F17" />
              </View>
              <Text style={styles.actionText}>Kelola Pengumuman</Text>
              <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />
            </TouchableOpacity>

            {/* Recent events */}
            {recentEvents.length > 0 && (
              <>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>Event Terbaru</Text>
                  <TouchableOpacity onPress={() => router.push("/(panitia)/events" as any)}>
                    <Text style={styles.seeAll}>Lihat semua</Text>
                  </TouchableOpacity>
                </View>
                {recentEvents.map((ev) => (
                  <TouchableOpacity
                    key={ev.id}
                    style={styles.eventCard}
                    activeOpacity={0.85}
                    onPress={() => router.push({ pathname: "/(panitia)/events/[id]", params: { id: ev.id } } as any)}
                  >
                    {ev.bannerUrl ? (
                      <Image source={{ uri: ev.bannerUrl }} style={styles.eventBanner} />
                    ) : (
                      <View style={styles.eventBannerPlaceholder}>
                        <Ionicons name="image-outline" size={28} color="#BDBDBD" />
                      </View>
                    )}
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventName} numberOfLines={1}>{ev.name}</Text>
                      <View style={styles.eventMeta}>
                        <Ionicons name="calendar-outline" size={12} color="#9E9E9E" />
                        <Text style={styles.eventDate}>{formatDate(ev.eventDate)}</Text>
                      </View>
                    </View>
                    <StatusBadge status={ev.status} />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {events.length === 0 && (
              <View style={styles.emptyBox}>
                <Ionicons name="calendar-outline" size={52} color="#BDBDBD" />
                <Text style={styles.emptyTitle}>Belum ada event</Text>
                <Text style={styles.emptySubtitle}>Mulai buat event baru untuk mengelola lomba dan panitia.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FA", paddingTop: Platform.OS === "android" ? 36 : 0 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fff", paddingHorizontal: Spacing.base, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  avatarCircle: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  avatarInitial: { fontSize: 16, fontWeight: "800", color: Colors.primary },
  headerTitle: { fontSize: 16, fontWeight: "800", color: Colors.primary },
  logoutBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  scroll: { padding: Spacing.base, paddingBottom: 32 },
  greeting: { fontSize: 22, fontWeight: "800", color: "#1E1E1E", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#757575", marginBottom: Spacing.base },
  loaderBox: { paddingVertical: 60, alignItems: "center" },
  errorBox: {
    flexDirection: "row", gap: 8, backgroundColor: "#FFEBEE", borderRadius: Radius.lg,
    padding: Spacing.md, marginTop: Spacing.md, alignItems: "center",
  },
  errorText: { flex: 1, fontSize: 13, color: Colors.primary },
  statsRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.base },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: Radius.xl, padding: Spacing.md,
    alignItems: "center", gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 24, fontWeight: "800", color: "#1E1E1E" },
  statLabel: { fontSize: 11, color: "#757575", fontWeight: "500", textAlign: "center" },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm, marginTop: Spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E1E1E" },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: "600" },
  actionCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: Radius.xl,
    padding: Spacing.base, marginBottom: Spacing.sm, gap: Spacing.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  actionText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1E1E1E" },
  eventCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: Radius.xl,
    padding: Spacing.sm, marginBottom: Spacing.sm, gap: Spacing.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  eventBanner: { width: 60, height: 60, borderRadius: Radius.lg },
  eventBannerPlaceholder: {
    width: 60, height: 60, borderRadius: Radius.lg, backgroundColor: "#F5F5F5",
    alignItems: "center", justifyContent: "center",
  },
  eventInfo: { flex: 1, gap: 4 },
  eventName: { fontSize: 14, fontWeight: "700", color: "#1E1E1E" },
  eventMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  eventDate: { fontSize: 12, color: "#9E9E9E" },
  emptyBox: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#424242" },
  emptySubtitle: { fontSize: 13, color: "#9E9E9E", textAlign: "center", paddingHorizontal: 32 },
});
