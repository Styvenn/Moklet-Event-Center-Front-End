// app/(panitia)/events/[id]/index.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  Alert,
  RefreshControl,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Colors, Spacing, Radius } from "../../../../constants/theme";
import {
  getEventById,
  getCategoriesByEvent,
  getSchedulesByEvent,
  getCommittee,
  deleteCategory,
  deleteSchedule,
  removeCommitteeMember,
  addCommitteeMember,
  EventItem,
  CategoryItem,
  ScheduleItem,
  CommitteeMemberItem,
} from "../../../../services/panitia/events.service";
import { API_URL } from "../../../../services/api";
import { getStudents, StudentItem } from "../../../../services/admin/students.service";
import { formatDate } from "../../../../utils/date";
import { getCategoryIconStyled } from "../../../../utils/icons";

type ActiveTab = "info" | "jadwal" | "panitia" | "lomba";

function getInitials(name: string): string {
  const parts = (name || "").trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (name || "P").substring(0, 2).toUpperCase();
}

function getInitialColor(name: string): { bg: string; text: string } {
  const colors = [
    { bg: "#F59E0B", text: "#FFFFFF" }, // Amber / Gold
    { bg: "#059669", text: "#FFFFFF" }, // Emerald green
    { bg: "#2563EB", text: "#FFFFFF" }, // Blue
    { bg: "#7C3AED", text: "#FFFFFF" }, // Purple
    { bg: "#DB2777", text: "#FFFFFF" }, // Pink
    { bg: "#DC2626", text: "#FFFFFF" }, // Red
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
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

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAllData();
    }, [fetchAllData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  // Search students for Add Member Modal
  const handleSearchStudents = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setStudents([]);
      return;
    }
    setSearchingStudents(true);
    try {
      const res = await getStudents(1, 50);
      const filtered = res.data.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.nis.includes(query)
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
      Alert.alert("Berhasil", "Anggota komite berhasil ditambahkan.");
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
        text: "Keluarkan",
        style: "destructive",
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
            Alert.alert("Sukses", "Anggota berhasil dikeluarkan.");
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
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCategory(catId);
            setCategories((prev) => prev.filter((c) => c.id !== catId));
            Alert.alert("Sukses", "Cabang lomba berhasil dihapus.");
          } catch {
            Alert.alert("Error", "Gagal menghapus cabang lomba.");
          }
        },
      },
    ]);
  };

  const handleCategoryAction = (cat: CategoryItem) => {
    Alert.alert(
      cat.name,
      "Pilih tindakan untuk cabang lomba ini:",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Edit Cabang Lomba",
          onPress: () =>
            router.push({
              pathname: "/(panitia)/events/[id]/category-form",
              params: { eventId: event?.id, categoryId: cat.id },
            } as any),
        },
        {
          text: "Hapus Lomba",
          style: "destructive",
          onPress: () => handleDeleteCategory(cat.id, cat.name),
        },
      ]
    );
  };

  const handleDeleteSchedule = (schId: string, label: string) => {
    Alert.alert("Hapus Jadwal", `Hapus agenda "${label}"?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
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
      Alert.alert(
        "Export Data",
        `Buka browser ke URL ini untuk mengunduh Excel:\n${downloadUrl}`
      );
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Banner Section */}
        <View style={styles.bannerWrapper}>
          {event.bannerUrl ? (
            <Image
              source={event.bannerUrl}
              style={styles.bannerImg}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={150}
            />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Ionicons name="image-outline" size={36} color="#94A3B8" />
              <Text style={styles.bannerPlaceholderText}>Banner tidak tersedia</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.backFab}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Title & Date */}
        <View style={styles.titleSection}>
          <Text style={styles.eventTitle}>{event.name}</Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={15} color="#757575" />
            <Text style={styles.dateText}>{formatDate(event.eventDate)}</Text>
          </View>

          {/* Download Data Button */}
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={handleExportData}
            activeOpacity={0.85}
          >
            <Ionicons name="download-outline" size={18} color="#fff" />
            <Text style={styles.exportBtnText}>Download Seluruh Data Lomba</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs Bar */}
        <View style={styles.tabBar}>
          {(["info", "jadwal", "panitia", "lomba"] as ActiveTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const labels: Record<ActiveTab, string> = {
              info: "Info",
              jadwal: "Jadwal",
              panitia: "Panitia",
              lomba: "Lomba",
            };
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabItem, isActive ? styles.tabItemActive : null]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
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
          {/* TAB 1: INFO (Screenshot 5) */}
          {activeTab === "info" && (
            <View style={{ gap: Spacing.base }}>
              {/* Deskripsi Event Card */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                    <Ionicons name="document-text-outline" size={20} color="#B81414" />
                    <Text style={styles.cardTitle}>Deskripsi Event</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/(panitia)/events/[id]/edit",
                        params: { id: event.id },
                      } as any)
                    }
                  >
                    <Ionicons name="pencil-outline" size={18} color="#1E1E1E" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cardBodyText}>
                  {event.description || "Belum ada deskripsi untuk event ini."}
                </Text>
              </View>

              {/* Guidebook Peserta Card */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                    <View style={styles.pdfIconBadge}>
                      <Ionicons name="book" size={16} color="#B81414" />
                    </View>
                    <View>
                      <Text style={styles.cardTitle}>Guidebook Peserta</Text>
                      <Text style={styles.cardSubText}>
                        {event.guidebookUrl ? "PDF, Dokumen Panduan Lengkap" : "Belum diunggah"}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/(panitia)/events/[id]/edit",
                        params: { id: event.id },
                      } as any)
                    }
                  >
                    <Ionicons name="pencil-outline" size={18} color="#1E1E1E" />
                  </TouchableOpacity>
                </View>

                {event.guidebookUrl ? (
                  <TouchableOpacity
                    style={styles.guidebookBtn}
                    onPress={() => Linking.openURL(event.guidebookUrl!)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="open-outline" size={16} color="#B81414" />
                    <Text style={styles.guidebookText}>Lihat & Unduh PDF Guidebook</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Kontak Panitia Inti Card */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                    <Ionicons name="help-circle-outline" size={20} color="#B81414" />
                    <Text style={styles.cardTitle}>Kontak Panitia Inti</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/(panitia)/events/[id]/edit",
                        params: { id: event.id },
                      } as any)
                    }
                  >
                    <Ionicons name="pencil-outline" size={18} color="#1E1E1E" />
                  </TouchableOpacity>
                </View>

                {committee.length > 0 ? (
                  committee.slice(0, 3).map((c, i) => (
                    <View key={c.studentId || i} style={styles.contactRow}>
                      <View style={styles.contactIconCircle}>
                        <Ionicons name="person-outline" size={16} color="#B81414" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.contactName}>
                          {c.name} ({c.role})
                        </Text>
                        <Text style={styles.contactSub}>
                          {c.classLabel ? `${c.classLabel} • ` : ""}NIS: {c.nis || "-"}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.cardBodyText}>
                    Belum ada kontak panitia yang ditambahkan. Tambahkan di tab Panitia.
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* TAB 2: JADWAL */}
          {activeTab === "jadwal" && (
            <View style={{ gap: Spacing.md }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>
                  Daftar Kegiatan ({schedules.length})
                </Text>
                <TouchableOpacity
                  style={styles.addSmallBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/(panitia)/events/[id]/schedule-form",
                      params: { eventId: event.id },
                    } as any)
                  }
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
                          onPress={() =>
                            router.push({
                              pathname: "/(panitia)/events/[id]/schedule-form",
                              params: { eventId: event.id, scheduleId: sch.id },
                            } as any)
                          }
                        >
                          <Ionicons name="pencil-outline" size={18} color="#757575" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteSchedule(sch.id, sch.dayLabel)}
                        >
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

          {/* TAB 3: PANITIA (Screenshot 2) */}
          {activeTab === "panitia" && (
            <View style={{ gap: Spacing.md }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>
                  Daftar Panitia ({committee.length})
                </Text>
                <TouchableOpacity
                  style={styles.addSmallBtn}
                  onPress={() => {
                    setShowAddMemberModal(true);
                    setStudents([]);
                    setSearchQuery("");
                  }}
                >
                  <Ionicons name="person-add-outline" size={15} color="#fff" />
                  <Text style={styles.addSmallText}>Tambah Anggota</Text>
                </TouchableOpacity>
              </View>

              {committee.length > 0 ? (
                committee.map((mem) => {
                  const initials = getInitials(mem.name);
                  const colorScheme = getInitialColor(mem.name);

                  return (
                    <View key={mem.studentId} style={styles.memberCard}>
                      {mem.avatarUrl ? (
                        <Image source={mem.avatarUrl} style={styles.memberAvatarImg} cachePolicy="memory-disk" />
                      ) : (
                        <View
                          style={[
                            styles.memberAvatarCircle,
                            { backgroundColor: colorScheme.bg },
                          ]}
                        >
                          <Text style={[styles.avatarInitialsText, { color: colorScheme.text }]}>
                            {initials}
                          </Text>
                        </View>
                      )}

                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{mem.name}</Text>
                        <Text style={styles.memberSub}>
                          {mem.classLabel || (mem.nis && mem.nis !== "-" ? `NIS ${mem.nis}` : "Siswa Moklet")}
                        </Text>
                      </View>

                      <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>{mem.role || "Anggota"}</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleRemoveMember(mem.studentId, mem.name)}
                        style={{ paddingLeft: 4 }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyTabBox}>
                  <Ionicons name="people-outline" size={40} color="#BDBDBD" />
                  <Text style={styles.emptyText}>Belum ada anggota panitia ditambahkan.</Text>
                </View>
              )}
            </View>
          )}

          {/* TAB 4: LOMBA (Screenshot 1) */}
          {activeTab === "lomba" && (
            <View style={{ gap: Spacing.md }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>
                  Daftar Lomba ({categories.length})
                </Text>
                <TouchableOpacity
                  style={styles.addSmallBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/(panitia)/events/[id]/category-form",
                      params: { eventId: event.id },
                    } as any)
                  }
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.addSmallText}> Tambah Lomba</Text>
                </TouchableOpacity>
              </View>

              {categories.length > 0 ? (
                categories.map((cat) => {
                  const iconInfo = getCategoryIconStyled(cat.name);
                  const isIndividual = cat.maxMember === 1;
                  const typeLabel = isIndividual
                    ? "Individu"
                    : `Tim (${cat.maxMember} Orang)`;

                  const maxQuota = cat.maxTotalTeams || cat.maxTeamsPerGroup || 32;
                  const isFull = cat.totalRegistrations >= maxQuota && maxQuota > 0;
                  const unitLabel = isIndividual ? "Orang" : "Tim";

                  return (
                    <View key={cat.id} style={styles.categoryCard}>
                      <View style={styles.catTopRow}>
                        {/* Left Icon */}
                        <View style={[styles.catIconBox, { backgroundColor: iconInfo.bg }]}>
                          <Ionicons name={iconInfo.name} size={22} color={iconInfo.color} />
                        </View>

                        {/* Title & Tag */}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.catName}>{cat.name}</Text>
                          <View style={styles.catTypePill}>
                            <Text style={styles.catTypePillText}>{typeLabel}</Text>
                          </View>
                        </View>

                        {/* 3-dots Menu Button */}
                        <TouchableOpacity
                          onPress={() => handleCategoryAction(cat)}
                          style={{ padding: 4 }}
                        >
                          <Ionicons name="ellipsis-vertical" size={18} color="#757575" />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.catDivider} />

                      {/* Bottom Registration & Status */}
                      <View style={styles.catBottomRow}>
                        <View>
                          <Text style={styles.pendaftarSub}>Pendaftar</Text>
                          <Text style={styles.pendaftarTotal}>
                            {cat.totalRegistrations}/{maxQuota} {unitLabel}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.catStatusBadge,
                            isFull ? styles.catStatusFull : styles.catStatusOpen,
                          ]}
                        >
                          <Text
                            style={[
                              styles.catStatusText,
                              isFull ? styles.catStatusFullText : styles.catStatusOpenText,
                            ]}
                          >
                            {isFull ? "Penuh" : "Buka"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
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
      <Modal
        visible={showAddMemberModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={ms.overlay}>
          <View style={ms.sheet}>
            <View style={ms.handle} />
            <View style={ms.sheetHeader}>
              <Text style={ms.sheetTitle}>Tambah Anggota Komite</Text>
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
                  const classLabel = item.class ? `${item.class.grade} ${item.class.name}` : "";
                  return (
                    <View style={ms.studentRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={ms.studentName}>{item.name}</Text>
                        <Text style={ms.studentSub}>
                          {classLabel ? `${classLabel} • ` : ""}NIS: {item.nis || "-"}
                        </Text>
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
  safe: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    paddingTop: Platform.OS === "android" ? 36 : 0,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: 12,
  },
  errorTitle: { fontSize: 16, fontWeight: "700", color: "#424242" },
  errorSub: { fontSize: 13, color: "#9E9E9E", textAlign: "center" },
  retryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  bannerWrapper: { width: "100%", height: 180, position: "relative" },
  bannerImg: { width: "100%", height: "100%" },
  bannerPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
  },
  bannerPlaceholderText: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748B",
  },
  backFab: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleSection: {
    backgroundColor: "#fff",
    padding: Spacing.base,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  eventTitle: { fontSize: 22, fontWeight: "800", color: "#1E1E1E" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dateText: { fontSize: 13, color: "#757575" },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#B81414",
    borderRadius: Radius.lg,
    paddingVertical: 12,
    marginTop: 8,
  },
  exportBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: { borderBottomColor: "#B81414" },
  tabLabel: { fontSize: 13, fontWeight: "600", color: "#757575" },
  tabLabelActive: { color: "#B81414", fontWeight: "800" },
  tabContent: { padding: Spacing.base },
  card: {
    backgroundColor: "#fff",
    borderRadius: Radius.xl,
    padding: Spacing.base,
    gap: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1E1E1E" },
  cardSubText: { fontSize: 12, color: "#757575", marginTop: 1 },
  cardBodyText: { fontSize: 13, color: "#424242", lineHeight: 20 },
  pdfIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  guidebookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF5F5",
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  guidebookText: { fontSize: 13, color: "#B81414", fontWeight: "700" },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  contactIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  contactName: { fontSize: 13, fontWeight: "700", color: "#1E1E1E" },
  contactSub: { fontSize: 11, color: "#757575" },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionHeaderTitle: { fontSize: 16, fontWeight: "800", color: "#1E1E1E" },
  addSmallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#B81414",
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addSmallText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  scheduleCard: {
    backgroundColor: "#fff",
    borderRadius: Radius.xl,
    padding: Spacing.base,
    gap: 6,
    elevation: 1,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scheduleDay: { fontSize: 15, fontWeight: "700", color: "#1E1E1E" },
  scheduleMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  scheduleDate: { fontSize: 12, color: "#9E9E9E" },
  scheduleText: { fontSize: 13, color: "#424242", marginTop: 4 },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: Radius.xl,
    padding: Spacing.base,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  memberAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  memberAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitialsText: {
    fontSize: 16,
    fontWeight: "800",
  },
  memberInfo: { flex: 1, gap: 2 },
  memberName: { fontSize: 15, fontWeight: "700", color: "#1E1E1E" },
  memberSub: { fontSize: 12, color: "#757575" },
  roleBadge: {
    backgroundColor: "#F0F4F8",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.round,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: Radius.xl,
    padding: Spacing.base,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  catTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  catIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  catName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E1E1E",
    marginBottom: 4,
  },
  catTypePill: {
    alignSelf: "flex-start",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  catTypePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  catDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: Spacing.sm,
  },
  catBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pendaftarSub: {
    fontSize: 11,
    color: "#757575",
    fontWeight: "500",
  },
  pendaftarTotal: {
    fontSize: 15,
    fontWeight: "800",
    color: "#B81414",
    marginTop: 2,
  },
  catStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  catStatusOpen: {
    backgroundColor: "#ECFDF5",
  },
  catStatusFull: {
    backgroundColor: "#FEE2E2",
  },
  catStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  catStatusOpenText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  catStatusFullText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  emptyTabBox: { alignItems: "center", paddingVertical: 36, gap: 8 },
  emptyText: { fontSize: 13, color: "#9E9E9E" },
});

const ms = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.base,
    maxHeight: "80%",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sheetTitle: { fontSize: 17, fontWeight: "700", color: "#1E1E1E" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1E1E1E" },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  studentName: { fontSize: 14, fontWeight: "600", color: "#1E1E1E" },
  studentSub: { fontSize: 12, color: "#757575" },
  addMemberBtn: {
    backgroundColor: "#B81414",
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addedBtn: { backgroundColor: "#E8F5E9" },
  addMemberBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  addedText: { color: "#2E7D32" },
});
