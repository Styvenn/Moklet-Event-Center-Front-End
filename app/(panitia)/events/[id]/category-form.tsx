// app/(panitia)/events/[id]/category-form.tsx
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
  Alert,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { Colors, Spacing, Radius } from "../../../../constants/theme";
import {
  createCategory, updateCategory, getCategoriesByEvent, CategoryItem,
} from "../../../../services/panitia/events.service";

export default function CategoryFormScreen() {
  const { eventId, categoryId } = useLocalSearchParams<{ eventId: string; categoryId?: string }>();
  const targetEventId = Array.isArray(eventId) ? eventId[0] : eventId;
  const targetCatId = Array.isArray(categoryId) ? categoryId[0] : categoryId;

  const isEdit = !!targetCatId;

  const [name, setName] = useState("");
  const [isTeam, setIsTeam] = useState(false);
  const [minMember, setMinMember] = useState("1");
  const [maxMember, setMaxMember] = useState("1");
  const [teamCompositionMode, setTeamCompositionMode] = useState<"FREE" | "PER_CLASS" | "PER_ANGKATAN">("FREE");
  const [maxTeamsPerGroup, setMaxTeamsPerGroup] = useState("");
  const [maxTotalTeams, setMaxTotalTeams] = useState("");
  const [excludeGrade12, setExcludeGrade12] = useState(true);

  const [fetching, setFetching] = useState(isEdit);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; members?: string; maxTeamsPerGroup?: string; general?: string }>({});

  useEffect(() => {
    async function load() {
      if (!targetEventId || !targetCatId) return;
      try {
        const cats = await getCategoriesByEvent(targetEventId);
        const existing = cats.find((c) => c.id === targetCatId);
        if (existing) {
          setName(existing.name);
          setMinMember(String(existing.minMember));
          setMaxMember(String(existing.maxMember));
          setIsTeam(existing.maxMember > 1);
          setTeamCompositionMode(existing.teamCompositionMode);
          if (existing.maxTeamsPerGroup !== null) setMaxTeamsPerGroup(String(existing.maxTeamsPerGroup));
          if (existing.maxTotalTeams !== null) setMaxTotalTeams(String(existing.maxTotalTeams));
          setExcludeGrade12(existing.excludeGrade12);
        }
      } catch {
        setErrors({ general: "Gagal memuat data cabang lomba." });
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [targetEventId, targetCatId]);

  // Auto-switch ke individu jika user pilih tim tapi maxMember = 1
  const handleMaxMemberBlur = () => {
    if (isTeam) {
      const num = parseInt(maxMember, 10);
      if (!isNaN(num) && num <= 1) {
        setIsTeam(false);
        setMinMember("1");
        setMaxMember("1");
      }
    }
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = "Nama lomba wajib diisi.";

    if (isTeam) {
      const minNum = parseInt(minMember, 10);
      const maxNum = parseInt(maxMember, 10);
      if (isNaN(minNum) || isNaN(maxNum) || minNum < 1 || maxNum < minNum) {
        errs.members = "Jumlah anggota minimal & maksimal tidak valid.";
      }
      if (maxNum <= 1) {
        errs.members = "Jumlah anggota maksimal harus lebih dari 1 untuk mode Tim.";
      }
    }

    // Validasi maxTeamsPerGroup HANYA untuk mode PER_CLASS dan PER_ANGKATAN
    if ((teamCompositionMode === "PER_CLASS" || teamCompositionMode === "PER_ANGKATAN") && !maxTeamsPerGroup.trim()) {
      errs.maxTeamsPerGroup = `Maksimal Tim per ${teamCompositionMode === "PER_CLASS" ? "Kelas" : "Angkatan"} wajib diisi untuk mode ini.`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !targetEventId) return;
    setLoading(true);
    setErrors({});

    // Tentukan final mode berdasarkan maxMember
    const maxNum = isTeam ? parseInt(maxMember, 10) : 1;
    const minNum = isTeam ? parseInt(minMember, 10) : 1;
    const finalIsTeam = isTeam && maxNum > 1;

    // Auto-correct state jika terlanjur disubmit
    if (isTeam && maxNum <= 1) {
      setIsTeam(false);
      setMinMember("1");
      setMaxMember("1");
    }

    const maxGroupVal =
      (teamCompositionMode === "PER_CLASS" || teamCompositionMode === "PER_ANGKATAN") && maxTeamsPerGroup.trim()
        ? parseInt(maxTeamsPerGroup, 10)
        : undefined;

    const maxTotalVal = maxTotalTeams.trim() ? parseInt(maxTotalTeams, 10) : undefined;

    const dto = {
      name: name.trim(),
      minMember: finalIsTeam ? minNum : 1,
      maxMember: finalIsTeam ? maxNum : 1,
      teamCompositionMode,
      maxTeamsPerGroup: maxGroupVal,
      maxTeamPerGroup: maxGroupVal, // singular fallback
      maxTotalTeams: maxTotalVal,
      maxTotalTeam: maxTotalVal, // singular fallback
      excludeGrade12,
    };

    try {
      if (isEdit && targetCatId) {
        await updateCategory(targetCatId, dto);
      } else {
        await createCategory(targetEventId, dto);
      }
      setLoading(false);
      Alert.alert("Sukses", `Cabang lomba berhasil ${isEdit ? "diperbarui" : "ditambahkan"}!`, [
        {
          text: "OK",
          onPress: () => {
            if (isEdit) {
              router.back();
            } else {
              // Clear form to stay on the page and allow adding more
              setName("");
              setIsTeam(false);
              setMinMember("1");
              setMaxMember("1");
              setTeamCompositionMode("FREE");
              setMaxTeamsPerGroup("");
              setMaxTotalTeams("");
              setExcludeGrade12(true);
            }
          },
        },
      ]);
    } catch (e: any) {
      setLoading(false);
      setErrors({ general: e?.formattedMessage || e?.message || "Gagal menyimpan cabang lomba." });
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#1E1E1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? "Edit Lomba" : "Tambah Lomba Baru"}</Text>
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

          {/* Nama Lomba */}
          <Text style={styles.label}>Nama Cabang Lomba *</Text>
          <TextInput
            style={[styles.input, errors.name ? styles.inputError : null]}
            placeholder="Contoh: Mobile Legends, Futsal, UI/UX Design"
            placeholderTextColor="#9E9E9E"
            value={name}
            onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
          />
          {errors.name && <Text style={styles.errHint}>{errors.name}</Text>}

          {/* Jenis Peserta (Individu / Tim) */}
          <Text style={styles.label}>Jenis Peserta</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, !isTeam ? styles.toggleActive : null]}
              onPress={() => { setIsTeam(false); setMinMember("1"); setMaxMember("1"); }}
            >
              <Ionicons name="person-outline" size={18} color={!isTeam ? "#fff" : "#757575"} />
              <Text style={[styles.toggleText, !isTeam ? styles.toggleTextActive : null]}>Individu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, isTeam ? styles.toggleActive : null]}
              onPress={() => { setIsTeam(true); if (parseInt(maxMember, 10) <= 1) setMaxMember("5"); if (parseInt(minMember, 10) <= 1) setMinMember("2"); }}
            >
              <Ionicons name="people-outline" size={18} color={isTeam ? "#fff" : "#757575"} />
              <Text style={[styles.toggleText, isTeam ? styles.toggleTextActive : null]}>Kelompok / Tim</Text>
            </TouchableOpacity>
          </View>

          {/* Min & Max Member (if Tim) */}
          {isTeam && (
            <View style={styles.numRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Min Anggota/Tim</Text>
                <TextInput
                  style={[styles.input, errors.members ? styles.inputError : null]}
                  keyboardType="numeric"
                  value={minMember}
                  onChangeText={(t) => { setMinMember(t); setErrors((e) => ({ ...e, members: undefined })); }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Max Anggota/Tim</Text>
                <TextInput
                  style={[styles.input, errors.members ? styles.inputError : null]}
                  keyboardType="numeric"
                  value={maxMember}
                  onChangeText={(t) => { setMaxMember(t); setErrors((e) => ({ ...e, members: undefined })); }}
                  onBlur={handleMaxMemberBlur}
                />
              </View>
            </View>
          )}
          {errors.members && <Text style={styles.errHint}>{errors.members}</Text>}

          {/* Info otomatis switch ke individu */}
          {isTeam && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={15} color="#2563EB" />
              <Text style={styles.infoText}>
                Jika Max Anggota diisi 1, lomba akan otomatis berubah menjadi mode Individu.
              </Text>
            </View>
          )}

          {/* Mode Komposisi Tim */}
          <Text style={styles.label}>Mode Komposisi Tim</Text>
          <View style={styles.modeRow}>
            {(["FREE", "PER_CLASS", "PER_ANGKATAN"] as const).map((mode) => {
              const labels: Record<typeof mode, string> = {
                FREE: "Bebas", PER_CLASS: "Per Kelas", PER_ANGKATAN: "Per Angkatan",
              };
              const isSel = teamCompositionMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeBtn, isSel ? styles.modeActive : null]}
                  onPress={() => {
                    setTeamCompositionMode(mode);
                    // Clear maxTeamsPerGroup error kalau pindah ke FREE
                    if (mode === "FREE") setErrors((e) => ({ ...e, maxTeamsPerGroup: undefined }));
                  }}
                >
                  <Text style={[styles.modeText, isSel ? styles.modeTextActive : null]}>{labels[mode]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Max Teams Per Group — HANYA untuk PER_CLASS / PER_ANGKATAN */}
          {(teamCompositionMode === "PER_CLASS" || teamCompositionMode === "PER_ANGKATAN") && (
            <>
              <Text style={styles.label}>
                Maksimal Tim per {teamCompositionMode === "PER_CLASS" ? "Kelas" : "Angkatan"} *
              </Text>
              <TextInput
                style={[styles.input, errors.maxTeamsPerGroup ? styles.inputError : null]}
                placeholder="Contoh: 2"
                placeholderTextColor="#9E9E9E"
                keyboardType="numeric"
                value={maxTeamsPerGroup}
                onChangeText={(t) => { setMaxTeamsPerGroup(t); setErrors((e) => ({ ...e, maxTeamsPerGroup: undefined })); }}
              />
              {errors.maxTeamsPerGroup && <Text style={styles.errHint}>{errors.maxTeamsPerGroup}</Text>}
            </>
          )}

          {/* Kuota Total */}
          <Text style={styles.label}>Kuota Maksimal Total (Opsional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Kosongkan jika tidak ada batas kuota"
            placeholderTextColor="#9E9E9E"
            keyboardType="numeric"
            value={maxTotalTeams}
            onChangeText={setMaxTotalTeams}
          />

          {/* Exclude Grade 12 Switch */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Kecualikan Siswa Kelas XII</Text>
              <Text style={styles.switchSub}>Jika aktif, siswa kelas 12 tidak bisa mendaftar lomba ini.</Text>
            </View>
            <Switch
              value={excludeGrade12}
              onValueChange={setExcludeGrade12}
              trackColor={{ false: "#E0E0E0", true: Colors.primaryLight }}
              thumbColor={excludeGrade12 ? Colors.primary : "#9E9E9E"}
            />
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Simpan Lomba</Text>}
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
  infoBox: {
    flexDirection: "row", gap: 6, backgroundColor: "#EFF6FF", borderRadius: Radius.md,
    padding: Spacing.sm, marginTop: 6, alignItems: "flex-start",
  },
  infoText: { flex: 1, fontSize: 12, color: "#2563EB", lineHeight: 17 },
  label: { fontSize: 13, fontWeight: "600", color: "#424242", marginTop: Spacing.md, marginBottom: 6 },
  input: {
    backgroundColor: "#F5F5F5", borderRadius: Radius.lg, paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === "ios" ? 14 : 10, fontSize: 14, color: "#1E1E1E", borderWidth: 1, borderColor: "transparent",
  },
  inputError: { borderColor: Colors.primary, backgroundColor: "#FFF8F8" },
  errHint: { fontSize: 12, color: Colors.primary, marginTop: 4 },
  toggleRow: { flexDirection: "row", gap: 10 },
  toggleBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 12, borderRadius: Radius.lg, backgroundColor: "#F5F5F5",
  },
  toggleActive: { backgroundColor: Colors.primary },
  toggleText: { fontSize: 13, fontWeight: "600", color: "#757575" },
  toggleTextActive: { color: "#fff", fontWeight: "700" },
  numRow: { flexDirection: "row", gap: 12 },
  modeRow: { flexDirection: "row", gap: 8 },
  modeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: Radius.lg, backgroundColor: "#F5F5F5",
    alignItems: "center", justifyContent: "center",
  },
  modeActive: { backgroundColor: Colors.primaryLight, borderWidth: 1.5, borderColor: Colors.primary },
  modeText: { fontSize: 12, fontWeight: "600", color: "#757575" },
  modeTextActive: { color: Colors.primary, fontWeight: "700" },
  switchRow: {
    flexDirection: "row", alignItems: "center", marginTop: Spacing.lg, paddingVertical: Spacing.sm,
    borderTopWidth: 1, borderTopColor: "#F0F0F0", gap: 12,
  },
  switchTitle: { fontSize: 14, fontWeight: "700", color: "#1E1E1E" },
  switchSub: { fontSize: 12, color: "#757575", marginTop: 2 },
  bottomBar: {
    padding: Spacing.base, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F0F0F0",
    paddingBottom: Platform.OS === "ios" ? 28 : Spacing.base,
  },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, height: 50, alignItems: "center", justifyContent: "center" },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
