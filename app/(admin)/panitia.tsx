// app/(admin)/panitia.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
  KeyboardAvoidingView,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { cacheTime, queryKeys } from '../../constants/query';
import {
  createPanitia,
  getPanitia,
  togglePanitiaStatus,
  deletePanitia,
  PanitiaItem,
} from '../../services/admin/panitia.service';
import { getErrorMessage } from '../../services/api';
import { useDragToClose } from '../../components/useDragToClose';

// ─── Avatar Color Helper ───────────────────────────────────────────────────────

const AVATAR_COLORS = ['#EF5350', '#AB47BC', '#5C6BC0', '#26A69A', '#FFA726', '#8D6E63', '#42A5F5'];
function getAvatarColor(identifier: string) {
  const str = identifier || 'panitia';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

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
    setEmail('');
    setPassword('');
    setError('');
    setSuccessMsg('');
    setShowPassword(false);
  };
  const handleClose = () => {
    reset();
    onClose();
  };

  const { translateY, overlayOpacity, panResponder } = useDragToClose(handleClose);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email panitia wajib diisi.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Format email tidak valid (contoh: panitia@moklet.sch.id).');
      return;
    }
    if (!password.trim() || password.length < 8) {
      setError('Password minimal harus 8 karakter.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const created = await createPanitia({ email: trimmedEmail, password });
      setSuccessMsg(`Akun panitia berhasil dibuat untuk ${trimmedEmail}.`);
      setTimeout(() => {
        onSuccess(created);
        reset();
      }, 500);
    } catch (e: any) {
      setError(getErrorMessage(e, 'Gagal membuat akun panitia. Pastikan email belum pernah didaftarkan.'));
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
            <Text style={ms.sheetTitle}>Buat Akun Panitia</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color="#607D8B" />
            </TouchableOpacity>
          </View>

          {/* Email */}
          <Text style={ms.label}>Email Panitia *</Text>
          <TextInput
            style={ms.input}
            placeholder="contoh: panitia@moklet.sch.id"
            placeholderTextColor="#9E9E9E"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError('');
            }}
          />

          {/* Password */}
          <Text style={ms.label}>Password * (Min. 8 karakter)</Text>
          <View style={ms.passwordRow}>
            <TextInput
              style={[ms.input, { flex: 1 }]}
              placeholder="Minimal 8 karakter"
              placeholderTextColor="#9E9E9E"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError('');
              }}
            />
            <TouchableOpacity
              style={ms.eyeBtn}
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
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
            <Ionicons name="information-circle-outline" size={18} color="#1565C0" />
            <Text style={ms.infoText}>
              Akun panitia yang dibuat dapat langsung login ke aplikasi dengan hak akses Panitia.
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
            style={[ms.submitBtn, (loading || !email.trim() || password.length < 8) && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading || !email.trim() || password.length < 8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={ms.submitBtnText}>Buat Akun Panitia</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function PanitiaScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { data: panitiaList = [], isLoading, isRefetching, refetch } = useQuery<PanitiaItem[]>({
    queryKey: queryKeys.adminPanitia,
    staleTime: cacheTime.warm,
    queryFn: async () => (await getPanitia()) || [],
  });

  const invalidatePanitiaData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPanitia }),
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats }),
    ]);
  };

  const onRefresh = () => refetch();

  const handlePanitiaCreated = (newPanitia: PanitiaItem) => {
    void newPanitia;
    invalidatePanitiaData();
    setShowModal(false);
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
            try {
              await togglePanitiaStatus(item.id, nextStatus);
              await invalidatePanitiaData();
            } catch (err: any) {
              Alert.alert('Gagal', getErrorMessage(err, 'Gagal mengubah status panitia.'));
            }
          },
        },
      ]
    );
  };

  const handleDeletePanitia = (item: PanitiaItem) => {
    Alert.alert(
      'Hapus Akun Panitia',
      `Yakin ingin menghapus akun panitia "${item.email}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePanitia(item.id);
              await invalidatePanitiaData();
            } catch (err: any) {
              Alert.alert('Gagal', getErrorMessage(err, 'Tidak dapat menghapus akun panitia.'));
              invalidatePanitiaData();
            }
          },
        },
      ]
    );
  };

  // Filter pencarian
  const filtered = panitiaList.filter((p) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return p.email.toLowerCase().includes(q) || (p.name && p.name.toLowerCase().includes(q));
  });

  const renderPanitia = ({ item }: { item: PanitiaItem }) => {
    const initials = (item.name || item.email).charAt(0).toUpperCase();
    const color = getAvatarColor(item.email);

    return (
      <View style={styles.panitiaCard}>
        <View style={[styles.panitiaAvatar, { backgroundColor: color }]}>
          <Text style={styles.panitiaAvatarText}>{initials}</Text>
        </View>

        <View style={styles.panitiaInfo}>
          <Text style={styles.panitiaEmail} numberOfLines={1}>
            {item.email}
          </Text>
          <Text style={styles.panitiaMeta}>
            Role: Panitia • {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : 'Terdaftar'}
          </Text>
        </View>

        <View style={styles.panitiaActions}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleToggleStatus(item)}
            style={[styles.statusBadge, item.isActive !== false ? styles.statusActive : styles.statusInactive]}
          >
            <Text
              style={[
                styles.statusText,
                item.isActive !== false ? styles.statusActiveText : styles.statusInactiveText,
              ]}
            >
              {item.isActive !== false ? 'Aktif' : 'Non-aktif'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeletePanitia(item)}
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
        <Text style={styles.headerTitle}>Kelola Panitia</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Buat Akun</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input (seperti pada Siswa) */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#9E9E9E" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari email atau akun panitia..."
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

      {/* Counter Note (seperti 'X siswa terdaftar') */}
      <Text style={styles.searchNote}>
        {search.length > 0
          ? `${filtered.length} dari ${panitiaList.length} panitia`
          : `${panitiaList.length} panitia terdaftar`}
      </Text>

      {/* List */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Memuat daftar panitia...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderPanitia}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={56} color="#BDBDBD" />
              <Text style={styles.emptyTitle}>
                {search ? 'Tidak ada panitia yang cocok dengan pencarian.' : 'Belum ada akun panitia'}
              </Text>
              <Text style={styles.emptySubtitle}>
                Ketuk "Buat Akun" di atas untuk mendaftarkan akun panitia baru.
              </Text>
            </View>
          }
        />
      )}

      <CreatePanitiaModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handlePanitiaCreated}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E1E1E',
  },
  searchNote: {
    fontSize: 12,
    color: '#757575',
    marginHorizontal: Spacing.base,
    marginTop: 8,
    marginBottom: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
    color: '#757575',
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
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  panitiaAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
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
  panitiaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  deleteBtn: {
    padding: 6,
    borderRadius: Radius.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#424242',
    textAlign: 'center',
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
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
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.base,
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
