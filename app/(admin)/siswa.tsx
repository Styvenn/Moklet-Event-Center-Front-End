// app/(admin)/siswa.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { cacheTime, queryKeys } from '../../constants/query';
import {
  getStudents,
  createStudent,
  deleteStudent,
  importStudentsExcel,
  bindManualStudent,
  exportStudentsForPromotion,
  importStudentsPromotion,
  previewRosterSync,
  executeRosterSync,
  StudentItem,
  CreateStudentDto,
  RosterSyncPreviewResult,
} from '../../services/admin/students.service';
import { getClasses, ClassItem } from '../../services/admin/classes.service';
import { getErrorMessage } from '../../services/api';
import { useDragToClose } from '../../components/useDragToClose';

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
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [nis, setNis] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [error, setError] = useState('');
  const [showClassPicker, setShowClassPicker] = useState(false);

  const reset = () => {
    setName('');
    setNis('');
    setSelectedClassId('');
    setError('');
    setShowClassPicker(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const { translateY, overlayOpacity, panResponder } = useDragToClose(handleClose);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  // TanStack Query Mutation untuk tambah siswa
  const addStudentMutation = useMutation({
    mutationFn: (dto: CreateStudentDto) => createStudent(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStudents });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
      reset();
      onSuccess();
    },
    onError: (e: any) => {
      console.error('[AddStudentModal] Error response received:', e?.response?.data || e);
      const specificError = getErrorMessage(e, 'Gagal menambah siswa. Pastikan NIS belum terdaftar di sistem.');
      setError(specificError);
    },
  });

  const handleSubmit = async () => {
    const cleanName = name.trim();
    const cleanNis = nis.trim();

    if (!cleanName) {
      setError('Nama lengkap siswa wajib diisi.');
      return;
    }
    if (!cleanNis) {
      setError('NIS siswa wajib diisi.');
      return;
    }
    if (!/^\d+$/.test(cleanNis)) {
      setError('NIS hanya boleh berisi angka (contoh: 2223456789).');
      return;
    }
    if (cleanNis.length < 4) {
      setError('NIS minimal terdiri dari 4 digit angka.');
      return;
    }
    if (!selectedClassId) {
      setError('Silakan pilih kelas terlebih dahulu.');
      return;
    }

    setError('');
    addStudentMutation.mutate({ name: cleanName, nis: cleanNis, classId: selectedClassId });
  };

  const loading = addStudentMutation.isPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[ms.overlay, { opacity: overlayOpacity }]} />
      </TouchableWithoutFeedback>

      {/* Sheet container */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={ms.sheetContainer}
        pointerEvents="box-none"
      >
        <Animated.View style={[ms.sheet, { transform: [{ translateY }] }]}>
          {/* Handle — draggable */}
          <View {...panResponder.panHandlers} style={ms.handleArea}>
            <View style={ms.handle} />
          </View>

          {/* Header */}
          <View style={ms.sheetHeader}>
            <Text style={ms.sheetTitle}>Tambah Siswa</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#607D8B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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

            {error ? (
              <View style={ms.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color={Colors.primary} />
                <Text style={ms.errorText}>{error}</Text>
              </View>
            ) : null}
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
        </Animated.View>
      </KeyboardAvoidingView>
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

  const { translateY, overlayOpacity, panResponder } = useDragToClose(handleClose);

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
      setError(getErrorMessage(e, 'Gagal mengupload file. Pastikan format file Excel (.xlsx) benar.'));
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
      <View style={ms.sheetContainer} pointerEvents="box-none">
        <Animated.View style={[ms.sheet, { transform: [{ translateY }] }]}>
          <View {...panResponder.panHandlers} style={ms.handleArea}>
            <View style={ms.handle} />
          </View>
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
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Modal Manual Bind ─────────────────────────────────────────────────────────

interface BindManualModalProps {
  visible: boolean;
  student: StudentItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

function BindManualModal({ visible, student, onClose, onSuccess }: BindManualModalProps) {
  const queryClient = useQueryClient();
  const [accountIdentifier, setAccountIdentifier] = useState('');
  const [error, setError] = useState('');

  const reset = () => { setAccountIdentifier(''); setError(''); };
  const handleClose = () => { reset(); onClose(); };

  const { translateY, overlayOpacity, panResponder } = useDragToClose(handleClose);

  const bindMutation = useMutation({
    mutationFn: (dto: { accountId?: string; email?: string }) => bindManualStudent(student!.id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStudents });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
      Alert.alert('Sukses', `Berhasil menautkan akun ke siswa ${student?.name}`);
      reset();
      onSuccess();
    },
    onError: (e: any) => {
      setError(getErrorMessage(e, 'Gagal melakukan manual bind akun siswa.'));
    },
  });

  const handleBind = () => {
    if (!student) return;
    const cleanId = accountIdentifier.trim();
    if (!cleanId) {
      setError('Masukkan Email atau ID Akun pengguna.');
      return;
    }
    setError('');
    const isEmail = cleanId.includes('@');
    bindMutation.mutate(isEmail ? { email: cleanId } : { accountId: cleanId });
  };

  const loading = bindMutation.isPending;

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[ms.overlay, { opacity: overlayOpacity }]} />
      </TouchableWithoutFeedback>
      <View style={ms.sheetContainer} pointerEvents="box-none">
        <Animated.View style={[ms.sheet, { transform: [{ translateY }] }]}>
          <View {...panResponder.panHandlers} style={ms.handleArea}>
            <View style={ms.handle} />
          </View>
          <View style={ms.sheetHeader}>
            <Text style={ms.sheetTitle}>Bind Manual Akun Siswa</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#607D8B" />
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 13, color: '#616161', marginBottom: 12 }}>
            Siswa: <Text style={{ fontWeight: '700', color: '#1E1E1E' }}>{student?.name}</Text> ({student?.nis || '-'})
          </Text>

          <Text style={ms.label}>Email atau ID Akun Target *</Text>
          <TextInput
            style={ms.input}
            placeholder="Contoh: user@smktelkom-mlg.sch.id"
            placeholderTextColor="#9E9E9E"
            value={accountIdentifier}
            onChangeText={setAccountIdentifier}
            autoCapitalize="none"
          />

          {error ? (
            <View style={ms.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.primary} />
              <Text style={ms.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[ms.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleBind}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={ms.submitBtnText}>Tautkan Akun</Text>}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Modal Promosi Kelas ───────────────────────────────────────────────────────

interface PromotionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function PromotionModal({ visible, onClose, onSuccess }: PromotionModalProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<{ uri: string; name: string; mimeType: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const reset = () => { setFile(null); setError(''); setResult(null); };
  const handleClose = () => { reset(); onClose(); };

  const { translateY, overlayOpacity, panResponder } = useDragToClose(handleClose);

  const importPromotionMutation = useMutation({
    mutationFn: (fileData: { uri: string; name: string; mimeType: string }) =>
      importStudentsPromotion(fileData.uri, fileData.name, fileData.mimeType),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStudents });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
      setResult(res);
    },
    onError: (e: any) => {
      setError(getErrorMessage(e, 'Gagal mengimpor promosi kelas.'));
    },
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportStudentsForPromotion();
    } catch (e: any) {
      Alert.alert('Gagal Export', getErrorMessage(e, 'Gagal mengunduh file promosi kelas.'));
    } finally {
      setExporting(false);
    }
  };

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
      }
    } catch (e: any) {
      setError('Gagal memilih file Excel.');
    }
  };

  const handleImportPromotion = () => {
    if (!file) { setError('Pilih file Excel promosi terlebih dahulu.'); return; }
    setError('');
    importPromotionMutation.mutate(file);
  };

  const loading = importPromotionMutation.isPending;

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[ms.overlay, { opacity: overlayOpacity }]} />
      </TouchableWithoutFeedback>
      <View style={ms.sheetContainer} pointerEvents="box-none">
        <Animated.View style={[ms.sheet, { transform: [{ translateY }] }]}>
          <View {...panResponder.panHandlers} style={ms.handleArea}>
            <View style={ms.handle} />
          </View>
          <View style={ms.sheetHeader}>
            <Text style={ms.sheetTitle}>Promosi Kelas Siswa</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#607D8B" />
            </TouchableOpacity>
          </View>

          {result ? (
            <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#2E7D32" />
              <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 12, color: '#1E1E1E' }}>
                Import Promosi Selesai
              </Text>
              {result.message && (
                <Text style={{ marginTop: 8, color: '#757575', fontSize: 13, textAlign: 'center' }}>
                  {result.message}
                </Text>
              )}
              <TouchableOpacity style={[ms.submitBtn, { marginTop: Spacing.xl, width: '100%' }]} onPress={() => { reset(); onSuccess(); }}>
                <Text style={ms.submitBtnText}>Selesai</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Export Section */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#E8F5E9',
                  padding: 14,
                  borderRadius: Radius.lg,
                  marginBottom: Spacing.md,
                  gap: 12,
                }}
                onPress={handleExport}
                disabled={exporting}
              >
                <Ionicons name="download-outline" size={24} color="#2E7D32" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#1B5E20' }}>Ekspor Data Promosi</Text>
                  <Text style={{ fontSize: 12, color: '#388E3C' }}>Unduh spreadsheet data kenaikan kelas</Text>
                </View>
                {exporting ? <ActivityIndicator size="small" color="#2E7D32" /> : <Ionicons name="chevron-forward" size={18} color="#2E7D32" />}
              </TouchableOpacity>

              {/* Import Section */}
              <Text style={ms.label}>Upload File Excel Promosi Kelas</Text>
              <TouchableOpacity style={us.filePicker} onPress={pickFile} activeOpacity={0.85}>
                <Ionicons name="cloud-upload-outline" size={36} color={Colors.primary} />
                <Text style={us.filePickerText}>{file ? file.name : 'Ketuk untuk pilih file Excel (.xlsx)'}</Text>
              </TouchableOpacity>

              {error ? (
                <View style={ms.errorBox}>
                  <Ionicons name="alert-circle-outline" size={18} color={Colors.primary} />
                  <Text style={ms.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[ms.submitBtn, (!file || loading) && { opacity: 0.5 }]}
                onPress={handleImportPromotion}
                disabled={!file || loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={ms.submitBtnText}>Eksekusi Import Promosi</Text>}
              </TouchableOpacity>
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Modal Roster Sync ─────────────────────────────────────────────────────────

interface SyncRosterModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function SyncRosterModal({ visible, onClose, onSuccess }: SyncRosterModalProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<{ uri: string; name: string; mimeType: string } | null>(null);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState<RosterSyncPreviewResult | null>(null);
  const [execResult, setExecResult] = useState<any>(null);

  const reset = () => { setFile(null); setError(''); setPreviewData(null); setExecResult(null); };
  const handleClose = () => { reset(); onClose(); };

  const { translateY, overlayOpacity, panResponder } = useDragToClose(handleClose);

  const previewMutation = useMutation({
    mutationFn: (fileData: { uri: string; name: string; mimeType: string }) =>
      previewRosterSync(fileData.uri, fileData.name, fileData.mimeType),
    onSuccess: (res) => {
      setPreviewData(res);
    },
    onError: (e: any) => {
      setError(getErrorMessage(e, 'Gagal memproses preview roster sync.'));
    },
  });

  const executeMutation = useMutation({
    mutationFn: (data?: any) => executeRosterSync(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStudents });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
      setExecResult(res);
    },
    onError: (e: any) => {
      setError(getErrorMessage(e, 'Gagal mengeksekusi roster sync.'));
    },
  });

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
        setPreviewData(null);
      }
    } catch (e: any) {
      setError('Gagal membuka file picker.');
    }
  };

  const handlePreview = () => {
    if (!file) { setError('Pilih file Excel roster terlebih dahulu.'); return; }
    setError('');
    previewMutation.mutate(file);
  };

  const handleExecute = () => {
    setError('');
    executeMutation.mutate(previewData);
  };

  const loading = previewMutation.isPending;
  const executing = executeMutation.isPending;

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[ms.overlay, { opacity: overlayOpacity }]} />
      </TouchableWithoutFeedback>
      <View style={ms.sheetContainer} pointerEvents="box-none">
        <Animated.View style={[ms.sheet, { transform: [{ translateY }] }]}>
          <View {...panResponder.panHandlers} style={ms.handleArea}>
            <View style={ms.handle} />
          </View>
          <View style={ms.sheetHeader}>
            <Text style={ms.sheetTitle}>Sync Roster Siswa</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#607D8B" />
            </TouchableOpacity>
          </View>

          {execResult ? (
            <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#2E7D32" />
              <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 12, color: '#1E1E1E' }}>
                Roster Sync Berhasil
              </Text>
              {execResult.message && (
                <Text style={{ marginTop: 8, color: '#757575', fontSize: 13, textAlign: 'center' }}>
                  {execResult.message}
                </Text>
              )}
              <TouchableOpacity style={[ms.submitBtn, { marginTop: Spacing.xl, width: '100%' }]} onPress={() => { reset(); onSuccess(); }}>
                <Text style={ms.submitBtnText}>Selesai</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={us.filePicker} onPress={pickFile} activeOpacity={0.85}>
                <Ionicons name="sync-outline" size={36} color={Colors.primary} />
                <Text style={us.filePickerText}>{file ? file.name : 'Pilih File Roster Excel (.xlsx)'}</Text>
              </TouchableOpacity>

              {error ? (
                <View style={ms.errorBox}>
                  <Ionicons name="alert-circle-outline" size={18} color={Colors.primary} />
                  <Text style={ms.errorText}>{error}</Text>
                </View>
              ) : null}

              {!previewData ? (
                <TouchableOpacity
                  style={[ms.submitBtn, (!file || loading) && { opacity: 0.5 }]}
                  onPress={handlePreview}
                  disabled={!file || loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={ms.submitBtnText}>Preview Sync Roster</Text>}
                </TouchableOpacity>
              ) : (
                <View style={{ marginTop: 12, gap: 12 }}>
                  <View style={{ backgroundColor: '#F5F5F5', padding: 14, borderRadius: Radius.lg, gap: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1E1E' }}>Ringkasan Preview:</Text>
                    <Text style={{ fontSize: 13, color: '#2E7D32' }}>➕ Siswa Baru: {previewData.added ?? 0}</Text>
                    <Text style={{ fontSize: 13, color: '#0288D1' }}>🔄 Update Data: {previewData.updated ?? 0}</Text>
                    <Text style={{ fontSize: 13, color: '#E65100' }}>🎓 Siswa Lulus: {previewData.graduated ?? 0}</Text>
                  </View>

                  <TouchableOpacity
                    style={[ms.submitBtn, executing && { opacity: 0.5 }]}
                    onPress={handleExecute}
                    disabled={executing}
                  >
                    {executing ? <ActivityIndicator color="#fff" /> : <Text style={ms.submitBtnText}>Eksekusi Sync Roster</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function SiswaScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showSyncRosterModal, setShowSyncRosterModal] = useState(false);
  const [bindTargetStudent, setBindTargetStudent] = useState<StudentItem | null>(null);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: queryKeys.adminStudents,
    staleTime: cacheTime.warm,
    queryFn: async () => {
      const [studentsResult, classesResult] = await Promise.allSettled([
        getStudents(1, 100),
        getClasses(),
      ]);

      return {
        students:
          studentsResult.status === 'fulfilled' ? studentsResult.value.data : [],
        totalFromServer:
          studentsResult.status === 'fulfilled' ? studentsResult.value.meta.total : 0,
        classes: classesResult.status === 'fulfilled' ? classesResult.value : [],
      };
    },
  });

  const students = data?.students || [];
  const classes = data?.classes || [];
  const totalFromServer = data?.totalFromServer ?? 0;

  const invalidateStudentData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStudents }),
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats }),
    ]);
  };

  const onRefresh = () => refetch();

  // Client-side search filter
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
              await invalidateStudentData();
            } catch (e: any) {
              Alert.alert('Gagal', getErrorMessage(e, 'Tidak dapat menghapus data siswa.'));
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.studentName} numberOfLines={1}>{item.name}</Text>
            {item.account && (
              <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#2E7D32' }}>Bound</Text>
              </View>
            )}
          </View>
          <Text style={styles.studentMeta}>{item.nis || '—'} • {kelasLabel}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: item.account ? '#E8F5E9' : '#FFF3E0' }]}
            onPress={() => setBindTargetStudent(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={item.account ? 'link' : 'link-outline'}
              size={18}
              color={item.account ? '#2E7D32' : '#E65100'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleDelete(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color="#EF5350" />
          </TouchableOpacity>
        </View>
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
            onPress={() => setShowPromotionModal(true)}
          >
            <Ionicons name="trending-up-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setShowSyncRosterModal(true)}
          >
            <Ionicons name="sync-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setShowUploadModal(true)}
          >
            <Ionicons name="cloud-upload-outline" size={20} color={Colors.primary} />
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

      <Text style={styles.searchNote}>
        {search.length > 0
          ? `${filtered.length} dari ${totalFromServer} siswa`
          : `${totalFromServer} siswa terdaftar`}
      </Text>

      {isLoading ? (
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
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[Colors.primary]} />
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
          invalidateStudentData();
        }}
      />
      <UploadExcelModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          setShowUploadModal(false);
          invalidateStudentData();
        }}
      />
      <BindManualModal
        visible={Boolean(bindTargetStudent)}
        student={bindTargetStudent}
        onClose={() => setBindTargetStudent(null)}
        onSuccess={() => {
          setBindTargetStudent(null);
          invalidateStudentData();
        }}
      />
      <PromotionModal
        visible={showPromotionModal}
        onClose={() => setShowPromotionModal(false)}
        onSuccess={() => {
          setShowPromotionModal(false);
          invalidateStudentData();
        }}
      />
      <SyncRosterModal
        visible={showSyncRosterModal}
        onClose={() => setShowSyncRosterModal(false)}
        onSuccess={() => {
          setShowSyncRosterModal(false);
          invalidateStudentData();
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
    // Backdrop gelap yang opacity-nya disinkronkan dengan drag
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetContainer: {
    // Container transparan yang align sheet ke bawah
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.base,
    maxHeight: '90%',
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: -8,
    marginHorizontal: -Spacing.base,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
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
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 14,
    color: '#1E1E1E',
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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    flex: 1,
    color: Colors.primary,
    fontSize: 13,
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
