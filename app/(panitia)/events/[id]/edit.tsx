// app/(panitia)/events/[id]/edit.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Colors, Spacing, Radius } from "../../../../constants/theme";
import { getEventById, updateEvent, updateEventStatus, uploadBanner, uploadGuidebook } from "../../../../services/panitia/events.service";

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = Array.isArray(id) ? id[0] : id;

  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"ONGOING" | "CLOSED">("ONGOING");

  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(null);

  const [guidebookUri, setGuidebookUri] = useState<string | null>(null);
  const [guidebookName, setGuidebookName] = useState<string | null>(null);

  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; eventDate?: string; general?: string }>({});

  useEffect(() => {
    async function load() {
      if (!eventId) return;
      try {
        const ev = await getEventById(eventId);
        setName(ev.name);
        setEventDate(ev.eventDate);
        setDescription(ev.description || "");
        setStatus(ev.status === "CLOSED" ? "CLOSED" : "ONGOING");
        setCurrentBannerUrl(ev.bannerUrl);
        if (ev.guidebookUrl) setGuidebookName("Guidebook saat ini sudah diunggah");
      } catch {
        setErrors({ general: "Gagal memuat detail event." });
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [eventId]);

  const pickBanner = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        setBannerUri(res.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Gagal memilih gambar banner.");
    }
  };

  const pickGuidebook = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        setGuidebookUri(res.assets[0].uri);
        setGuidebookName(res.assets[0].name || "guidebook.pdf");
      }
    } catch {
      Alert.alert("Error", "Gagal memilih berkas PDF.");
    }
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = "Nama event wajib diisi.";
    if (!eventDate.trim()) {
      errs.eventDate = "Tanggal event wajib diisi.";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate.trim())) {
      errs.eventDate = "Format tanggal harus YYYY-MM-DD.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !eventId) return;
    setLoading(true);
    setErrors({});

    try {
      await updateEvent(eventId, {
        name: name.trim(),
        eventDate: eventDate.trim(),
        description: description.trim() || undefined,
      });

      await updateEventStatus(eventId, status);

      if (bannerUri) {
        try { await uploadBanner(eventId, bannerUri); } catch (e) { console.warn(e); }
      }

      if (guidebookUri) {
        try { await uploadGuidebook(eventId, guidebookUri); } catch (e) { console.warn(e); }
      }

      setLoading(false);
      Alert.alert("Sukses", "Perubahan event berhasil disimpan!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (e: any) {
      setLoading(false);
      setErrors({ general: e?.formattedMessage || e?.message || "Gagal mengosongkan / mengupdate event." });
    }
  };

  if (fetching) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E1E1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Event</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 60 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {errors.general ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          ) : null}

          {/* Status event toggle */}
          <Text style={styles.label}>Status Event</Text>
          <View style={styles.statusToggleRow}>
            <TouchableOpacity
              style={[styles.statusBtn, status === "ONGOING" ? styles.statusBtnOngoing : null]}
              onPress={() => setStatus("ONGOING")}
            >
              <Ionicons name="play-circle-outline" size={18} color={status === "ONGOING" ? "#fff" : "#757575"} />
              <Text style={[styles.statusBtnText, status === "ONGOING" ? styles.statusTextActive : null]}>Berlangsung</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusBtn, status === "CLOSED" ? styles.statusBtnClosed : null]}
              onPress={() => setStatus("CLOSED")}
            >
              <Ionicons name="stop-circle-outline" size={18} color={status === "CLOSED" ? "#fff" : "#757575"} />
              <Text style={[styles.statusBtnText, status === "CLOSED" ? styles.statusTextActive : null]}>Selesai / Tutup</Text>
            </TouchableOpacity>
          </View>

          {/* Nama Event */}
          <Text style={styles.label}>Nama Event *</Text>
          <TextInput
            style={[styles.input, errors.name ? styles.inputError : null]}
            value={name}
            onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
          />
          {errors.name && <Text style={styles.errHint}>{errors.name}</Text>}

          {/* Tanggal Event */}
          <Text style={styles.label}>Tanggal Event (YYYY-MM-DD) *</Text>
          <TextInput
            style={[styles.input, errors.eventDate ? styles.inputError : null]}
            value={eventDate}
            onChangeText={(t) => { setEventDate(t); setErrors((e) => ({ ...e, eventDate: undefined })); }}
          />
          {errors.eventDate && <Text style={styles.errHint}>{errors.eventDate}</Text>}

          {/* Deskripsi */}
          <Text style={styles.label}>Deskripsi Event</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />

          {/* Banner */}
          <Text style={styles.label}>Banner Event</Text>
          <TouchableOpacity style={styles.uploadCard} onPress={pickBanner} activeOpacity={0.8}>
            {bannerUri || currentBannerUrl ? (
              <View style={styles.bannerPreviewWrapper}>
                <Image source={{ uri: bannerUri || currentBannerUrl! }} style={styles.bannerPreview} />
                <View style={styles.changeOverlay}>
                  <Ionicons name="camera-outline" size={18} color="#fff" />
                  <Text style={styles.changeText}>Ganti Banner</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="image-outline" size={24} color={Colors.primary} />
                <Text style={styles.uploadTitle}>Upload Banner Baru</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Guidebook */}
          <Text style={styles.label}>Guidebook PDF</Text>
          <TouchableOpacity style={styles.pdfCard} onPress={pickGuidebook} activeOpacity={0.8}>
            <Ionicons name="document-text-outline" size={22} color={Colors.primary} />
            <Text style={styles.pdfName} numberOfLines={1}>
              {guidebookName || "Pilih file PDF..."}
            </Text>
            <Text style={styles.pdfUploadBtn}>{guidebookUri ? "Ganti" : "Pilih File"}</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Simpan Perubahan</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff", paddingTop: Platform.OS === "android" ? 36 : 0 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.base, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1E1E1E" },
  scroll: { padding: Spacing.base, paddingBottom: 40 },
  errorBox: { flexDirection: "row", gap: 8, backgroundColor: "#FFEBEE", borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.base },
  errorText: { flex: 1, fontSize: 13, color: Colors.primary },
  label: { fontSize: 13, fontWeight: "600", color: "#424242", marginTop: Spacing.md, marginBottom: 6 },
  input: {
    backgroundColor: "#F5F5F5", borderRadius: Radius.lg, paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === "ios" ? 14 : 10, fontSize: 14, color: "#1E1E1E", borderWidth: 1, borderColor: "transparent",
  },
  inputError: { borderColor: Colors.primary, backgroundColor: "#FFF8F8" },
  errHint: { fontSize: 12, color: Colors.primary, marginTop: 4 },
  textArea: { minHeight: 100, paddingTop: 12 },
  statusToggleRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  statusBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 12, borderRadius: Radius.lg, backgroundColor: "#F5F5F5",
  },
  statusBtnOngoing: { backgroundColor: "#2E7D32" },
  statusBtnClosed: { backgroundColor: "#6D4C41" },
  statusBtnText: { fontSize: 13, fontWeight: "600", color: "#757575" },
  statusTextActive: { color: "#fff", fontWeight: "700" },
  uploadCard: {
    borderWidth: 1.5, borderColor: "#E0E0E0", borderStyle: "dashed",
    borderRadius: Radius.xl, overflow: "hidden", backgroundColor: "#FAFAFA",
    minHeight: 120, justifyContent: "center", alignItems: "center",
  },
  uploadPlaceholder: { alignItems: "center", padding: Spacing.md, gap: 6 },
  uploadTitle: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  bannerPreviewWrapper: { width: "100%", height: 140, position: "relative" },
  bannerPreview: { width: "100%", height: "100%" },
  changeOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 6, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
  },
  changeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  pdfCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#F5F5F5", borderRadius: Radius.lg, padding: Spacing.md,
  },
  pdfName: { flex: 1, fontSize: 13, color: "#424242" },
  pdfUploadBtn: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  bottomBar: {
    padding: Spacing.base, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F0F0F0",
    paddingBottom: Platform.OS === "ios" ? 28 : Spacing.base,
  },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, height: 50, alignItems: "center", justifyContent: "center" },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
