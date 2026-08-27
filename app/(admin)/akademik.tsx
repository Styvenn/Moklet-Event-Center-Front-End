// app/(admin)/akademik.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../constants/theme';
import {
  getClasses,
  createClass,
  deleteClass,
  hideClass,
  ClassItem,
  GradeOption,
} from '../../services/admin/classes.service';
import {
  getSystemSetting,
  updateSystemSetting,
  SystemSetting,
} from '../../services/admin/system-setting.service';
import { useDragToClose } from '../../components/useDragToClose';
import { getErrorMessage } from '../../services/api';

// ─── Helpers: Jurusan & Grade Colors ──────────────────────────────────────────

const GRADE_OPTIONS: GradeOption[] = ['X', 'XI', 'XII'];
const MAJOR_SUGGESTIONS = ['RPL', 'TKJ', 'PG'];

function getGradeColor(grade: string) {
  switch (grade) {
    case 'X':
      return { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9' };
    case 'XI':
      return { bg: '#F3E5F5', text: '#7B1FA2', border: '#CE93D8' };
    case 'XII':
      return { bg: '#FFEBEE', text: '#C62828', border: '#FFCDD2' };
    default:
      return { bg: '#ECEFF1', text: '#455A64', border: '#CFD8DC' };
  }
}

function getMajorFullName(name: string) {
  const upper = name.toUpperCase();
  if (upper.includes('RPL')) return 'Rekayasa Perangkat Lunak';
  if (upper.includes('TKJ')) return 'Teknik Komputer & Jaringan';
  if (upper.includes('PG')) return 'Pengembangan Gim';
  return 'Jurusan';
}

// ─── Modal Tambah Kelas ────────────────────────────────────────────────────────

interface AddClassModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function AddClassModal({ visible, onClose, onSuccess }: AddClassModalProps) {
  const [grade, setGrade] = useState<GradeOption>('X');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setGrade('X');
    setName('');
    setError('');
  };
  const handleClose = () => {
    reset();
    onClose();
  };

  const { translateY, overlayOpacity, panResponder } = useDragToClose(handleClose);

  const handleSubmit = async () => {
    let cleanName = name.trim();
    if (!cleanName) {
      setError('Nama jurusan & rombel wajib diisi (contoh: RPL 1 atau PG 2).');
      return;
    }

    // Bersihkan prefix grade jika user mengetik "X RPL 1"
    const prefixRegex = new RegExp(`^${grade}\\s*[-–—]?\\s*`, 'i');
    if (prefixRegex.test(cleanName)) {
      cleanName = cleanName.replace(prefixRegex, '').trim();
    }

    if (cleanName.length < 2) {
      setError('Nama kelas terlalu pendek. Masukkan jurusan dan nomor rombel (misal: RPL 1).');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await createClass({ grade, name: cleanName });
      reset();
      onSuccess();
    } catch (e: any) {
      setError(getErrorMessage(e, `Gagal menambah kelas. Pastikan kelas ${grade} ${cleanName} belum terdaftar.`));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Backdrop: Ketuk area luar untuk menutup modal */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[ms.overlay, { opacity: overlayOpacity }]} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={ms.sheetContainer}
        pointerEvents="box-none"
      >
        <Animated.View style={[ms.sheet, { transform: [{ translateY }] }]}>
          {/* Draggable Handle */}
          <View {...panResponder.panHandlers} style={ms.handleArea}>
            <View style={ms.handle} />
          </View>

          <View style={ms.sheetHeader}>
            <Text style={ms.sheetTitle}>Tambah Kelas</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#607D8B" />
            </TouchableOpacity>
          </View>

          {/* Grade Selector */}
          <Text style={ms.label}>Tingkat / Grade *</Text>
          <View style={ms.gradeRow}>
            {GRADE_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[ms.gradeBtn, grade === g && ms.gradeBtnActive]}
                onPress={() => setGrade(g)}
              >
                <Text style={[ms.gradeBtnText, grade === g && ms.gradeBtnTextActive]}>
                  Kelas {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nama Kelas */}
          <Text style={ms.label}>Nama Jurusan & Rombel *</Text>
          
          {/* Quick Major Selection Chips */}
          <View style={ms.majorChipsRow}>
            {MAJOR_SUGGESTIONS.map((major) => (
              <TouchableOpacity
                key={major}
                style={[
                  ms.majorChip,
                  name.toUpperCase().startsWith(major) && ms.majorChipActive,
                ]}
                onPress={() => {
                  setName(`${major} 1`);
                  if (error) setError('');
                }}
              >
                <Text
                  style={[
                    ms.majorChipText,
                    name.toUpperCase().startsWith(major) && ms.majorChipTextActive,
                  ]}
                >
                  +{major}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={ms.input}
            placeholder="Contoh: RPL 1, TKJ 2, PG 1"
            placeholderTextColor="#9E9E9E"
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (error) setError('');
            }}
          />
          <Text style={ms.hintText}>
            ℹ Format nama kelas yang akan tersimpan: <Text style={{ fontWeight: '700', color: Colors.primary }}>{grade} {name.trim() || 'PG 1'}</Text>
          </Text>

          {error ? (
            <View style={ms.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.primary} />
              <Text style={ms.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[ms.submitBtn, (loading || !name.trim()) && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={loading || !name.trim()}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={ms.submitBtnText}>Simpan Kelas</Text>}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Modal Konfirmasi Ganti Tahun Ajaran ───────────────────────────────────────

interface ChangeAcademicYearModalProps {
  visible: boolean;
  current?: SystemSetting;
  onClose: () => void;
  onSuccess: (updated: SystemSetting) => void;
}

function ChangeAcademicYearModal({ visible, current, onClose, onSuccess }: ChangeAcademicYearModalProps) {
  const [newYear, setNewYear] = useState('');
  const [newAngkatan, setNewAngkatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill dari nilai saat ini
  useEffect(() => {
    if (visible && current) {
      const parts = current.currentAcademicYear.split('/');
      if (parts.length === 2) {
        const nextStart = parseInt(parts[0]) + 1;
        const nextEnd = parseInt(parts[1]) + 1;
        setNewYear(`${nextStart}/${nextEnd}`);
      } else {
        setNewYear(current.currentAcademicYear);
      }
      setNewAngkatan(String(current.currentTopAngkatan - 1));
    }
  }, [visible, current]);

  const reset = () => {
    setNewYear('');
    setNewAngkatan('');
    setError('');
  };
  const handleClose = () => {
    reset();
    onClose();
  };

  const { translateY, overlayOpacity, panResponder } = useDragToClose(handleClose);

  const handleSubmit = async () => {
    if (!newYear.trim()) {
      setError('Tahun ajaran baru wajib diisi (contoh: 2025/2026).');
      return;
    }
    const angkatanNum = parseInt(newAngkatan);
    if (isNaN(angkatanNum) || angkatanNum < 1) {
      setError('Angkatan tertinggi harus berupa angka valid.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const updated = await updateSystemSetting({
        currentAcademicYear: newYear.trim(),
        currentTopAngkatan: angkatanNum,
      });
      reset();
      onSuccess(updated);
    } catch (e: any) {
      setError(getErrorMessage(e, 'Gagal menyimpan pengaturan tahun ajaran. Coba lagi.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[ms.overlay, { opacity: overlayOpacity }]} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={ms.sheetContainer}
        pointerEvents="box-none"
      >
        <Animated.View style={[ms.sheet, { transform: [{ translateY }] }]}>
          <View {...panResponder.panHandlers} style={ms.handleArea}>
            <View style={ms.handle} />
          </View>
          <View style={ms.sheetHeader}>
            <Text style={ms.sheetTitle}>⚠️ Ganti Tahun Ajaran</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#607D8B" />
            </TouchableOpacity>
          </View>

          {/* Warning Box */}
          <View style={ms.warningBox}>
            <Ionicons name="warning" size={20} color="#B71C1C" />
            <Text style={ms.warningText}>
              Mengganti tahun ajaran akan mempengaruhi data kelas dan siswa aktif. Tindakan ini{' '}
              <Text style={{ fontWeight: '800' }}>tidak bisa dibatalkan</Text>. Pastikan data sudah
              sesuai sebelum melanjutkan.
            </Text>
          </View>

          {/* Tahun Ajaran Sekarang */}
          {current && (
            <View style={ms.currentInfoRow}>
              <Text style={ms.currentInfoLabel}>Saat ini:</Text>
              <Text style={ms.currentInfoValue}>
                {current.currentAcademicYear} • Angkatan {current.currentTopAngkatan}
              </Text>
            </View>
          )}

          {/* Tahun Ajaran Baru */}
          <Text style={ms.label}>Tahun Ajaran Baru *</Text>
          <TextInput
            style={ms.input}
            placeholder="Contoh: 2025/2026"
            placeholderTextColor="#9E9E9E"
            value={newYear}
            onChangeText={setNewYear}
          />

          {/* Angkatan Tertinggi Baru */}
          <Text style={ms.label}>Angkatan Tertinggi Baru *</Text>
          <TextInput
            style={ms.input}
            placeholder="Contoh: 33"
            placeholderTextColor="#9E9E9E"
            keyboardType="numeric"
            value={newAngkatan}
            onChangeText={setNewAngkatan}
          />
          <Text style={ms.hintText}>
            ℹ Angkatan tertinggi = angkatan siswa kelas XII saat ini (contoh: 33).
          </Text>

          {error ? (
            <View style={ms.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.primary} />
              <Text style={ms.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Actions */}
          <View style={ms.btnRow}>
            <TouchableOpacity style={ms.cancelBtn} onPress={handleClose}>
              <Text style={ms.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ms.dangerBtn, loading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={ms.dangerBtnText}>Simpan</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function AkademikScreen() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<'ALL' | GradeOption>('ALL');
  const [systemSetting, setSystemSetting] = useState<SystemSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showChangeYearModal, setShowChangeYearModal] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [classesRes, settingRes] = await Promise.all([
        getClasses(),
        getSystemSetting(),
      ]);
      setClasses(classesRes);
      setSystemSetting(settingRes);
    } catch (e) {
      console.warn('Akademik fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  const handleDeleteClass = (cls: ClassItem) => {
    const studentCount = cls._count?.students ?? cls.studentCount;
    const hasStudents = studentCount !== undefined && studentCount > 0;

    Alert.alert(
      'Hapus Kelas',
      hasStudents
        ? `Kelas "${cls.grade} — ${cls.name}" masih memiliki ${studentCount} siswa aktif.\n\nApakah Anda yakin ingin menghapus kelas ini?`
        : `Yakin ingin menghapus kelas "${cls.grade} — ${cls.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClass(cls.id);
              setClasses((prev) => prev.filter((c) => c.id !== cls.id));
            } catch (e: any) {
              // Jika server menolak penghapusan permanen karena riwayat arsip database
              Alert.alert(
                'Arsip Siswa Terdeteksi di Server',
                `Kelas "${cls.grade} — ${cls.name}" tidak dapat dihapus permanen dari server karena database masih menyimpan arsip riwayat data siswa yang pernah terdaftar di kelas ini.\n\nApakah Anda ingin menyembunyikan kelas ini dari daftar?`,
                [
                  { text: 'Batal', style: 'cancel' },
                  {
                    text: 'Sembunyikan Kelas',
                    style: 'destructive',
                    onPress: async () => {
                      await hideClass(cls.id);
                      setClasses((prev) => prev.filter((c) => c.id !== cls.id));
                    },
                  },
                ]
              );
            }
          },
        },
      ]
    );
  };

  // Filter kelas berdasarkan grade filter aktif
  const filteredClasses = classes.filter((c) => {
    if (selectedGradeFilter === 'ALL') return true;
    return c.grade === selectedGradeFilter;
  });

  const renderClassCard = (cls: ClassItem) => {
    const gradeColor = getGradeColor(cls.grade);
    const majorName = getMajorFullName(cls.name);
    const count = cls._count?.students ?? cls.studentCount ?? 0;

    return (
      <View key={cls.id} style={styles.classCard}>
        {/* Avatar Bulat Standar (seperti Siswa & Panitia) */}
        <View style={[styles.classAvatar, { backgroundColor: gradeColor.bg, borderColor: gradeColor.border }]}>
          <Text style={[styles.classAvatarText, { color: gradeColor.text }]}>{cls.grade}</Text>
        </View>

        {/* Info Kelas */}
        <View style={styles.classInfo}>
          <Text style={styles.className} numberOfLines={1}>
            Kelas {cls.grade} {cls.name}
          </Text>
          <Text style={styles.classMeta}>
            {majorName} • {count > 0 ? `${count} siswa terdaftar` : 'Belum ada siswa'}
          </Text>
        </View>

        {/* Student Count Badge */}
        <View style={[styles.countBadge, count > 0 ? styles.countBadgeActive : styles.countBadgeEmpty]}>
          <Ionicons
            name="people-outline"
            size={13}
            color={count > 0 ? '#2E7D32' : '#757575'}
          />
          <Text style={[styles.countBadgeText, count > 0 ? styles.countBadgeActiveText : styles.countBadgeEmptyText]}>
            {count}
          </Text>
        </View>

        {/* Action Delete */}
        <TouchableOpacity
          style={styles.classDeleteBtn}
          onPress={() => handleDeleteClass(cls)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color="#EF5350" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Akademik</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* System Setting Card */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View>
              <Text style={styles.settingSub}>Angkatan Tertinggi (Kelas XII)</Text>
              <Text style={styles.settingAngkatan}>
                Angkatan {systemSetting?.currentTopAngkatan ?? '—'}
              </Text>
            </View>
            <View style={styles.settingBadge}>
              <Text style={styles.settingBadgeText}>
                {systemSetting?.currentAcademicYear ?? '—'}
              </Text>
            </View>
          </View>

          <Text style={styles.settingUpdated}>
            Terakhir diperbarui:{' '}
            {systemSetting?.updatedAt
              ? new Date(systemSetting.updatedAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : '—'}
          </Text>

          <TouchableOpacity
            style={styles.changeYearBtn}
            onPress={() => setShowChangeYearModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="warning-outline" size={16} color="#B71C1C" />
            <Text style={styles.changeYearBtnText}>Ganti Tahun Ajaran / Naik Kelas</Text>
          </TouchableOpacity>
        </View>

        {/* Kelola Kelas Header */}
        <View style={styles.classesSectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Kelola Kelas</Text>
            <Text style={styles.sectionSub}>{classes.length} kelas terdaftar di sistem</Text>
          </View>
          <TouchableOpacity
            style={styles.addClassBtn}
            onPress={() => setShowAddClassModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addClassBtnText}>Tambah Kelas</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tingkat (Grade Tabs) */}
        <View style={styles.filterTabsRow}>
          {(['ALL', 'X', 'XI', 'XII'] as const).map((filterKey) => (
            <TouchableOpacity
              key={filterKey}
              style={[
                styles.filterTab,
                selectedGradeFilter === filterKey && styles.filterTabActive,
              ]}
              onPress={() => setSelectedGradeFilter(filterKey)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedGradeFilter === filterKey && styles.filterTabTextActive,
                ]}
              >
                {filterKey === 'ALL' ? 'Semua' : `Kelas ${filterKey}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>Memuat data kelas...</Text>
          </View>
        ) : filteredClasses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={56} color="#BDBDBD" />
            <Text style={styles.emptyTitle}>
              {selectedGradeFilter === 'ALL'
                ? 'Belum ada kelas terdaftar'
                : `Belum ada kelas ${selectedGradeFilter}`}
            </Text>
            <Text style={styles.emptySubtitle}>
              Ketuk tombol "Tambah Kelas" di atas untuk membuat kelas baru.
            </Text>
          </View>
        ) : (
          <View style={styles.classList}>{filteredClasses.map(renderClassCard)}</View>
        )}
      </ScrollView>

      {/* Modals */}
      <AddClassModal
        visible={showAddClassModal}
        onClose={() => setShowAddClassModal(false)}
        onSuccess={() => {
          setShowAddClassModal(false);
          fetchAll();
        }}
      />

      <ChangeAcademicYearModal
        visible={showChangeYearModal}
        current={systemSetting || undefined}
        onClose={() => setShowChangeYearModal(false)}
        onSuccess={(updated) => {
          setSystemSetting(updated);
          setShowChangeYearModal(false);
          fetchAll();
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: Platform.OS === 'android' ? 36 : 0,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 40,
  },
  settingCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  settingSub: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
  },
  settingAngkatan: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1E1E',
    marginTop: 2,
  },
  settingBadge: {
    backgroundColor: '#FFEBEE',
    borderRadius: Radius.round,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  settingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B71C1C',
  },
  settingUpdated: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: Spacing.sm,
  },
  changeYearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  changeYearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B71C1C',
  },
  classesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  sectionSub: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  addClassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.round,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  addClassBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: Spacing.md,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.round,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#616161',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  classList: {
    gap: Spacing.sm,
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  classAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  classAvatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  classInfo: {
    flex: 1,
    gap: 3,
  },
  className: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  classMeta: {
    fontSize: 12,
    color: '#757575',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.round,
  },
  countBadgeActive: {
    backgroundColor: '#E8F5E9',
  },
  countBadgeEmpty: {
    backgroundColor: '#F5F5F5',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  countBadgeActiveText: {
    color: '#2E7D32',
  },
  countBadgeEmptyText: {
    color: '#757575',
  },
  classDeleteBtn: {
    padding: 8,
    borderRadius: Radius.md,
  },
  loaderBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loaderText: {
    color: '#757575',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#616161',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

// Modal styles
const ms = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.base,
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: -8,
    marginHorizontal: -Spacing.base,
  },
  handle: {
    width: 44,
    height: 5,
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
    marginTop: 4,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#424242',
    marginTop: Spacing.md,
    marginBottom: 6,
  },
  gradeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  gradeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  gradeBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFEBEE',
  },
  gradeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
  },
  gradeBtnTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  majorChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  majorChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.round,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  majorChipActive: {
    backgroundColor: '#FFEBEE',
    borderColor: Colors.primary,
  },
  majorChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  majorChipTextActive: {
    color: Colors.primary,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 14,
    color: '#1E1E1E',
  },
  hintText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 6,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#B71C1C',
    lineHeight: 18,
  },
  currentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F5F5',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  currentInfoLabel: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
  },
  currentInfoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFEBEE',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  errorText: {
    flex: 1,
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: 16,
    alignItems: 'center',
    marginTop: Spacing.base,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.base,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#757575',
    fontWeight: '700',
    fontSize: 15,
  },
  dangerBtn: {
    flex: 1,
    backgroundColor: '#B71C1C',
    padding: 16,
    borderRadius: Radius.xl,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
