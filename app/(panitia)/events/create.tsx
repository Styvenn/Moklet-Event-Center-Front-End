// app/(panitia)/events/create.tsx
import React, { useState } from "react";
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
import { router, useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../constants/query";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors, Spacing, Radius } from "../../../constants/theme";
import { createEvent, uploadBanner, uploadGuidebook, createCategory } from "../../../services/panitia/events.service";

export default function CreateEventScreen() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [guidebookUri, setGuidebookUri] = useState<string | null>(null);
  const [guidebookName, setGuidebookName] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState(false); // false = ONGOING (aktif), true = DRAFT

  interface CategoryInput {
    name: string;
    isTeam: boolean;
    maxMember: number;
    maxTotalTeams: string;
  }
  const [categories, setCategories] = useState<CategoryInput[]>([]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; eventDate?: string; general?: string }>({});

  useFocusEffect(
    React.useCallback(() => {
      // Reset form on mount/focus
      setName("");
      setEventDate("");
      setDescription("");
      setContactInfo("");
      setBannerUri(null);
      setGuidebookUri(null);
      setGuidebookName(null);
      setStatusDraft(false);
      setCategories([]);
      setErrors({});
      setDateObj(new Date());
    }, [])
  );

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObj, setDateObj] = useState(new Date());

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDateObj(selectedDate);
      const isoString = selectedDate.toISOString().split("T")[0];
      setEventDate(isoString);
      setErrors((e) => ({ ...e, eventDate: undefined }));
    }
  };

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
      errs.eventDate = "Format tanggal harus YYYY-MM-DD (contoh: 2026-08-17).";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const created = await createEvent({
        name: name.trim(),
        eventDate: eventDate.trim(),
        description: description.trim() || undefined,
        contactInfo: contactInfo.trim() || undefined,
        status: statusDraft ? "DRAFT" : "ONGOING",
      } as any);

      // Upload banner jika ada
      if (bannerUri && created.id) {
        try {
          await uploadBanner(created.id, bannerUri);
        } catch (e: any) {
          console.warn("Banner upload error:", e);
        }
      }

      // Upload guidebook jika ada
      if (guidebookUri && created.id) {
        try {
          await uploadGuidebook(created.id, guidebookUri);
        } catch (e: any) {
          console.warn("Guidebook upload error:", e);
        }
      }


      // Create categories
      if (categories.length > 0 && created.id) {
        for (const cat of categories) {
          if (cat.name.trim()) {
            try {
              await createCategory(created.id, {
                name: cat.name.trim(),
                minMember: 1,
                maxMember: cat.isTeam ? cat.maxMember : 1,
                teamCompositionMode: "FREE",
                maxTotalTeams: parseInt(cat.maxTotalTeams) || undefined,
              });
            } catch (e: any) {
              console.warn("Category creation error:", e);
            }
          }
        }
      }


      // Sinkronkan cache: list event panitia + layar siswa langsung ter-update.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.managedEvents }),
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.adminStats }),
      ]);

      setLoading(false);
      // Reset form
      setName("");
      setEventDate("");
      setDescription("");
      setContactInfo("");
      setBannerUri(null);
      setGuidebookUri(null);
      setGuidebookName(null);
      setStatusDraft(false);

      Alert.alert("Sukses", "Event baru berhasil dibuat!", [
        {
          text: "OK",
          onPress: () =>
            router.replace({ pathname: "/(panitia)/events/[id]", params: { id: created.id } } as any),
        },
      ]);
    } catch (e: any) {
      setLoading(false);
      setErrors({ general: e?.formattedMessage || e?.message || "Gagal membuat event. Coba lagi." });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E1E1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Buat Event Baru</Text>
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

          {/* Nama Event */}
          <Text style={styles.label}>Nama Event *</Text>
          <TextInput
            style={[styles.input, errors.name ? styles.inputError : null]}
            placeholder="Contoh: Porseni Moklet 2026"
            placeholderTextColor="#9E9E9E"
            value={name}
            onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
          />
          {errors.name && <Text style={styles.errHint}>{errors.name}</Text>}

          {/* Tanggal Event dengan Calendar Picker */}
          <Text style={styles.label}>Tanggal Event *</Text>
          <View style={styles.dateInputWrapper}>
            <TextInput
              style={[styles.input, { flex: 1 }, errors.eventDate ? styles.inputError : null]}
              placeholder="Contoh: 2026-08-17"
              placeholderTextColor="#9E9E9E"
              value={eventDate}
              onChangeText={(t) => { setEventDate(t); setErrors((e) => ({ ...e, eventDate: undefined })); }}
            />
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.calendarBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={dateObj}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "calendar"}
              onChange={onDateChange}
            />
          )}
          {errors.eventDate && <Text style={styles.errHint}>{errors.eventDate}</Text>}

          {/* Deskripsi */}
          <Text style={styles.label}>Deskripsi Event</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Jelaskan detail acara, syarat, atau informasi penting lainnya..."
            placeholderTextColor="#9E9E9E"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />

          {/* Kontak Panitia */}
          <Text style={styles.label}>Nomor Kontak Panitia (Opsional)</Text>
          <View style={styles.contactRow}>
            <View style={styles.contactIconCircle}>
              <Ionicons name="call-outline" size={18} color={Colors.primary} />
            </View>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Contoh: 08123456789 (WhatsApp Panitia)"
              placeholderTextColor="#9E9E9E"
              keyboardType="phone-pad"
              value={contactInfo}
              onChangeText={setContactInfo}
            />
          </View>

          {/* Cabang Lomba */}
          <Text style={styles.label}>Cabang Lomba (Opsional)</Text>
          {categories.map((cat, index) => (
            <View key={index} style={styles.categoryInputCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontWeight: "700", color: "#1E1E1E" }}>Lomba {index + 1}</Text>
                <TouchableOpacity onPress={() => setCategories(prev => prev.filter((_, i) => i !== index))}>
                  <Ionicons name="trash-outline" size={18} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, { marginBottom: 8 }]}
                placeholder="Nama Lomba (Contoh: Futsal)"
                placeholderTextColor="#9E9E9E"
                value={cat.name}
                onChangeText={(t) => {
                  const newCats = [...categories];
                  newCats[index].name = t;
                  setCategories(newCats);
                }}
              />
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <TouchableOpacity
                  style={[styles.statusBtn, !cat.isTeam ? styles.statusBtnActive : null, { paddingVertical: 8 }]}
                  onPress={() => {
                    const newCats = [...categories];
                    newCats[index].isTeam = false;
                    newCats[index].maxMember = 1;
                    setCategories(newCats);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.statusBtnLabel, !cat.isTeam ? styles.statusBtnLabelActive : null]}>Individu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusBtn, cat.isTeam ? styles.statusBtnActive : null, { paddingVertical: 8 }]}
                  onPress={() => {
                    const newCats = [...categories];
                    newCats[index].isTeam = true;
                    newCats[index].maxMember = 5;
                    setCategories(newCats);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.statusBtnLabel, cat.isTeam ? styles.statusBtnLabelActive : null]}>Tim</Text>
                </TouchableOpacity>
              </View>
              {cat.isTeam && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: "#424242", width: 130 }}>Anggota per Tim:</Text>
                  <TextInput
                    style={[styles.input, { flex: 1, paddingVertical: 6 }]}
                    keyboardType="number-pad"
                    value={String(cat.maxMember)}
                    onChangeText={(t) => {
                      const newCats = [...categories];
                      newCats[index].maxMember = parseInt(t) || 1;
                      setCategories(newCats);
                    }}
                  />
                </View>
              )}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 13, color: "#424242", width: 130 }}>Maksimal Kuota:</Text>
                <TextInput
                  style={[styles.input, { flex: 1, paddingVertical: 6 }]}
                  keyboardType="number-pad"
                  placeholder="32"
                  value={cat.maxTotalTeams}
                  onChangeText={(t) => {
                    const newCats = [...categories];
                    newCats[index].maxTotalTeams = t;
                    setCategories(newCats);
                  }}
                />
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addCategoryBtn}
            onPress={() => setCategories(prev => [...prev, { name: "", isTeam: false, maxMember: 1, maxTotalTeams: "" }])}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color={Colors.primary} />
            <Text style={styles.addCategoryText}>Tambah Lomba</Text>
          </TouchableOpacity>

          {/* Status Event */}
          <Text style={styles.label}>Status Event</Text>
          <View style={styles.statusToggleRow}>
            <TouchableOpacity
              style={[styles.statusBtn, !statusDraft ? styles.statusBtnActive : null]}
              onPress={() => setStatusDraft(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="play-circle-outline" size={18} color={!statusDraft ? "#fff" : "#757575"} />
              <View>
                <Text style={[styles.statusBtnLabel, !statusDraft ? styles.statusBtnLabelActive : null]}>
                  Aktif (Ongoing)
                </Text>
                <Text style={[styles.statusBtnSub, !statusDraft ? { color: "rgba(255,255,255,0.8)" } : null]}>
                  Langsung dipublikasikan
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusBtn, statusDraft ? styles.statusBtnDraft : null]}
              onPress={() => setStatusDraft(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="document-outline" size={18} color={statusDraft ? "#B45309" : "#757575"} />
              <View>
                <Text style={[styles.statusBtnLabel, statusDraft ? styles.statusBtnLabelDraft : null]}>
                  Draft
                </Text>
                <Text style={[styles.statusBtnSub, statusDraft ? { color: "#92400E" } : null]}>
                  Simpan dulu, belum tampil
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Upload Banner */}
          <Text style={styles.label}>Banner Event</Text>
          <TouchableOpacity style={styles.uploadCard} onPress={pickBanner} activeOpacity={0.8}>
            {bannerUri ? (
              <View style={styles.bannerPreviewWrapper}>
                <Image source={{ uri: bannerUri }} style={styles.bannerPreview} />
                <View style={styles.changeOverlay}>
                  <Ionicons name="camera-outline" size={20} color="#fff" />
                  <Text style={styles.changeText}>Ganti Banner</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <View style={styles.uploadIconCircle}>
                  <Ionicons name="image-outline" size={24} color={Colors.primary} />
                </View>
                <Text style={styles.uploadTitle}>Upload Banner</Text>
                <Text style={styles.uploadSub}>PNG, JPG, atau WEBP (Maks 3MB)</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Upload Guidebook */}
          <Text style={styles.label}>Guidebook / Buku Panduan (PDF)</Text>
          <TouchableOpacity style={styles.pdfCard} onPress={pickGuidebook} activeOpacity={0.8}>
            <Ionicons name="document-text-outline" size={24} color={Colors.primary} />
            <Text style={styles.pdfName} numberOfLines={1}>
              {guidebookName || "Pilih file PDF (Maks 10MB)..."}
            </Text>
            <Text style={styles.pdfUploadBtn}>{guidebookUri ? "Ganti" : "Upload"}</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>

        {/* Sticky Submit Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {statusDraft ? "Simpan sebagai Draft" : "Simpan & Publikasikan Event"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff", paddingTop: Platform.OS === "android" ? 36 : 0 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.base, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1E1E1E" },
  scroll: { padding: Spacing.base, paddingBottom: 40 },
  errorBox: {
    flexDirection: "row", gap: 8, backgroundColor: "#FFEBEE", borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.base, alignItems: "center",
  },
  errorText: { flex: 1, fontSize: 13, color: Colors.primary },
  label: { fontSize: 13, fontWeight: "600", color: "#424242", marginTop: Spacing.md, marginBottom: 6 },
  input: {
    backgroundColor: "#F5F5F5", borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Platform.OS === "ios" ? 14 : 10,
    fontSize: 14, color: "#1E1E1E", borderWidth: 1, borderColor: "transparent",
  },
  inputError: { borderColor: Colors.primary, backgroundColor: "#FFF8F8" },
  errHint: { fontSize: 12, color: Colors.primary, marginTop: 4, marginLeft: 4 },
  dateInputWrapper: { flexDirection: "row", alignItems: "center", gap: 8 },
  calendarBtn: {
    width: 44, height: 44, borderRadius: Radius.lg, backgroundColor: "#FEE2E2",
    alignItems: "center", justifyContent: "center",
  },
  textArea: { minHeight: 100, paddingTop: 12 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  contactIconCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#FEE2E2",
    alignItems: "center", justifyContent: "center",
  },
  // Status Toggle
  statusToggleRow: { flexDirection: "row", gap: 10 },
  statusBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 12, paddingHorizontal: Spacing.md, borderRadius: Radius.lg,
    backgroundColor: "#F5F5F5", borderWidth: 1.5, borderColor: "transparent",
  },
  statusBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  statusBtnDraft: {
    backgroundColor: "#FEF3C7", borderColor: "#F59E0B",
  },
  statusBtnLabel: { fontSize: 12, fontWeight: "700", color: "#757575" },
  statusBtnLabelActive: { color: "#fff" },
  statusBtnLabelDraft: { color: "#B45309" },
  statusBtnSub: { fontSize: 10, color: "#9E9E9E", marginTop: 1 },
  // Upload
  uploadCard: {
    borderWidth: 1.5, borderColor: "#E0E0E0", borderStyle: "dashed",
    borderRadius: Radius.xl, overflow: "hidden", backgroundColor: "#FAFAFA",
    minHeight: 130, justifyContent: "center", alignItems: "center",
  },
  uploadPlaceholder: { alignItems: "center", padding: Spacing.md, gap: 6 },
  uploadIconCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFEBEE",
    alignItems: "center", justifyContent: "center",
  },
  uploadTitle: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  uploadSub: { fontSize: 12, color: "#9E9E9E" },
  bannerPreviewWrapper: { width: "100%", height: 160, position: "relative" },
  bannerPreview: { width: "100%", height: "100%" },
  changeOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.6)", paddingVertical: 8,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
  },
  changeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  pdfCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#F5F5F5", borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: "#E0E0E0",
  },
  pdfName: { flex: 1, fontSize: 13, color: "#424242" },
  pdfUploadBtn: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  bottomBar: {
    padding: Spacing.base, backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: "#F0F0F0",
    paddingBottom: 0,
  },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    height: 50, alignItems: "center", justifyContent: "center",
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  categoryInputCard: {
    backgroundColor: "#F8FAFC", borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: "#E2E8F0", marginBottom: Spacing.sm,
  },
  addCategoryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: "#FFF5F5",
    borderWidth: 1, borderColor: "#FEE2E2", marginTop: 4,
  },
  addCategoryText: { fontSize: 14, fontWeight: "700", color: Colors.primary },
});
