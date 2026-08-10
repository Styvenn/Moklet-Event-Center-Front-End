// app/(admin)/siswa.tsx
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../constants/theme';
import {
  getStudents,
  createStudent,
  deleteStudent,
  importStudentsExcel,
  StudentItem,
} from '../../services/admin/students.service';
import { getClasses, ClassItem, GradeOption } from '../../services/admin/classes.service';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#EF9A9A', '#CE93D8', '#90CAF9', '#A5D6A7', '#FFE082', '#FFAB91'];
function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// ─── Modal Tambah Siswa ────────────────────────────────────────────────────────

interface AddStudentModalProps {
  visible: boolean;
  classes: ClassItem[];
  onClose: () => void;
  onSuccess: () => void;
}

function AddStudentModal({ visible, classes, onClose, onSuccess }: AddStudentModalProps) {
  const [name, setName] = useState('');
  const [nis, setNis] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [angkatan, setAngkatan] = useState(''); // TODO(backend gap #3): state lokal saja
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showClassPicker, setShowClassPicker] = useState(false);

  const reset = () => {
    setName(''); setNis(''); setSelectedClassId(''); setAngkatan('');
    setError(''); setShowClassPicker(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Nama siswa wajib diisi.'); return; }
    if (!nis.trim()) { setError('NIS wajib diisi.'); return; }
    if (!selectedClassId) { setError('Pilih kelas terlebih dahulu.'); return; }

    setLoading(true);
    setError('');
    try {
      await createStudent({ name: name.trim(), nis: nis.trim(), classId: selectedClassId });
      reset();
      onSuccess();
    } catch (e: any) {
      setError(e?.message || 'Gagal menambah siswa. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={ms.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%' }}
        >
          <View style={ms.sheet}>
            {/* Handle */}
            <View style={ms.handle} />

            {/* Header */}
            <View style={ms.sheetHeader}>
              <Text style={ms.sheetTitle}>Tambah Siswa</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color="#607D8B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Nama */}
              <Text style={ms.label}>Nama Lengkap *</Text>
              <TextInput
                style={ms.input}
                placeholder="Contoh: Budi Santoso"
                placeholderTextColor="#9E9E9E"
                value={name}
                onChangeText={setName}
              />

              {/* NIS */}
              <Text style={ms.label}>NIS *</Text>
              <TextInput
                style={ms.input}
                placeholder="Contoh: 2223456789"
                placeholderTextColor="#9E9E9E"
                keyboardType="numeric"
                value={nis}
                onChangeText={setNis}
              />

              {/* Angkatan — TODO(backend gap #3) */}
              <View style={ms.labelRow}>
                <Text style={ms.label}>Angkatan</Text>
                <View style={ms.pendingBadge}>
                  <Text style={ms.pendingBadgeText}>Menunggu update backend</Text>
                </View>
              </View>
              <TextInput
                style={[ms.input, ms.inputDisabled]}
                placeholder="Contoh: 2022 (belum tersimpan ke server)"
                placeholderTextColor="#BDBDBD"
                keyboardType="numeric"
                value={angkatan}
                onChangeText={setAngkatan}
                editable
              />
              <Text style={ms.hintText}>
                ⓘ Field ini disimpan sementara di device; akan dikirim ke server setelah backend mendukungnya.
              </Text>

              {/* Kelas */}
              <Text style={ms.label}>Kelas *</Text>
              <TouchableOpacity
                style={ms.pickerBtn}
                onPress={() => setShowClassPicker((v) => !v)}
              >
                <Text style={selectedClass ? ms.pickerBtnText : ms.pickerBtnPlaceholder}>
                  {selectedClass ? `${selectedClass.grade} - ${selectedClass.name}` : 'Pilih Kelas...'}
                </Text>
                <Ionicons
                  name={showClassPicker ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#9E9E9E"
                />
              </TouchableOpacity>

              {showClassPicker && (
                <View style={ms.classList}>
                  {classes.length === 0 ? (
                    <Text style={ms.classEmpty}>Belum ada kelas. Tambah kelas di menu Akademik.</Text>
                  ) : (
                    classes.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          ms.classOption,
                          c.id === selectedClassId && ms.classOptionActive,
                        ]}
                        onPress={() => { setSelectedClassId(c.id); setShowClassPicker(false); }}
                      >
                        <Text
                          style={[
                            ms.classOptionText,
                            c.id === selectedClassId && ms.classOptionTextActive,
                          ]}
                        >
                          {c.grade} — {c.name}
                        </Text>
                        {c.id === selectedClassId && (
                          <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {error ? <Text style={ms.errorText}>{error}</Text> : null}
            </ScrollView>

            {/* Submit */}
            <TouchableOpacity
              style={[ms.submitBtn, loading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={ms.submitBtnText}>Simpan Siswa</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Modal Upload Excel ────────────────────────────────────────────────────────

interface UploadExcelModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function UploadExcelModal({ visible, onClose, onSuccess }: UploadExcelModalProps) {
  const [file, setFile] = useState<{ uri: string; name: string; mimeType: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ successCount?: number; failedCount?: number; message?: string } | null>(null);

  const reset = () => { setFile(null); setError(''); setResult(null); };
  const handleClose = () => { reset(); onClose(); };

  const pickFile = async () => {
    try {
      const DocumentPicker = require('expo-document-picker');
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
      });
      if (!picked.canceled && picked.assets?.length > 0) {
        const asset = picked.assets[0];
        setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType || 'application/octet-stream' });
        setError('');
        setResult(null);
      }
    } catch (e: any) {
      setError('Gagal membuka file picker.');
    }
  };

  const handleUpload = async () => {
    if (!file) { setError('Pilih file Excel terlebih dahulu.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await importStudentsExcel(file.uri, file.name, file.mimeType);
      setResult(res);
    } catch (e: any) {
      setError(e?.message || 'Gagal mengupload file. Pastikan format file Excel (.xlsx) benar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={ms.overlay}>
        <View style={ms.sheet}>
          <View style={ms.handle} />
          <View style={ms.sheetHeader}>
            <Text style={ms.sheetTitle}>Upload Data Siswa (Excel)</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#607D8B" />
            </TouchableOpacity>
          </View>

          {result ? (
            // Tampilkan hasil import
            <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
              <Ionicons
                name={result.failedCount ? 'warning-outline' : 'checkmark-circle-outline'}
                size={64}
                color={result.failedCount ? '#F57F17' : '#2E7D32'}
              />
              <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 12, color: '#1E1E1E' }}>
                Import Selesai
              </Text>
              {result.successCount !== undefined && (
                <Text style={{ marginTop: 8, color: '#2E7D32', fontSize: 14 }}>
                  ✅ Berhasil: {result.successCount} siswa
                </Text>
              )}
              {result.failedCount !== undefined && result.failedCount > 0 && (
                <Text style={{ marginTop: 4, color: '#C62828', fontSize: 14 }}>
                  ❌ Gagal: {result.failedCount} data
                </Text>
              )}
              {result.message && (
                <Text style={{ marginTop: 8, color: '#757575', fontSize: 13 }}>{result.message}</Text>
              )}
              <TouchableOpacity
                style={[ms.submitBtn, { marginTop: Spacing.xl }]}
                onPress={() => { reset(); onSuccess(); }}
              >
                <Text style={ms.submitBtnText}>Selesai</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={us.filePicker}
                onPress={pickFile}
                activeOpacity={0.85}
              >
                <Ionicons name="cloud-upload-outline" size={40} color={Colors.primary} />
                <Text style={us.filePickerText}>
                  {file ? file.name : 'Ketuk untuk pilih file Excel (.xlsx)'}
                </Text>
                {file && (
                  <Text style={{ fontSize: 11, color: '#757575', marginTop: 2 }}>Ketuk lagi untuk ganti file</Text>
                )}
              </TouchableOpacity>

              <View style={us.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color="#1565C0" />
                <Text style={us.infoText}>
                  Pastikan file menggunakan format yang disediakan. Kolom: nama, nis, kelas.
                </Text>
              </View>

              {error ? <Text style={ms.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[ms.submitBtn, (!file || loading) && { opacity: 0.5 }]}
                onPress={handleUpload}
                disabled={!file || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={ms.submitBtnText}>Upload & Import</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function SiswaScreen() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchAll = useCallback(async () => {
    const [studentsResult, classesResult] = await Promise.allSettled([
      getStudents(1, 100),
      getClasses(),
    ]);

    if (studentsResult.status === 'fulfilled') {
      setStudents(studentsResult.value.data);
    } else {
      console.warn('Gagal memuat data siswa:', studentsResult.reason);
    }

    if (classesResult.status === 'fulfilled') {
      setClasses(classesResult.value);
    } else {
      console.warn('Gagal memuat data kelas:', classesResult.reason);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  // Client-side search filter — TODO(backend gap #4): ganti ke server-side setelah backend mendukung ?search=
  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.nis?.toLowerCase().includes(q) ||
      s.class?.name.toLowerCase().includes(q)
    );
  });

  const handleDelete = (student: StudentItem) => {
    Alert.alert(
      'Hapus Siswa',
      `Yakin ingin menghapus "${student.name}"? Tindakan ini tidak dapat dibatalkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudent(student.id);
              setStudents((prev) => prev.filter((s) => s.id !== student.id));
            } catch (e: any) {
              Alert.alert('Gagal', e?.message || 'Tidak dapat menghapus siswa.');
            }
          },
        },
      ]
    );
  };

  const renderStudent = ({ item }: { item: StudentItem }) => {
    const initials = item.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    const color = avatarColor(item.name);
    const kelasLabel = item.class ? `${item.class.grade} — ${item.class.name}` : 'Kelas belum diset';

    return (
      <View style={styles.studentCard}>
        <View style={[styles.studentAvatar, { backgroundColor: color }]}>
          <Text style={styles.studentAvatarText}>{initials}</Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.studentMeta}>{item.nis || '—'} • {kelasLabel}</Text>
        </View>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleDelete(item)}
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
        <Text style={styles.headerTitle}>Data Siswa</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setShowUploadModal(true)}
          >
            <Ionicons name="cloud-upload-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerActionBtn, styles.headerAddBtn]}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#9E9E9E" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama, NIS, atau kelas..."
          placeholderTextColor="#9E9E9E"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#BDBDBD" />
          </TouchableOpacity>
        )}
      </View>

      {/* Note: filter client-side */}
      <Text style={styles.searchNote}>
        {/* TODO(backend gap #4): search server-side belum tersedia */}
        {students.length > 0 && search.length > 0
          ? `${filtered.length} dari ${students.length} siswa`
          : `${students.length} siswa terdaftar`}
      </Text>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Memuat data siswa...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderStudent}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={56} color="#BDBDBD" />
              <Text style={styles.emptyText}>
                {search ? 'Tidak ada siswa yang cocok dengan pencarian.' : 'Belum ada data siswa.'}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
        />
      )}

      {/* Modals */}
      <AddStudentModal
        visible={showAddModal}
        classes={classes}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchAll();
        }}
      />
      <UploadExcelModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          setShowUploadModal(false);
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAddBtn: {
    backgroundColor: Colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E1E1E',
  },
  searchNote: {
    fontSize: 12,
    color: '#9E9E9E',
    marginHorizontal: Spacing.base,
    marginTop: 6,
    marginBottom: 2,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: '#757575',
  },
  listContent: {
    padding: Spacing.base,
    paddingBottom: 32,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    gap: Spacing.md,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  studentAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  studentInfo: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  studentMeta: {
    fontSize: 12,
    color: '#757575',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

// Modal styles
const ms = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.base,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    marginTop: Spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#424242',
    marginTop: Spacing.md,
    marginBottom: 6,
  },
  pendingBadge: {
    backgroundColor: '#FFF9C4',
    borderRadius: Radius.round,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#F9A825',
  },
  pendingBadgeText: {
    fontSize: 10,
    color: '#F57F17',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 14,
    color: '#1E1E1E',
  },
  inputDisabled: {
    borderWidth: 1,
    borderColor: '#FFF9C4',
    backgroundColor: '#FFFDE7',
  },
  hintText: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 4,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  pickerBtn: {
    backgroundColor: '#F5F5F5',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerBtnText: { fontSize: 14, color: '#1E1E1E' },
  pickerBtnPlaceholder: { fontSize: 14, color: '#9E9E9E' },
  classList: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 4,
    maxHeight: 200,
    overflow: 'hidden',
  },
  classEmpty: {
    padding: Spacing.md,
    color: '#9E9E9E',
    fontSize: 13,
    textAlign: 'center',
  },
  classOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  classOptionActive: { backgroundColor: Colors.primaryLight },
  classOptionText: { fontSize: 14, color: '#424242' },
  classOptionTextActive: { color: Colors.primary, fontWeight: '600' },
  errorText: {
    color: Colors.primary,
    fontSize: 13,
    marginTop: Spacing.md,
    textAlign: 'center',
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
});

// Upload modal extra styles
const us = StyleSheet.create({
  filePicker: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginVertical: Spacing.base,
    gap: 12,
  },
  filePickerText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1565C0',
    lineHeight: 18,
  },
});
