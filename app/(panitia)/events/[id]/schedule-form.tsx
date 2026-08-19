// app/(panitia)/events/[id]/schedule-form.tsx
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, Platform, ScrollView,
  TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { Colors, Spacing, Radius } from "../../../../constants/theme";
import {
  createSchedule, updateSchedule, getSchedulesByEvent, ScheduleItem,
} from "../../../../services/panitia/events.service";

export default function ScheduleFormScreen() {
  const { eventId, scheduleId } = useLocalSearchParams<{ eventId: string; scheduleId?: string }>();
  const targetEventId = Array.isArray(eventId) ? eventId[0] : eventId;
  const targetSchId = Array.isArray(scheduleId) ? scheduleId[0] : scheduleId;

  const isEdit = !!targetSchId;

  const [dayLabel, setDayLabel] = useState("");
  const [date, setDate] = useState("");
  const [dresscodeText, setDresscodeText] = useState("");

  const [fetching, setFetching] = useState(isEdit);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ dayLabel?: string; date?: string; general?: string }>({});

  useEffect(() => {
    async function load() {
      if (!targetEventId || !targetSchId) return;
      try {
        const schs = await getSchedulesByEvent(targetEventId);
        const existing = schs.find((s) => s.id === targetSchId);
        if (existing) {
          setDayLabel(existing.dayLabel);
          setDate(existing.date);
          setDresscodeText(existing.dresscodeText);
        }
      } catch {
        setErrors({ general: "Gagal memuat detail jadwal." });
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [targetEventId, targetSchId]);

  const validate = () => {
    const errs: typeof errors = {};
    if (!dayLabel.trim()) errs.dayLabel = "Nama aktivitas / hari wajib diisi.";
    if (!date.trim()) {
      errs.date = "Tanggal kegiatan wajib diisi.";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      errs.date = "Format tanggal harus YYYY-MM-DD.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !targetEventId) return;
    setLoading(true);
    setErrors({});

    const dto = {
      dayLabel: dayLabel.trim(),
      date: date.trim(),
      dresscodeText: dresscodeText.trim() || "-",
    };

    try {
      if (isEdit && targetSchId) {
        await updateSchedule(targetSchId, dto);
      } else {
        await createSchedule(targetEventId, dto);
      }
      setLoading(false);
      Alert.alert("Sukses", `Jadwal kegiatan berhasil ${isEdit ? "diperbarui" : "ditambahkan"}!`, [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (e: any) {
      setLoading(false);
      setErrors({ general: e?.formattedMessage || e?.message || "Gagal menyimpan jadwal." });
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
          <Text style={styles.headerTitle}>{isEdit ? "Edit Jadwal" : "Tambah Jadwal Baru"}</Text>
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

          {/* Nama Aktivitas / Day Label */}
          <Text style={styles.label}>Nama Aktivitas / Agenda *</Text>
          <TextInput
            style={[styles.input, errors.dayLabel ? styles.inputError : null]}
            placeholder="Contoh: Technical Meeting, Pembukaan, Babak Penyisihan"
            placeholderTextColor="#9E9E9E"
            value={dayLabel}
            onChangeText={(t) => { setDayLabel(t); setErrors((e) => ({ ...e, dayLabel: undefined })); }}
          />
          {errors.dayLabel && <Text style={styles.errHint}>{errors.dayLabel}</Text>}

          {/* Tanggal */}
          <Text style={styles.label}>Tanggal Kegiatan (YYYY-MM-DD) *</Text>
          <TextInput
            style={[styles.input, errors.date ? styles.inputError : null]}
            placeholder="Contoh: 2026-08-17"
            placeholderTextColor="#9E9E9E"
            value={date}
            onChangeText={(t) => { setDate(t); setErrors((e) => ({ ...e, date: undefined })); }}
          />
          {errors.date && <Text style={styles.errHint}>{errors.date}</Text>}

          {/* Catatan / Dresscode */}
          <Text style={styles.label}>Catatan & Ketentuan (Waktu, Dresscode, Lokasi)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Contoh: Pukul 08.00 WIB di Aula Utama. Pakaian Batik bebas rapi."
            placeholderTextColor="#9E9E9E"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={dresscodeText}
            onChangeText={setDresscodeText}
          />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Simpan Jadwal</Text>}
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
  textArea: { minHeight: 90, paddingTop: 12 },
  bottomBar: {
    padding: Spacing.base, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F0F0F0",
    paddingBottom: Platform.OS === "ios" ? 28 : Spacing.base,
  },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, height: 50, alignItems: "center", justifyContent: "center" },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
