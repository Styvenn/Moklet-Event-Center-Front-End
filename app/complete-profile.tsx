// app/complete-profile.tsx
import React, { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import api, { ApiErrorResponse } from '../services/api';

export interface RawCandidateStudent {
  studentId?: string;
  id?: string;
  name: string;
  className?: string;
  nis?: string;
  angkatan?: string | number;
  isSuggested?: boolean;
  class?: {
    id?: string;
    grade?: string;
    name?: string;
  };
  classId?: string;
}

export interface CandidateStudent {
  id: string;
  name: string;
  nis: string;
  angkatan: string;
  className: string;
  isSuggested: boolean;
}

export function normalizeCandidate(raw: RawCandidateStudent): CandidateStudent {
  const className =
    raw.className ||
    (raw.class ? `${raw.class.grade || ''} ${raw.class.name || ''}`.trim() : '') ||
    'Kelas Tidak Diketahui';

  let angkatan = 'Lainnya';
  if (raw.angkatan !== undefined && raw.angkatan !== null && String(raw.angkatan).trim() !== '') {
    angkatan = String(raw.angkatan).trim();
  } else if (raw.class?.grade) {
    angkatan = String(raw.class.grade).trim();
  } else if (className && className !== 'Kelas Tidak Diketahui') {
    const firstWord = className.trim().split(/\s+/)[0];
    if (firstWord) {
      angkatan = firstWord;
    }
  }

  return {
    id: raw.studentId || raw.id || '',
    name: raw.name || '',
    nis: raw.nis || '-',
    className,
    angkatan,
    isSuggested: Boolean(raw.isSuggested),
  };
}

// ==== Dropdown Component ====
type DropdownFieldProps = {
  label: string;
  placeholder: string;
  options: { label: string; value: string }[];
  value: string;
  onSelect: (val: string, label: string) => void;
  hasError?: boolean;
  disabled?: boolean;
};

function DropdownField({
  label,
  placeholder,
  options,
  value,
  onSelect,
  hasError,
  disabled = false,
}: DropdownFieldProps) {
  const [visible, setVisible] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label || value;

  return (
    <View style={dropStyles.wrapper}>
      <Text style={dropStyles.label}>{label}</Text>
      <TouchableOpacity
        style={[
          dropStyles.trigger,
          hasError ? dropStyles.triggerError : null,
          disabled ? dropStyles.triggerDisabled : null,
        ]}
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <Text style={[dropStyles.triggerText, !value ? dropStyles.placeholder : null]}>
          {selectedLabel || placeholder}
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
            {options.length > 0 ? (
              <FlatList
                data={options}
                keyExtractor={(item, index) => `${item.value}-${index}`}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[dropStyles.option, item.value === value ? dropStyles.optionActive : null]}
                    onPress={() => {
                      onSelect(item.value, item.label);
                      setVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[dropStyles.optionText, item.value === value ? dropStyles.optionTextActive : null]}>
                      {item.label}
                    </Text>
                    {item.value === value && (
                      <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: Colors.textSubtitle }}>Tidak ada opsi tersedia</Text>
              </View>
            )}
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
  triggerDisabled: { backgroundColor: '#F5F5F5', opacity: 0.6 },
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
  const { bindIdentity } = useAuth();

  const [candidates, setCandidates] = useState<CandidateStudent[]>([]);
  const [fetchingCandidates, setFetchingCandidates] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ nama?: boolean; general?: string }>({});

  useEffect(() => {
    async function loadCandidates() {
      setFetchingCandidates(true);
      try {
        const res: any = await api.get('/students/bind-candidates');
        const rawList: RawCandidateStudent[] = Array.isArray(res) ? res : res?.data || [];
        console.log('[DEBUG candidates] rawList =', JSON.stringify(rawList, null, 2));
        const list: CandidateStudent[] = rawList.map(normalizeCandidate).filter((student) => student.id && student.name);

        const uniqueCandidatesMap = new Map<string, CandidateStudent>();
        list.forEach((student) => {
          if (!uniqueCandidatesMap.has(student.id)) {
            uniqueCandidatesMap.set(student.id, student);
          }
        });

        setCandidates(Array.from(uniqueCandidatesMap.values()));
      } catch (err: any) {
        console.warn('Error loading bind candidates:', err);
        setErrors((e) => ({ ...e, general: 'Gagal memuat data kandidat siswa. Pastikan koneksi aman.' }));
      } finally {
        setFetchingCandidates(false);
      }
    }

    loadCandidates();
  }, []);

  const studentOptions = candidates.map((student) => ({
    label: `${student.name} ${student.className ? `- ${student.className}` : ''}`.trim(),
    value: student.id,
  }));

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!selectedStudentId) newErrors.nama = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      await bindIdentity(selectedStudentId);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      const apiErr = err as ApiErrorResponse;
      setErrors({ general: apiErr.formattedMessage || 'Gagal menautkan identitas siswa.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>Lengkapi Profil - Moklet Event Center</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Periksa Data Diri</Text>
        <Text style={styles.subtitle}>Periksa data diri supaya tidak tertukar.</Text>

        {errors.general ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
            <Text style={styles.errorBoxText}>{errors.general}</Text>
          </View>
        ) : null}

        {fetchingCandidates ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.loadingText}>Memuat data siswa...</Text>
          </View>
        ) : (
          <View style={styles.form}>
            
            <DropdownField
              label="Data Siswa"
              placeholder="Pilih Data"
              options={studentOptions}
              value={selectedStudentId}
              onSelect={(val) => {
                setSelectedStudentId(val);
                setErrors((e) => ({ ...e, nama: false, general: undefined }));
              }}
              hasError={errors.nama}
            />
            {errors.nama && <Text style={styles.errorText}>Data siswa wajib dipilih</Text>}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveButton, (loading || fetchingCandidates || !selectedStudentId) ? styles.saveButtonDisabled : null]}
          onPress={handleSave}
          disabled={loading || fetchingCandidates || !selectedStudentId}
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
  headerBar: {
    backgroundColor: '#F2F5F7',
    paddingVertical: 18,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E7EC',
  },
  headerText: {
    color: '#0B2E4A',
    fontSize: 18,
    fontWeight: '700',
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
    marginBottom: Spacing.xl,
  },
  form: { gap: 0 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: Spacing.sm,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSubtitle,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorBoxText: {
    fontSize: 13,
    color: Colors.error,
    flex: 1,
  },
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
