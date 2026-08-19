// app/daftar-lomba.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/theme';
import api from '../services/api';
import {
  getCategoriesByEvent,
  getEventById,
  CategoryItem,
  EventItem,
} from '../services/panitia/events.service';
import {
  registerIndividual,
  createTeam,
  joinTeam,
} from '../services/registration.service';

function getCategoryIcon(name: string): any {
  const lower = (name || '').toLowerCase();
  if (lower.includes('futsal') || lower.includes('bola') || lower.includes('football')) return 'football-outline';
  if (lower.includes('basket')) return 'basketball-outline';
  if (lower.includes('esport') || lower.includes('e-sport') || lower.includes('game') || lower.includes('mobile')) return 'game-controller-outline';
  if (lower.includes('tari') || lower.includes('musik') || lower.includes('seni') || lower.includes('band')) return 'musical-notes-outline';
  if (lower.includes('robot') || lower.includes('it') || lower.includes('koding') || lower.includes('web')) return 'hardware-chip-outline';
  if (lower.includes('voli')) return 'fitness-outline';
  if (lower.includes('lari') || lower.includes('atletik')) return 'walk-outline';
  if (lower.includes('tarik tambang')) return 'people-outline';
  if (lower.includes('badminton') || lower.includes('bulutangkis')) return 'tennisball-outline';
  return 'trophy-outline';
}

