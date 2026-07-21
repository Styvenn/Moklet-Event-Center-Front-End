// app/complete-profile.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Modal,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';

// ==== Sample Data ====
const ANGKATAN_OPTIONS = ['2021', '2022', '2023', '2024', '2025'];
const KELAS_OPTIONS = [
  'X RPL 1', 'X RPL 2', 'X RPL 3',
  'XI RPL 1', 'XI RPL 2', 'XI RPL 3',
  'XII RPL 1', 'XII RPL 2', 'XII RPL 3',
];
const NAMA_OPTIONS = [
  'Andi Pratama', 'Budi Santoso', 'Citra Dewi', 'Dian Kurniawan',
  'Eka Putri', 'Fajar Ramadhan', 'Gilang Nugraha', 'Hana Maharani',
  'Ilham Saputra', 'Julia Wati', 'Kevin Ardiansyah', 'Lina Marlina',
];

// ==== Dropdown Component ====
type DropdownFieldProps = {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  hasError?: boolean;
};

function DropdownField({ label, placeholder, options, value, onSelect, hasError }: DropdownFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={dropStyles.wrapper}>
      <Text style={dropStyles.label}>{label}</Text>
      <TouchableOpacity
        style={[dropStyles.trigger, hasError ? dropStyles.triggerError : null]}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={[dropStyles.triggerText, !value ? dropStyles.placeholder : null]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={Colors.textSubtitle} />
      </TouchableOpacity>

      {/* Bottom Sheet Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}
      >
        <View style={dropStyles.overlay}>
          <TouchableOpacity style={dropStyles.backdrop} onPress={() => setVisible(false)} activeOpacity={1} />
          <View style={dropStyles.sheet}>
            <View style={dropStyles.handle} />
            <Text style={dropStyles.sheetTitle}>Pilih {label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[dropStyles.option, item === value ? dropStyles.optionActive : null]}
                  onPress={() => { onSelect(item); setVisible(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[dropStyles.optionText, item === value ? dropStyles.optionTextActive : null]}>
                    {item}
                  </Text>
                  {item === value && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const dropStyles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.base },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textMain,
    marginBottom: Spacing.sm,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 52,
    backgroundColor: Colors.white,
  },
  triggerError: { borderColor: Colors.error },
  triggerText: { fontSize: 14, color: Colors.textMain, flex: 1 },
  placeholder: { color: Colors.textPlaceholder },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.xl,
    maxHeight: '60%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.base,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: Spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  optionActive: { backgroundColor: '#FFF5F5', marginHorizontal: -Spacing.base, paddingHorizontal: Spacing.base },
  optionText: { fontSize: 14, color: Colors.textMain },
  optionTextActive: { color: Colors.primary, fontWeight: '600' },
});

// ==== Main Screen ====
export default function CompleteProfileScreen() {
  const [angkatan, setAngkatan] = useState('');
  const [kelas, setKelas] = useState('');
  const [nama, setNama] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ angkatan?: boolean; kelas?: boolean; nama?: boolean }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!angkatan) newErrors.angkatan = true;
    if (!kelas) newErrors.kelas = true;
    if (!nama) newErrors.nama = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/home');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Lengkapi Profil Kamu</Text>
        <Text style={styles.subtitle}>Data ini akan digunakan untuk pendaftaran event</Text>

        <View style={styles.form}>
          <DropdownField
            label="Angkatan"
            placeholder="Pilih Angkatan"
            options={ANGKATAN_OPTIONS}
            value={angkatan}
            onSelect={(v) => { setAngkatan(v); setErrors((e) => ({ ...e, angkatan: false })); }}
            hasError={errors.angkatan}
          />
          {errors.angkatan && <Text style={styles.errorText}>Angkatan wajib dipilih</Text>}

          <DropdownField
            label="Kelas"
            placeholder="Pilih Kelas"
            options={KELAS_OPTIONS}
            value={kelas}
            onSelect={(v) => { setKelas(v); setErrors((e) => ({ ...e, kelas: false })); }}
            hasError={errors.kelas}
          />
          {errors.kelas && <Text style={styles.errorText}>Kelas wajib dipilih</Text>}

          <DropdownField
            label="Nama"
            placeholder="Pilih Nama Siswa"
            options={NAMA_OPTIONS}
            value={nama}
            onSelect={(v) => { setNama(v); setErrors((e) => ({ ...e, nama: false })); }}
            hasError={errors.nama}
          />
          {errors.nama && <Text style={styles.errorText}>Nama wajib dipilih</Text>}
        </View>
      </ScrollView>

      {/* Sticky Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveButton, loading ? styles.saveButtonDisabled : null]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Simpan & Lanjutkan</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: Spacing.sm,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSubtitle,
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  form: { gap: 0 },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  bottomBar: {
    padding: Spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.base,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
