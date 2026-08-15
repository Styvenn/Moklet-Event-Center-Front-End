// app/(panitia)/events/[id]/index.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, Platform, ScrollView,
  TouchableOpacity, ActivityIndicator, Image, Modal, TextInput,
  FlatList, Alert, RefreshControl, Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Colors, Spacing, Radius } from "../../../../constants/theme";
import {
  getEventById, getCategoriesByEvent, getSchedulesByEvent, getCommittee,
  deleteCategory, deleteSchedule, removeCommitteeMember, addCommitteeMember,
  EventItem, CategoryItem, ScheduleItem, CommitteeMemberItem,
} from "../../../../services/panitia/events.service";
import { API_URL } from "../../../../services/api";
import { getStudents, StudentItem } from "../../../../services/admin/students.service";

type ActiveTab = "info" | "jadwal" | "panitia" | "lomba";

function formatDate(d: string) {
  if (!d) return "-";
  try { return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = Array.isArray(id) ? id[0] : id;

  const [activeTab, setActiveTab] = useState<ActiveTab>("info");
  const [event, setEvent] = useState<EventItem | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [committee, setCommittee] = useState<CommitteeMemberItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Modal Tambah Panitia state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [addedStudentIds, setAddedStudentIds] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    if (!eventId) return;
    setError("");

    try {
      const [evRes, catRes, schRes, comRes] = await Promise.allSettled([
        getEventById(eventId),
        getCategoriesByEvent(eventId),
        getSchedulesByEvent(eventId),
        getCommittee(eventId),
      ]);

      if (evRes.status === "fulfilled") setEvent(evRes.value);
      else setError("Gagal memuat detail event.");

      if (catRes.status === "fulfilled") setCategories(catRes.value);
      if (schRes.status === "fulfilled") setSchedules(schRes.value);
      if (comRes.status === "fulfilled") {
        setCommittee(comRes.value);
        const existingIds = new Set(comRes.value.map((c) => c.studentId));
        setAddedStudentIds(existingIds);
      }
    } catch {
      setError("Gagal memuat data event.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId]);

  useFocusEffect(useCallback(() => { setLoading(true); fetchAllData(); }, [fetchAllData]));
  const onRefresh = () => { setRefreshing(true); fetchAllData(); };

  // Search students for Add Member Modal
  const handleSearchStudents = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { setStudents([]); return; }
    setSearchingStudents(true);
    try {
      const res = await getStudents(1, 50);
      const filtered = res.data.filter(
        (s) => s.name.toLowerCase().includes(query.toLowerCase()) || s.nis.includes(query)
      );
      setStudents(filtered);
    } catch {
      setStudents([]);
    } finally {
      setSearchingStudents(false);
    }
  };

  const handleAddMember = async (studentId: string) => {
    if (!eventId) return;
    setAddingId(studentId);
    try {
      await addCommitteeMember(eventId, studentId);
      setAddedStudentIds((prev) => new Set(prev).add(studentId));
      const updatedCom = await getCommittee(eventId);
      setCommittee(updatedCom);
    } catch (e: any) {
      Alert.alert("Gagal", e?.formattedMessage || "Gagal menambahkan panitia.");
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveMember = (studentId: string, name: string) => {
    Alert.alert("Konfirmasi", `Keluarkan ${name} dari kepanitiaan?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluarkan", style: "destructive",
        onPress: async () => {
          if (!eventId) return;
          try {
            await removeCommitteeMember(eventId, studentId);
            setCommittee((prev) => prev.filter((c) => c.studentId !== studentId));
            setAddedStudentIds((prev) => {
              const next = new Set(prev);
              next.delete(studentId);
              return next;
            });
          } catch {
            Alert.alert("Error", "Gagal mengeluarkan panitia.");
          }
        },
      },
    ]);
  };

  const handleDeleteCategory = (catId: string, name: string) => {
    Alert.alert("Hapus Lomba", `Apakah kamu yakin ingin menghapus lomba "${name}"?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus", style: "destructive",
        onPress: async () => {
          try {
            await deleteCategory(catId);
            setCategories((prev) => prev.filter((c) => c.id !== catId));
          } catch {
            Alert.alert("Error", "Gagal menghapus cabang lomba.");
          }
        },
      },
    ]);
  };

  const handleDeleteSchedule = (schId: string, label: string) => {
    Alert.alert("Hapus Jadwal", `Hapus agenda "${label}"?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus", style: "destructive",
        onPress: async () => {
          try {
            await deleteSchedule(schId);
            setSchedules((prev) => prev.filter((s) => s.id !== schId));
          } catch {
            Alert.alert("Error", "Gagal menghapus jadwal.");
          }
        },
      },
    ]);
  };

  const handleExportData = () => {
    if (!eventId) return;
    const downloadUrl = `${API_URL}/export/events/${eventId}`;
    Linking.openURL(downloadUrl).catch(() => {
      Alert.alert("Export", `Buka browser ke URL ini untuk mengunduh Excel:\n${downloadUrl}`);
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.primary} />
          <Text style={styles.errorTitle}>Detail Event Tidak Ditemukan</Text>
          <Text style={styles.errorSub}>{error || "Event tidak ada atau telah dihapus."}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* Banner Section */}
        <View style={styles.bannerWrapper}>
          {event.bannerUrl ? (
            <Image source={{ uri: event.bannerUrl }} style={styles.bannerImg} />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Ionicons name="image-outline" size={40} color="#BDBDBD" />
            </View>
          )}
          <TouchableOpacity style={styles.backFab} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editFab}
            onPress={() => router.push({ pathname: "/(panitia)/events/[id]/edit", params: { id: event.id } } as any)}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Title & Date */}
        <View style={styles.titleSection}>
          <Text style={styles.eventTitle}>{event.name}</Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color="#757575" />
            <Text style={styles.dateText}>{formatDate(event.eventDate)}</Text>
          </View>

          {/* Download Data Button */}
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportData} activeOpacity={0.85}>
            <Ionicons name="download-outline" size={18} color="#fff" />
            <Text style={styles.exportBtnText}>Download Seluruh Data Lomba</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs Bar */}
        <View style={styles.tabBar}>
          {(["info", "jadwal", "panitia", "lomba"] as ActiveTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const labels: Record<ActiveTab, string> = {
              info: "Info", jadwal: "Jadwal", panitia: "Panitia", lomba: "Lomba",
            };
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabItem, isActive ? styles.tabItemActive : null]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : null]}>
                  {labels[tab]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {/* TAB 1: INFO */}
          {activeTab === "info" && (
            <View style={{ gap: Spacing.base }}>
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
                  <Text style={styles.cardTitle}>Deskripsi Event</Text>
                </View>
                <Text style={styles.cardBodyText}>
                  {event.description || "Belum ada deskripsi untuk event ini."}
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="book-outline" size={20} color={Colors.primary} />
                  <Text style={styles.cardTitle}>Guidebook Peserta</Text>
                </View>
                {event.guidebookUrl ? (
                  <TouchableOpacity
                    style={styles.guidebookBtn}
                    onPress={() => Linking.openURL(event.guidebookUrl!)}
                  >
                    <Ionicons name="document-attach-outline" size={18} color={Colors.primary} />
                    <Text style={styles.guidebookText} numberOfLines={1}>Unduh PDF Guidebook</Text>
                    <Ionicons name="open-outline" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.cardBodyText}>Belum ada guidebook yang diunggah.</Text>
                )}
              </View>
            </View>
          )}

          {/* TAB 2: JADWAL */}
          {activeTab === "jadwal" && (
            <View style={{ gap: Spacing.md }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>Daftar Kegiatan ({schedules.length})</Text>
                <TouchableOpacity
                  style={styles.addSmallBtn}
                  onPress={() => router.push({ pathname: "/(panitia)/events/[id]/schedule-form", params: { eventId: event.id } } as any)}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.addSmallText}>Tambah Jadwal</Text>
                </TouchableOpacity>
              </View>

              {schedules.length > 0 ? (
                schedules.map((sch) => (
                  <View key={sch.id} style={styles.scheduleCard}>
                    <View style={styles.scheduleHeader}>
                      <Text style={styles.scheduleDay}>{sch.dayLabel}</Text>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => router.push({ pathname: "/(panitia)/events/[id]/schedule-form", params: { eventId: event.id, scheduleId: sch.id } } as any)}
                        >
                          <Ionicons name="pencil-outline" size={18} color="#757575" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteSchedule(sch.id, sch.dayLabel)}>
                          <Ionicons name="trash-outline" size={18} color={Colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.scheduleMeta}>
                      <Ionicons name="calendar-outline" size={13} color="#9E9E9E" />
                      <Text style={styles.scheduleDate}>{formatDate(sch.date)}</Text>
                    </View>
                    <Text style={styles.scheduleText}>{sch.dresscodeText}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyTabBox}>
                  <Ionicons name="calendar-outline" size={40} color="#BDBDBD" />
                  <Text style={styles.emptyText}>Belum ada jadwal kegiatan.</Text>
                </View>
              )}
            </View>
          )}

          {/* TAB 3: PANITIA */}
          {activeTab === "panitia" && (
            <View style={{ gap: Spacing.md }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>Daftar Panitia ({committee.length})</Text>
                <TouchableOpacity
                  style={styles.addSmallBtn}
                  onPress={() => { setShowAddMemberModal(true); setStudents([]); setSearchQuery(""); }}
                >
                  <Ionicons name="person-add-outline" size={16} color="#fff" />
                  <Text style={styles.addSmallText}>Tambah Anggota</Text>
                </TouchableOpacity>
              </View>

              {committee.length > 0 ? (
                committee.map((mem) => (
                  <View key={mem.studentId} style={styles.memberCard}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.avatarInitial}>{mem.name.charAt(0).toUpperCase() || "P"}</Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{mem.name}</Text>
                      <Text style={styles.memberSub}>
                        {mem.classLabel ? `${mem.classLabel} • ` : ""}{mem.role}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveMember(mem.studentId, mem.name)}>
                      <Ionicons name="trash-outline" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyTabBox}>
                  <Ionicons name="people-outline" size={40} color="#BDBDBD" />
                  <Text style={styles.emptyText}>Belum ada anggota panitia ditambahkan.</Text>
                </View>
              )}
            </View>
          )}

          {/* TAB 4: LOMBA */}
          {activeTab === "lomba" && (
            <View style={{ gap: Spacing.md }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>Daftar Lomba ({categories.length})</Text>
                <TouchableOpacity
                  style={styles.addSmallBtn}
                  onPress={() => router.push({ pathname: "/(panitia)/events/[id]/category-form", params: { eventId: event.id } } as any)}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.addSmallText}>Tambah Lomba</Text>
                </TouchableOpacity>
              </View>

              {categories.length > 0 ? (
                categories.map((cat) => (
                  <View key={cat.id} style={styles.categoryCard}>
                    <View style={styles.catTopRow}>
                      <Text style={styles.catName}>{cat.name}</Text>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => router.push({ pathname: "/(panitia)/events/[id]/category-form", params: { eventId: event.id, categoryId: cat.id } } as any)}
                        >
                          <Ionicons name="pencil-outline" size={18} color="#757575" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteCategory(cat.id, cat.name)}>
                          <Ionicons name="trash-outline" size={18} color={Colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.catBadgesRow}>
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>
                          {cat.maxMember > 1 ? `Tim (${cat.minMember}-${cat.maxMember} orang)` : "Individu"}
                        </Text>
                      </View>
                      <View style={[styles.catBadge, { backgroundColor: "#E3F2FD" }]}>
                        <Text style={[styles.catBadgeText, { color: "#1565C0" }]}>Mode: {cat.teamCompositionMode}</Text>
                      </View>
                    </View>

                    <View style={styles.catCountRow}>
                      <Text style={styles.catCountLabel}>Pendaftar: </Text>
                      <Text style={styles.catCountVal}>{cat.totalRegistrations} pendaftar</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyTabBox}>
                  <Ionicons name="trophy-outline" size={40} color="#BDBDBD" />
                  <Text style={styles.emptyText}>Belum ada cabang lomba dibuat.</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal Tambah Anggota Panitia */}
      <Modal visible={showAddMemberModal} animationType="slide" transparent onRequestClose={() => setShowAddMemberModal(false)}>
        <View style={ms.overlay}>
          <View style={ms.sheet}>
            <View style={ms.handle} />
            <View style={ms.sheetHeader}>
              <Text style={ms.sheetTitle}>Tambah Anggota Panitia</Text>
              <TouchableOpacity onPress={() => setShowAddMemberModal(false)}>
                <Ionicons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>

            <View style={ms.searchBox}>
              <Ionicons name="search" size={18} color="#9E9E9E" />
              <TextInput
                style={ms.searchInput}
                placeholder="Cari nama atau NIS siswa..."
                placeholderTextColor="#9E9E9E"
                value={searchQuery}
                onChangeText={handleSearchStudents}
              />
            </View>

            {searchingStudents ? (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : (
              <FlatList
                data={students}
                keyExtractor={(s) => s.id}
                style={{ maxHeight: 300, marginTop: 8 }}
                renderItem={({ item }) => {
                  const isAdded = addedStudentIds.has(item.id);
                  const isPending = addingId === item.id;
                  return (
                    <View style={ms.studentRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={ms.studentName}>{item.name}</Text>
                        <Text style={ms.studentSub}>{item.nis ? `NIS: ${item.nis}` : "NIS -"}</Text>
                      </View>
                      <TouchableOpacity
                        style={[ms.addMemberBtn, isAdded ? ms.addedBtn : null]}
                        onPress={() => handleAddMember(item.id)}
                        disabled={isAdded || isPending}
                      >
                        {isPending ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={[ms.addMemberBtnText, isAdded ? ms.addedText : null]}>
                            {isAdded ? "Ditambahkan" : "Tambahkan"}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <View style={{ paddingVertical: 24, alignItems: "center" }}>
                    <Text style={{ fontSize: 13, color: "#9E9E9E" }}>
                      {searchQuery ? "Siswa tidak ditemukan." : "Ketik nama siswa untuk mencari."}
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FA", paddingTop: Platform.OS === "android" ? 36 : 0 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl, gap: 12 },
  errorTitle: { fontSize: 16, fontWeight: "700", color: "#424242" },
  errorSub: { fontSize: 13, color: "#9E9E9E", textAlign: "center" },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: 24, paddingVertical: 10 },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  bannerWrapper: { width: "100%", height: 180, position: "relative" },
  bannerImg: { width: "100%", height: "100%" },
  bannerPlaceholder: { width: "100%", height: "100%", backgroundColor: "#E0E0E0", alignItems: "center", justifyContent: "center" },
  backFab: {
    position: "absolute", top: 12, left: 12, width: 36, height: 36,
    borderRadius: 18, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center",
  },
  editFab: {
    position: "absolute", top: 12, right: 12, width: 36, height: 36,
    borderRadius: 18, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center",
  },
  titleSection: { backgroundColor: "#fff", padding: Spacing.base, gap: 6, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  eventTitle: { fontSize: 20, fontWeight: "800", color: "#1E1E1E" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dateText: { fontSize: 13, color: "#757575" },
  exportBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 12, marginTop: 8,
  },
  exportBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  tabBar: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E0E0E0" },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabItemActive: { borderBottomColor: Colors.primary },
  tabLabel: { fontSize: 13, fontWeight: "600", color: "#757575" },
  tabLabelActive: { color: Colors.primary, fontWeight: "700" },
  tabContent: { padding: Spacing.base },
  card: { backgroundColor: "#fff", borderRadius: Radius.xl, padding: Spacing.base, gap: 8, elevation: 1 },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1E1E1E" },
  cardBodyText: { fontSize: 13, color: "#424242", lineHeight: 20 },
  guidebookBtn: {
    flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.primaryLight,
    padding: Spacing.md, borderRadius: Radius.lg,
  },
  guidebookText: { flex: 1, fontSize: 13, color: Colors.primary, fontWeight: "600" },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: "700", color: "#1E1E1E" },
  addSmallBtn: {
    flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.primary,
    borderRadius: Radius.lg, paddingHorizontal: 12, paddingVertical: 6,
  },
  addSmallText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  scheduleCard: { backgroundColor: "#fff", borderRadius: Radius.xl, padding: Spacing.base, gap: 6, elevation: 1 },
  scheduleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scheduleDay: { fontSize: 15, fontWeight: "700", color: "#1E1E1E" },
  scheduleMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  scheduleDate: { fontSize: 12, color: "#9E9E9E" },
  scheduleText: { fontSize: 13, color: "#424242", marginTop: 4 },
  memberCard: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff",
    borderRadius: Radius.xl, padding: Spacing.md, elevation: 1,
  },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  avatarInitial: { fontSize: 16, fontWeight: "700", color: Colors.primary },
  memberInfo: { flex: 1, gap: 2 },
  memberName: { fontSize: 14, fontWeight: "700", color: "#1E1E1E" },
  memberSub: { fontSize: 12, color: "#757575" },
  categoryCard: { backgroundColor: "#fff", borderRadius: Radius.xl, padding: Spacing.base, gap: 10, elevation: 1 },
  catTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  catName: { fontSize: 16, fontWeight: "700", color: "#1E1E1E" },
  catBadgesRow: { flexDirection: "row", gap: 8 },
  catBadge: { backgroundColor: "#FFEBEE", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  catBadgeText: { fontSize: 11, fontWeight: "700", color: Colors.primary },
  catCountRow: { flexDirection: "row", alignItems: "center" },
  catCountLabel: { fontSize: 12, color: "#757575" },
  catCountVal: { fontSize: 13, fontWeight: "700", color: "#1E1E1E" },
  emptyTabBox: { alignItems: "center", paddingVertical: 36, gap: 8 },
  emptyText: { fontSize: 13, color: "#9E9E9E" },
});

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.base, maxHeight: "80%" },
  handle: { width: 40, height: 4, backgroundColor: "#E0E0E0", borderRadius: 2, alignSelf: "center", marginBottom: Spacing.md },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  sheetTitle: { fontSize: 17, fontWeight: "700", color: "#1E1E1E" },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F5F5F5",
    borderRadius: Radius.lg, paddingHorizontal: Spacing.md, height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1E1E1E" },
  studentRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#F5F5F5",
  },
  studentName: { fontSize: 14, fontWeight: "600", color: "#1E1E1E" },
  studentSub: { fontSize: 12, color: "#757575" },
  addMemberBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 6 },
  addedBtn: { backgroundColor: "#E8F5E9" },
  addMemberBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  addedText: { color: "#2E7D32" },
});