export default function DaftarLombaScreen() {
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const currentEventId = eventId || '';

  const [eventData, setEventData] = useState<EventItem | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal States
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showEnterCodeModal, setShowEnterCodeModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);

  // Form Inputs
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [teamNameInput, setTeamNameInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!currentEventId) {
      setErrorMsg('ID Event tidak valid.');
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      const [ev, cats] = await Promise.all([
        getEventById(currentEventId).catch(() => null),
        getCategoriesByEvent(currentEventId).catch(() => []),
      ]);
      setEventData(ev);
      setCategories(cats);
    } catch (err: any) {
      console.warn('Error loading categories:', err);
      setErrorMsg(err?.formattedMessage || 'Gagal memuat cabang lomba.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentEventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCategoryPress = (category: CategoryItem) => {
    setSelectedCategory(category);
    setModalError(null);

    if (category.maxMember === 1) {
      // Pendaftaran Individu
      Alert.alert(
        'Daftar Lomba Individu',
        `Apakah Anda yakin ingin mendaftar ke cabang lomba "${category.name}"?`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Daftar Sekarang',
            onPress: () => handleIndividualRegistration(category.id),
          },
        ]
      );
    } else {
      // Pendaftaran Kelompok/Tim
      setShowChoiceModal(true);
    }
  };

  const handleIndividualRegistration = async (categoryId: string) => {
    setLoading(true);
    try {
      await registerIndividual(categoryId);
      Alert.alert(
        'Pendaftaran Berhasil!',
        'Anda telah berhasil mendaftar ke cabang lomba ini.',
        [
          {
            text: 'Lihat Riwayat',
            onPress: () => router.replace('/(tabs)/history'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        'Pendaftaran Gagal',
        err?.formattedMessage || err?.message || 'Gagal melakukan pendaftaran. Silakan coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePressEnterCode = () => {
    setShowChoiceModal(false);
    setRoomCodeInput('');
    setModalError(null);
    setTimeout(() => {
      setShowEnterCodeModal(true);
    }, 200);
  };

  const handlePressCreateRoom = () => {
    setShowChoiceModal(false);
    setTeamNameInput('');
    setModalError(null);
    setTimeout(() => {
      setShowCreateTeamModal(true);
    }, 200);
  };

  const handleJoinTeamSubmit = async () => {
    const cleanCode = roomCodeInput.trim();
    if (!cleanCode) {
      setModalError('Kode room wajib diisi.');
      return;
    }

    setSubmitting(true);
    setModalError(null);

    try {
      const team = await joinTeam(cleanCode);
      setShowEnterCodeModal(false);
      Alert.alert('Berhasil Bergabung!', `Kamu telah bergabung dengan tim ${team.name}.`, [
        {
          text: 'Masuk ke Room Tim',
          onPress: () => router.push({ pathname: '/room-tim', params: { teamId: team.id } }),
        },
      ]);
    } catch (err: any) {
      setModalError(err?.formattedMessage || err?.message || 'Kode room tidak ditemukan atau kuota penuh.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTeamSubmit = async () => {
    const cleanName = teamNameInput.trim();
    if (!cleanName || cleanName.length < 3) {
      setModalError('Nama tim minimal 3 karakter.');
      return;
    }
    if (!selectedCategory) {
      setModalError('Cabang lomba tidak valid.');
      return;
    }

    setSubmitting(true);
    setModalError(null);

    try {
      const team = await createTeam(cleanName, selectedCategory.id);
      setShowCreateTeamModal(false);
      Alert.alert('Room Tim Dibuat!', `Tim "${team.name}" berhasil dibuat. Kode tim: ${team.code}`, [
        {
          text: 'Masuk ke Room Tim',
          onPress: () => router.push({ pathname: '/room-tim', params: { teamId: team.id } }),
        },
      ]);
    } catch (err: any) {
      setModalError(err?.formattedMessage || err?.message || 'Gagal membuat room tim.');
    } finally {
      setSubmitting(false);
    }
  };

  const eventName = eventData?.name || 'Moklet Event';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textMain} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center', flex: 1, paddingHorizontal: 8 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>Daftar Lomba</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{eventName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Memuat cabang lomba...</Text>
        </View>
      ) : categories.length > 0 ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              colors={[Colors.primary]}
            />
          }
        >
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {categories.map((branch, index) => {
            const isIndividual = branch.maxMember === 1;
            const memberLabel = isIndividual
              ? 'Individu (1 orang)'
              : `Kelompok (${branch.minMember} - ${branch.maxMember} anggota)`;

            return (
              <View key={branch.id}>
                <TouchableOpacity
                  style={styles.branchItem}
                  activeOpacity={0.7}
                  onPress={() => handleCategoryPress(branch)}
                >
                  <View style={styles.branchLeft}>
                    <View style={styles.branchIcon}>
                      <Ionicons
                        name={getCategoryIcon(branch.name)}
                        size={20}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.branchName}>{branch.name}</Text>
                      <View style={styles.typeRow}>
                        <Ionicons
                          name={isIndividual ? 'person-outline' : 'people-outline'}
                          size={12}
                          color={Colors.textSubtitle}
                        />
                        <Text style={styles.branchType}>{memberLabel}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.daftarBtn}
                    onPress={() => handleCategoryPress(branch)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.daftarBtnText}>Daftar</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
                {index < categories.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="trophy-outline" size={48} color={Colors.textPlaceholder} />
          </View>
          <Text style={styles.emptyStateTitle}>Belum Ada Cabang Lomba</Text>
          <Text style={styles.emptyStateText}>
            Belum ada cabang lomba yang dibuka untuk event "{eventName}". Silakan cek kembali secara berkala.
          </Text>
        </View>
      )}

      {/* MODAL 1: Choice Modal (Masukkan Kode Room vs Buat Room) */}
      <Modal
        visible={showChoiceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChoiceModal(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowChoiceModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.choiceTitle}>{selectedCategory?.name || 'Cabang Lomba'}</Text>
            <Text style={styles.choiceSubtitle}>
              Min. {selectedCategory?.minMember} anggota, Maks. {selectedCategory?.maxMember} anggota
            </Text>

            {/* Side-by-Side Action Buttons */}
            <View style={styles.choiceButtonRow}>
              <TouchableOpacity
                style={styles.enterCodeOutlineBtn}
                activeOpacity={0.8}
                onPress={handlePressEnterCode}
              >
                <Text style={styles.enterCodeOutlineText}>Masukkan Kode Room</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createRoomSolidBtn}
                activeOpacity={0.85}
                onPress={handlePressCreateRoom}
              >
                <Text style={styles.createRoomSolidText}>Buat Room</Text>
              </TouchableOpacity>
            </View>

            {/* Batal Button */}
            <TouchableOpacity
              style={styles.cancelFullBtn}
              activeOpacity={0.8}
              onPress={() => setShowChoiceModal(false)}
            >
              <Text style={styles.cancelFullText}>Batal</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL 2: Enter Room Code Modal */}
      <Modal
        visible={showEnterCodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => !submitting && setShowEnterCodeModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <Pressable
            style={styles.overlay}
            onPress={() => !submitting && setShowEnterCodeModal(false)}
          >
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.enterCodeTitle}>Masukkan Kode Room</Text>
              <Text style={styles.enterCodeDesc}>
                Masukkan kode tim yang diberikan oleh ketua tim (leader).
              </Text>

              {modalError ? (
                <View style={styles.modalErrorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                  <Text style={styles.modalErrorText}>{modalError}</Text>
                </View>
              ) : null}

              <TextInput
                style={styles.codeInputBox}
                placeholder="KODE TIM"
                placeholderTextColor="#94A3B8"
                value={roomCodeInput}
                onChangeText={(t) => {
                  setRoomCodeInput(t);
                  if (modalError) setModalError(null);
                }}
                autoCapitalize="characters"
                autoFocus
                editable={!submitting}
              />

              <TouchableOpacity
                style={[styles.gabungRoomBtn, (!roomCodeInput.trim() || submitting) && { opacity: 0.6 }]}
                activeOpacity={0.85}
                onPress={handleJoinTeamSubmit}
                disabled={!roomCodeInput.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.gabungRoomText}>Gabung Room</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelFullBtn}
                activeOpacity={0.8}
                onPress={() => setShowEnterCodeModal(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelFullText}>Batal</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 3: Create Team Modal (Buat Tim Baru) */}
      <Modal
        visible={showCreateTeamModal}
        transparent
        animationType="fade"
        onRequestClose={() => !submitting && setShowCreateTeamModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <Pressable
            style={styles.overlay}
            onPress={() => !submitting && setShowCreateTeamModal(false)}
          >
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.enterCodeTitle}>Buat Room Tim</Text>
              <Text style={styles.enterCodeDesc}>
                Masukkan nama tim untuk cabang lomba "{selectedCategory?.name}". Anda otomatis menjadi Leader tim.
              </Text>

              {modalError ? (
                <View style={styles.modalErrorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                  <Text style={styles.modalErrorText}>{modalError}</Text>
                </View>
              ) : null}

              <TextInput
                style={[styles.codeInputBox, { letterSpacing: 0, fontSize: 16, textAlign: 'left', paddingHorizontal: 16 }]}
                placeholder="Contoh: Tim Garuda Moklet"
                placeholderTextColor="#94A3B8"
                value={teamNameInput}
                onChangeText={(t) => {
                  setTeamNameInput(t);
                  if (modalError) setModalError(null);
                }}
                autoFocus
                editable={!submitting}
              />

              <TouchableOpacity
                style={[styles.gabungRoomBtn, (!teamNameInput.trim() || submitting) && { opacity: 0.6 }]}
                activeOpacity={0.85}
                onPress={handleCreateTeamSubmit}
                disabled={!teamNameInput.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.gabungRoomText}>Buat Tim Sekarang</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelFullBtn}
                activeOpacity={0.8}
                onPress={() => setShowCreateTeamModal(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelFullText}>Batal</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

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
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FA',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textSubtitle,
  },
  list: {
    padding: Spacing.base,
  },
  branchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.lg,
  },
  branchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    paddingRight: 8,
  },
  branchIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: 2,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  branchType: {
    fontSize: 12,
    color: Colors.textSubtitle,
  },
  daftarBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: Radius.round,
  },
  daftarBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: Spacing.base,
  },

  // States
  centerBox: {
    flex: 1,
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
    gap: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    flex: 1,
    color: Colors.error,
    fontSize: 13,
  },

  // Empty state
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 13,
    color: Colors.textSubtitle,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Modals Styling
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xl,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },

  // Choice Modal
  choiceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textMain,
    marginBottom: 6,
    textAlign: 'center',
  },
  choiceSubtitle: {
    fontSize: 13,
    color: Colors.textSubtitle,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  choiceButtonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    marginBottom: Spacing.md,
  },
  enterCodeOutlineBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterCodeOutlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: 18,
  },
  createRoomSolidBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRoomSolidText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },
  cancelFullBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelFullText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMain,
  },

  // Enter Code Modal
  enterCodeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textMain,
    marginBottom: 8,
    textAlign: 'center',
  },
  enterCodeDesc: {
    fontSize: 13,
    color: Colors.textSubtitle,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  modalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFEBEE',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    width: '100%',
  },
  modalErrorText: {
    color: Colors.error,
    fontSize: 12,
    flex: 1,
  },
  codeInputBox: {
    width: '100%',
    height: 52,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textMain,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: Spacing.md,
  },
  gabungRoomBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  gabungRoomText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});
