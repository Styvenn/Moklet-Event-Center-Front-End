import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { createPanitia, getPanitia, togglePanitiaStatus, PanitiaItem } from '../../services/admin/panitia.service';

// ─── Modal Buat Akun Panitia ──────────────────────────────────────────────────

interface CreatePanitiaModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (newPanitia: PanitiaItem) => void;
}

function CreatePanitiaModal({ visible, onClose, onSuccess }: CreatePanitiaModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const reset = () => {
    setEmail(''); setPassword(''); setError(''); setSuccessMsg(''); setShowPassword(false);
  };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!email.trim()) { setError('Email wajib diisi.'); return; }
    if (!password.trim() || password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await createPanitia({ email: email.trim(), password });
      setSuccessMsg(`Akun panitia berhasil dibuat untuk ${email.trim()}.`);

      const newPanitia: PanitiaItem = {
        id: res?.id || Date.now().toString(),
        email: email.trim(),
        role: 'PANITIA',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      onSuccess(newPanitia);
      reset();
    } catch (e: any) {
      setError(e?.message || 'Gagal membuat akun panitia. Coba lagi.');
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
            <View style={ms.handle} />
            <View style={ms.sheetHeader}>
              <Text style={ms.sheetTitle}>Buat Akun Panitia</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color="#607D8B" />
              </TouchableOpacity>
            </View>

            {/* Email */}
            <Text style={ms.label}>Email *</Text>
            <TextInput
              style={ms.input}
              placeholder="contoh@moklet.sch.id"
              placeholderTextColor="#9E9E9E"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            {/* Password */}
            <Text style={ms.label}>Password *</Text>
            <View style={ms.passwordRow}>
              <TextInput
                style={[ms.input, { flex: 1 }]}
                placeholder="Min. 6 karakter"
                placeholderTextColor="#9E9E9E"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={ms.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#9E9E9E"
                />
              </TouchableOpacity>
            </View>

            {/* Info box */}
            <View style={ms.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color="#1565C0" />
              <Text style={ms.infoText}>
                Pastikan email valid dan password diberitahukan kepada panitia yang bersangkutan secara langsung.
              </Text>
            </View>

            {error ? <Text style={ms.errorText}>{error}</Text> : null}
            {successMsg ? (
              <View style={ms.successBox}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#2E7D32" />
                <Text style={ms.successText}>{successMsg}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[ms.submitBtn, (loading || !email || !password) && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading || !email || !password}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={ms.submitBtnText}>Buat Akun</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function PanitiaScreen() {
  const [panitiaList, setPanitiaList] = useState<PanitiaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchPanitiaList = useCallback(async () => {
    try {
      setLoadError(false);
      const list = await getPanitia();
      setPanitiaList(list);
    } catch (e: any) {
      console.warn('Failed to fetch panitia list:', e);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPanitiaList();
  }, [fetchPanitiaList]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPanitiaList();
  };

  const handlePanitiaCreated = (newPanitia: PanitiaItem) => {
    setPanitiaList((prev) => [newPanitia, ...prev]);
    // Refresh to get server source of truth
    fetchPanitiaList();
  };

  const handleToggleStatus = (item: PanitiaItem) => {
    const nextStatus = !item.isActive;
    Alert.alert(
      'Ubah Status Panitia',
      `Apakah Anda yakin ingin mengubah status ${item.email} menjadi ${nextStatus ? 'Aktif' : 'Non-aktif'}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Ubah',
          onPress: async () => {
            // Optimistic update
            setPanitiaList((prev) =>
              prev.map((p) => (p.id === item.id ? { ...p, isActive: nextStatus } : p))
            );
            try {
              await togglePanitiaStatus(item.id, nextStatus);
            } catch (err: any) {
              // Rollback
              setPanitiaList((prev) =>
                prev.map((p) => (p.id === item.id ? { ...p, isActive: item.isActive } : p))
              );
              Alert.alert('Gagal', err?.message || 'Gagal mengubah status panitia.');
            }
          },
        },
      ]
    );
  };

  const renderPanitia = ({ item }: { item: PanitiaItem }) => {
    const initials = item.email.charAt(0).toUpperCase();
    return (
      <View style={styles.panitiaCard}>
        <View style={styles.panitiaAvatar}>
          <Text style={styles.panitiaAvatarText}>{initials}</Text>
        </View>
        <View style={styles.panitiaInfo}>
          <Text style={styles.panitiaEmail} numberOfLines={1}>{item.email}</Text>
          <Text style={styles.panitiaMeta}>
            Role: Panitia • {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('id-ID')
              : 'Baru dibuat'}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleToggleStatus(item)}
          style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusInactive]}
        >
          <Text style={[styles.statusText, item.isActive ? styles.statusActiveText : styles.statusInactiveText]}>
            {item.isActive ? 'Aktif' : 'Non-aktif'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kelola Panitia</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Buat Akun</Text>
        </TouchableOpacity>
      </View>

      {/* Banner: Tampil hanya jika terjadi error / backend gap */}
      {loadError && (
        <View style={styles.todoBanner}>
          <Ionicons name="warning-outline" size={18} color="#F57F17" />
          <Text style={styles.todoBannerText}>
            Gagal memuat daftar panitia dari server atau endpoint belum siap.{'\n'}
            Tarik ke bawah untuk memuat ulang.
          </Text>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={panitiaList}
          keyExtractor={(item) => item.id}
          renderItem={renderPanitia}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="person-add-outline" size={56} color="#BDBDBD" />
              <Text style={styles.emptyTitle}>Belum ada akun panitia</Text>
              <Text style={styles.emptySubtitle}>
                Ketuk "Buat Akun" di atas untuk menambah panitia baru.
              </Text>
            </View>
          }
        />
      )}

      <CreatePanitiaModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={(newPanitia) => {
          handlePanitiaCreated(newPanitia);
          setShowModal(false);
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  todoBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 3,
    borderLeftColor: '#F57F17',
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 10,
    alignItems: 'flex-start',
  },
  todoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#5D4037',
    lineHeight: 18,
  },
  listContent: {
    padding: Spacing.base,
    paddingBottom: 32,
  },
  panitiaCard: {
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
  panitiaAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E1F5FE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  panitiaAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0277BD',
  },
  panitiaInfo: {
    flex: 1,
    gap: 3,
  },
  panitiaEmail: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  panitiaMeta: {
    fontSize: 12,
    color: '#757575',
  },
  statusBadge: {
    borderRadius: Radius.round,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusActive: { backgroundColor: '#E8F5E9' },
  statusInactive: { backgroundColor: '#EFEBE9' },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusActiveText: { color: '#2E7D32' },
  statusInactiveText: { color: '#6D4C41' },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#424242',
  },
  emptySubtitle: {
    fontSize: 13,
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyeBtn: {
    width: 48,
    height: Platform.OS === 'ios' ? 48 : 40,
    backgroundColor: '#F5F5F5',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 8,
    alignItems: 'flex-start',
    marginTop: Spacing.base,
    marginBottom: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1565C0',
    lineHeight: 18,
  },
  errorText: {
    color: Colors.primary,
    fontSize: 13,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  successBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 8,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: '#1B5E20',
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
