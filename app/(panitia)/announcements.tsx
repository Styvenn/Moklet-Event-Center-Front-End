// app/(panitia)/announcements.tsx
import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, Platform, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, Alert, ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { Colors, Spacing, Radius } from "../../constants/theme";
import {
  getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  AnnouncementItem,
} from "../../services/panitia/announcements.service";
import { formatDate } from "../../utils/date";
import { getEvents, EventItem } from "../../services/panitia/events.service";

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const loadData = useCallback(async () => {
    setError("");
    try {
      const [annRes, evRes] = await Promise.allSettled([
        getAnnouncements(1, 50),
        getEvents(1, 50),
      ]);

      if (annRes.status === "fulfilled") {
        setAnnouncements(annRes.value.data);
      } else {
        setError("Gagal memuat pengumuman. Tarik untuk mencoba lagi.");
      }

      if (evRes.status === "fulfilled") {
        setEvents(evRes.value);
      }
    } catch {
      setError("Gagal memuat data pengumuman.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); loadData(); }, [loadData]));
  const onRefresh = () => { setRefreshing(true); loadData(); };

  const openCreateModal = () => {
    setEditId(null);
    setTitle("");
    setContent("");
    setSelectedEventId("");
    setModalError("");
    setShowModal(true);
  };

  const openEditModal = (item: AnnouncementItem) => {
    setEditId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setSelectedEventId(item.eventId || "");
    setModalError("");
    setShowModal(true);
  };

  const handleDelete = (id: string, itemTitle: string) => {
    Alert.alert("Hapus Pengumuman", `Apakah kamu yakin ingin menghapus "${itemTitle}"?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus", style: "destructive",
        onPress: async () => {
          try {
            await deleteAnnouncement(id);
            setAnnouncements((prev) => prev.filter((a) => a.id !== id));
          } catch (e: any) {
            Alert.alert("Gagal", e?.formattedMessage || "Gagal menghapus pengumuman.");
          }
        },
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setModalError("Judul pengumuman wajib diisi."); return; }
    if (!content.trim()) { setModalError("Isi pengumuman wajib diisi."); return; }

    setSubmitting(true);
    setModalError("");

    try {
      if (editId) {
        await updateAnnouncement(editId, { title: title.trim(), content: content.trim() });
      } else {
        await createAnnouncement({
          title: title.trim(),
          content: content.trim(),
          eventId: selectedEventId ? selectedEventId : undefined,
        });
      }
      setShowModal(false);
      loadData();
    } catch (e: any) {
      setModalError(e?.formattedMessage || e?.message || "Gagal menyimpan pengumuman.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: AnnouncementItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMeta}>
            Oleh {item.authorName} • {formatDate(item.createdAt, { showTime: true })}
          </Text>
        </View>
        <View style={styles.actionBtns}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
            <Ionicons name="pencil-outline" size={18} color="#757575" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id, item.title)} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {item.eventName ? (
        <View style={styles.eventBadge}>
          <Ionicons name="calendar-outline" size={12} color={Colors.primary} />
          <Text style={styles.eventBadgeText}>{item.eventName}</Text>
        </View>
      ) : (
        <View style={[styles.eventBadge, { backgroundColor: "#E3F2FD" }]}>
          <Ionicons name="globe-outline" size={12} color="#1565C0" />
          <Text style={[styles.eventBadgeText, { color: "#1565C0" }]}>Global</Text>
        </View>
      )}

      <Text style={styles.cardContent}>{item.content}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pengumuman</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreateModal}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Buat Pengumuman</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#BDBDBD" />
          <Text style={styles.errorTitle}>Gagal Memuat</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); loadData(); }}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="megaphone-outline" size={52} color="#BDBDBD" />
              <Text style={styles.emptyTitle}>Belum ada pengumuman</Text>
              <Text style={styles.emptySub}>Ketuk "Buat Pengumuman" untuk membagikan informasi baru.</Text>
            </View>
          }
        />
      )}

      {/* Modal Form Buat / Edit Pengumuman */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={ms.overlay}
        >
          <View style={ms.sheet}>
            <View style={ms.handle} />
            <View style={ms.sheetHeader}>
              <Text style={ms.sheetTitle}>{editId ? "Edit Pengumuman" : "Buat Pengumuman Baru"}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>

            {modalError ? (
              <View style={ms.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.primary} />
                <Text style={ms.errorText}>{modalError}</Text>
              </View>
            ) : null}

            {/* Target Event (only on Create) */}
            {!editId && (
              <>
                <Text style={ms.label}>Target Event (Opsional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  <TouchableOpacity
                    style={[ms.chip, !selectedEventId ? ms.chipActive : null]}
                    onPress={() => setSelectedEventId("")}
                  >
                    <Text style={[ms.chipText, !selectedEventId ? ms.chipTextActive : null]}>Global (Semua)</Text>
                  </TouchableOpacity>
                  {events.map((ev) => {
                    const isSel = selectedEventId === ev.id;
                    return (
                      <TouchableOpacity
                        key={ev.id}
                        style={[ms.chip, isSel ? ms.chipActive : null]}
                        onPress={() => setSelectedEventId(ev.id)}
                      >
                        <Text style={[ms.chipText, isSel ? ms.chipTextActive : null]}>{ev.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            <Text style={ms.label}>Judul Pengumuman *</Text>
            <TextInput
              style={ms.input}
              placeholder="Contoh: Perubahan Waktu Technical Meeting"
              placeholderTextColor="#9E9E9E"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={ms.label}>Isi Pengumuman *</Text>
            <TextInput
              style={[ms.input, ms.textArea]}
              placeholder="Tuliskan isi detail pengumuman..."
              placeholderTextColor="#9E9E9E"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={content}
              onChangeText={setContent}
            />

            <TouchableOpacity
              style={[ms.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={ms.submitBtnText}>{editId ? "Simpan Perubahan" : "Publikasikan"}</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FA", paddingTop: Platform.OS === "android" ? 36 : 0 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fff", paddingHorizontal: Spacing.base, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1E1E1E" },
  addBtn: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.primary,
    borderRadius: Radius.xl, paddingHorizontal: 14, paddingVertical: 8, gap: 4,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl, gap: 12 },
  errorTitle: { fontSize: 16, fontWeight: "700", color: "#424242" },
  errorSub: { fontSize: 13, color: "#9E9E9E", textAlign: "center" },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: 24, paddingVertical: 10 },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#424242" },
  emptySub: { fontSize: 13, color: "#9E9E9E", textAlign: "center", paddingHorizontal: 24 },
  list: { padding: Spacing.base, paddingBottom: 32, gap: Spacing.sm },
  card: { backgroundColor: "#fff", borderRadius: Radius.xl, padding: Spacing.base, gap: 8, elevation: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1E1E1E" },
  cardMeta: { fontSize: 12, color: "#9E9E9E" },
  actionBtns: { flexDirection: "row", gap: 6 },
  iconBtn: { padding: 4 },
  eventBadge: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start",
    backgroundColor: "#FFEBEE", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
  },
  eventBadgeText: { fontSize: 11, fontWeight: "700", color: Colors.primary },
  cardContent: { fontSize: 13, color: "#424242", lineHeight: 20 },
});

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.base },
  handle: { width: 40, height: 4, backgroundColor: "#E0E0E0", borderRadius: 2, alignSelf: "center", marginBottom: Spacing.md },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  sheetTitle: { fontSize: 17, fontWeight: "700", color: "#1E1E1E" },
  errorBox: { flexDirection: "row", gap: 6, backgroundColor: "#FFEBEE", borderRadius: Radius.md, padding: 8, marginBottom: 8, alignItems: "center" },
  errorText: { fontSize: 12, color: Colors.primary },
  label: { fontSize: 13, fontWeight: "600", color: "#424242", marginTop: Spacing.md, marginBottom: 6 },
  input: { backgroundColor: "#F5F5F5", borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: 14, color: "#1E1E1E" },
  textArea: { minHeight: 90, paddingTop: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "#F5F5F5" },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: "#757575" },
  chipTextActive: { color: "#fff" },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, height: 48, alignItems: "center", justifyContent: "center", marginTop: Spacing.lg },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
