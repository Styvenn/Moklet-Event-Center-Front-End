// app/(panitia)/dashboard.tsx
import React, { useState } from "react";
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
import { router } from "expo-router";
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, Radius } from "../../constants/theme";
import { cacheTime, queryKeys } from '../../constants/query';
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/PageHeader";
import { getEvents, EventItem } from "../../services/panitia/events.service";
import { getPanitia } from "../../services/admin/panitia.service";

export default function PanitiaDashboardScreen() {
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: queryKeys.panitiaDashboard,
    staleTime: cacheTime.warm,
    queryFn: async () => {
      const [eventsRes, panitiaRes] = await Promise.allSettled([
        getEvents(1, 100),
        getPanitia(),
      ]);

      const events = eventsRes.status === 'fulfilled' ? eventsRes.value : [];
      const panitiaList = panitiaRes.status === 'fulfilled' ? panitiaRes.value : [];
      const panitiaCount =
        panitiaList.filter((p) => p.isActive).length || panitiaList.length;

      return { events, panitiaCount };
    },
  });

  const events = data?.events || [];
  const panitiaCount = data?.panitiaCount || 0;
  const loadError = error ? 'Gagal memuat data operasional.' : '';

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  const ongoingCount = events.filter((e) => e.status === "ONGOING").length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <PageHeader onLogout={() => setShowLogoutModal(true)} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
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

        {isLoading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : loadError ? (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.errorText}>{loadError}</Text>
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
