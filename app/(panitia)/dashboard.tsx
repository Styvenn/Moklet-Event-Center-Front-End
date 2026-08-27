// app/(panitia)/dashboard.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { Colors, Spacing, Radius } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { getEvents, EventItem } from "../../services/panitia/events.service";
import { getPanitia } from "../../services/admin/panitia.service";

export default function PanitiaDashboardScreen() {
  const { user, logout } = useAuth();
  const username =
    user?.student?.name || user?.email?.split("@")[0] || "Panitia";
  const avatarUrl = user?.student?.avatarUrl;

  const [events, setEvents] = useState<EventItem[]>([]);
  const [panitiaCount, setPanitiaCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const loadData = useCallback(async () => {
    setError("");
    try {
      const [eventsRes, panitiaRes] = await Promise.allSettled([
        getEvents(1, 100),
        getPanitia(),
      ]);

      if (eventsRes.status === "fulfilled") {
        setEvents(eventsRes.value);
      }
      if (panitiaRes.status === "fulfilled") {
        const activeList = panitiaRes.value.filter((p) => p.isActive);
        setPanitiaCount(activeList.length || panitiaRes.value.length);
      }
    } catch {
      setError("Gagal memuat data operasional.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  const ongoingCount = events.filter((e) => e.status === "ONGOING").length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {avatarUrl ? (
            <Image source={avatarUrl} style={styles.avatarImg} cachePolicy="memory-disk" />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.greetLabel}>Selamat datang,</Text>
            <Text style={styles.greetName} numberOfLines={1}>
              {username}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={22} color={Colors.primary} />
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
        {/* Page Title */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Dashboard Panitia</Text>
          <Text style={styles.subTitle}>
            Ringkasan data operasional event hari ini.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              {/* Total Event */}
              <View style={[styles.statCard, { flex: 1 }]}>
                <View
                  style={[
                    styles.statIconWrap,
                    { backgroundColor: "#FEE2E2" },
                  ]}
                >
                  <Ionicons name="calendar" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.statVal}>{events.length}</Text>
                <Text style={styles.statLabel}>Total Event</Text>
              </View>

              {/* Event Berjalan */}
              <View style={[styles.statCard, { flex: 1 }]}>
                <View
                  style={[
                    styles.statIconWrap,
                    { backgroundColor: "#DCFCE7" },
                  ]}
                >
                  <Ionicons
                    name="play-circle"
                    size={20}
                    color="#16A34A"
                  />
                </View>
                <Text style={styles.statVal}>{ongoingCount}</Text>
                <Text style={styles.statLabel}>Berjalan</Text>
              </View>

              {/* Panitia Aktif */}
              <View style={[styles.statCard, { flex: 1 }]}>
                <View
                  style={[
                    styles.statIconWrap,
                    { backgroundColor: "#FEF3C7" },
                  ]}
                >
                  <Ionicons name="people" size={20} color="#D97706" />
                </View>
                <Text style={styles.statVal}>{panitiaCount}</Text>
                <Text style={styles.statLabel}>Panitia Aktif</Text>
              </View>
            </View>

            {/* Aksi Cepat */}
            <Text style={styles.sectionTitle}>Aksi Cepat</Text>

            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.85}
              onPress={() => router.push("/(panitia)/events" as any)}
            >
              <View
                style={[
                  styles.actionIconCircle,
                  { backgroundColor: "#FEE2E2" },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={22}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Kelola Event</Text>
                <Text style={styles.actionSub}>
                  Buat, edit, dan kelola event lomba
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.85}
              onPress={() => router.push("/(panitia)/announcements" as any)}
            >
              <View
                style={[
                  styles.actionIconCircle,
                  { backgroundColor: "#FEF3C7" },
                ]}
              >
                <Ionicons
                  name="megaphone-outline"
                  size={22}
                  color="#D97706"
                />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Kelola Pengumuman</Text>
                <Text style={styles.actionSub}>
                  Publikasikan informasi kepada peserta
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { marginBottom: 0 }]}
              activeOpacity={0.85}
              onPress={() => router.push("/(panitia)/events/create" as any)}
            >
              <View
                style={[
                  styles.actionIconCircle,
                  { backgroundColor: "#DCFCE7" },
                ]}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color="#16A34A"
                />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Buat Event Baru</Text>
                <Text style={styles.actionSub}>
                  Tambahkan event kompetisi baru
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowLogoutModal(false)}
        >
          <View
            style={styles.modalCard}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Keluar Akun</Text>
            <Text style={styles.modalDesc}>
              Apakah kamu yakin ingin keluar dari aplikasi Moklet Event Center?
            </Text>
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleLogout}
              >
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
  safe: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    paddingTop: Platform.OS === "android" ? 36 : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  greetLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  greetName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    maxWidth: 200,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    padding: Spacing.base,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: Spacing.base,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  subTitle: {
    fontSize: 12,
    color: "#64748B",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: Spacing.base,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 6,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statVal: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
    marginTop: 4,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 14,
  },
  actionIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 12,
    color: "#64748B",
  },
  loaderBox: {
    paddingVertical: 60,
    alignItems: "center",
  },
  errorBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FFEBEE",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    alignItems: "center",
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primary,
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    gap: 12,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1E1E1E" },
  modalDesc: {
    fontSize: 13,
    color: "#757575",
    textAlign: "center",
  },
  modalActionRow: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: Radius.lg,
    backgroundColor: "#F1F5F9",
  },
  modalCancelText: { fontSize: 14, fontWeight: "700", color: "#475569" },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
  },
  modalConfirmText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
