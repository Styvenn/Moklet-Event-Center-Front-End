// app/room-tim.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import {
  getTeamById,
  lockTeam,
  leaveTeam,
  TeamDetailItem,
  TeamMemberItem,
} from '../services/registration.service';

export default function RoomTimScreen() {
  const { teamId } = useLocalSearchParams<{ teamId?: string }>();
  const { user } = useAuth();

  const [team, setTeam] = useState<TeamDetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Transfer Leader Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedNewLeaderId, setSelectedNewLeaderId] = useState<string>('');

  const currentStudentId = user?.student?.id || '';

  const loadTeamData = useCallback(async (isRefresh = false) => {
    if (!teamId) {
      setErrorMsg('ID Tim tidak ditemukan.');
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      const data = await getTeamById(teamId);
      setTeam(data);
    } catch (err: any) {
      console.warn('Error loading team data:', err);
      setErrorMsg(err?.formattedMessage || 'Gagal memuat data room tim.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  const isLeader = Boolean(
    team && currentStudentId && (team.leaderStudentId === currentStudentId || team.members.some(m => m.studentId === currentStudentId && m.isLeader))
  );

  const handleCopy = async () => {
    if (!team?.code) return;
    try {
      if (Clipboard && Clipboard.setStringAsync) {
        await Clipboard.setStringAsync(team.code);
      }
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLockTeam = () => {
    if (!team) return;
    if (!isLeader) {
      Alert.alert('Akses Ditolak', 'Hanya ketua (Leader) yang dapat mengunci tim.');
      return;
    }
    if (team.members.length < team.minMember) {
      Alert.alert(
        'Syarat Belum Terpenuhi',
        `Tim membutuhkan minimal ${team.minMember} anggota untuk dikunci.`
      );
      return;
    }

    Alert.alert(
      'Kunci Tim',
      'Setelah tim dikunci, tidak ada anggota baru yang bisa masuk atau keluar. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Kunci Tim',
          onPress: async () => {
            setActionLoading(true);
            try {
              await lockTeam(team.id);
              Alert.alert('Sukses', 'Tim berhasil dikunci!');
              loadTeamData(true);
            } catch (err: any) {
              Alert.alert('Gagal Mengunci Tim', err?.formattedMessage || 'Terjadi kesalahan.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLeaveTeamClick = () => {
    if (!team) return;

    if (team.isLocked) {
      Alert.alert('Informasi', 'Tim sudah dikunci. Kamu tidak dapat keluar dari tim ini.');
      return;
    }

    // Jika user adalah leader dan tim memiliki anggota lain
    const otherMembers = team.members.filter((m) => m.studentId !== currentStudentId);
    if (isLeader && otherMembers.length > 0) {
      setSelectedNewLeaderId(otherMembers[0]?.studentId || '');
      setShowTransferModal(true);
      return;
    }

    // Anggota biasa atau leader tunggal
    Alert.alert(
      'Konfirmasi Keluar',
      'Apakah kamu yakin ingin keluar dari tim ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await leaveTeam(team.id);
              Alert.alert('Berhasil', 'Kamu telah keluar dari tim.');
              router.replace('/(tabs)/history');
            } catch (err: any) {
              Alert.alert('Gagal Keluar', err?.formattedMessage || 'Terjadi kesalahan.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleTransferAndLeave = async () => {
    if (!team || !selectedNewLeaderId) return;

    setActionLoading(true);
    try {
      await leaveTeam(team.id, selectedNewLeaderId);
      setShowTransferModal(false);
      Alert.alert('Berhasil', 'Kepemimpinan tim telah dialihkan dan kamu telah keluar.');
      router.replace('/(tabs)/history');
    } catch (err: any) {
      Alert.alert('Gagal Keluar', err?.formattedMessage || 'Gagal mengalihkan kepemimpinan tim.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Room Tim</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Memuat room tim...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg || !team) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Room Tim</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerBox}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>Terjadi Kesalahan</Text>
          <Text style={styles.errorSub}>{errorMsg || 'Data tim tidak ditemukan.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadTeamData()}>
            <Text style={styles.retryBtnText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const memberCount = `${team.members.length}/${team.maxMember}`;
  const emptySlotsCount = Math.max(0, team.maxMember - team.members.length);
  const canLock = isLeader && !team.isLocked && team.members.length >= team.minMember;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{team.name}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {team.categoryName ? `${team.categoryName} • ${team.eventName}` : 'Moklet Event Center'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadTeamData(true)}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Top Code Card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeSubtitle}>KODE BERGABUNG TIM</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{team.code || '—'}</Text>
            <TouchableOpacity
              style={[styles.copyPill, copied && styles.copyPillActive]}
              onPress={handleCopy}
              activeOpacity={0.8}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={18}
                color={copied ? '#2E7D32' : '#1E293B'}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.codeDesc}>
            {copied ? 'Kode berhasil disalin ke clipboard!' : 'Bagikan kode ini ke temanmu agar mereka bisa bergabung.'}
          </Text>
        </View>

        {/* Section Header & Count Badge */}
        <View style={styles.membersHeader}>
          <Text style={styles.sectionTitle}>Anggota Tim</Text>
          <View style={[styles.badgePill, team.isLocked ? { backgroundColor: '#2E7D32' } : null]}>
            <Ionicons
              name={team.isLocked ? 'lock-closed' : 'people'}
              size={13}
              color="#FFFFFF"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.badgeText}>
              {team.isLocked ? `Terkunci (${memberCount})` : memberCount}
            </Text>
          </View>
        </View>

        {/* Member List Card */}
        <View style={styles.membersCard}>
          {team.members.map((member, index) => {
            const initial = (member.name || 'A').charAt(0).toUpperCase();
            return (
              <React.Fragment key={member.id || member.studentId || index}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.memberRow}>
                  <View
                    style={[
                      styles.avatarBox,
                      member.isLeader ? styles.leaderAvatar : styles.memberAvatar,
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarText,
                        member.isLeader ? styles.leaderAvatarText : styles.memberAvatarText,
                      ]}
                    >
                      {initial}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberSub}>
                      {member.isLeader ? '★ Leader' : 'Anggota'}
                      {member.className ? ` • ${member.className}` : ''}
                      {member.nis && member.nis !== '-' ? ` • NIS ${member.nis}` : ''}
                    </Text>
                  </View>
                </View>
              </React.Fragment>
            );
          })}

          {/* Slot Kosong */}
          {!team.isLocked &&
            Array.from({ length: emptySlotsCount }).map((_, i) => (
              <React.Fragment key={`empty-${i}`}>
                <View style={styles.divider} />
                <View style={styles.memberRow}>
                  <View style={styles.waitingAvatar}>
                    <Ionicons name="person-add-outline" size={18} color="#94A3B8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.waitingText}>Menunggu Anggota...</Text>
                  </View>
                </View>
              </React.Fragment>
            ))}
        </View>
      </ScrollView>

      {/* Bottom Sticky Actions */}
      <View style={styles.bottomContainer}>
        {team.isLocked ? (
          <Text style={[styles.noticeText, { color: '#2E7D32' }]}>
            ✓ Tim ini sudah dikunci dan terdaftar secara resmi.
          </Text>
        ) : (
          <Text style={styles.noticeText}>
            {isLeader
              ? team.members.length >= team.minMember
                ? 'Semua syarat terpenuhi. Anda dapat mengunci tim sekarang.'
                : `Tim membutuhkan minimal ${team.minMember} anggota untuk dikunci.`
              : `Menunggu Leader mengunci tim (minimal ${team.minMember} anggota).`}
          </Text>
        )}

        {/* Lock Team Button */}
        {isLeader && !team.isLocked && (
          <TouchableOpacity
            style={[styles.lockTeamBtn, !canLock && styles.lockTeamDisabledBtn]}
            activeOpacity={0.85}
            onPress={handleLockTeam}
            disabled={!canLock || actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={canLock ? Colors.white : '#94A3B8'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.lockTeamText, !canLock && styles.lockTeamDisabledText]}>
                  Kunci Tim (Lock Team)
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Leave Team Button */}
        {!team.isLocked && (
          <TouchableOpacity
            style={styles.leaveTeamOutlineBtn}
            activeOpacity={0.8}
            onPress={handleLeaveTeamClick}
            disabled={actionLoading}
          >
            <Ionicons
              name="exit-outline"
              size={18}
              color={Colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.leaveTeamOutlineText}>Keluar dari Tim</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal Transfer Leader saat Leader keluar */}
      <Modal
        visible={showTransferModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTransferModal(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowTransferModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Pilih Leader Baru</Text>
            <Text style={styles.modalDesc}>
              Sebagai Leader, Anda harus memilih salah satu anggota untuk menjadi Leader baru sebelum keluar.
            </Text>

            <View style={styles.transferMemberList}>
              {team.members
                .filter((m) => m.studentId !== currentStudentId)
                .map((m) => (
                  <TouchableOpacity
                    key={m.studentId}
                    style={[
                      styles.transferMemberItem,
                      selectedNewLeaderId === m.studentId && styles.transferMemberItemActive,
                    ]}
                    onPress={() => setSelectedNewLeaderId(m.studentId)}
                  >
                    <Ionicons
                      name={
                        selectedNewLeaderId === m.studentId
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={20}
                      color={selectedNewLeaderId === m.studentId ? Colors.primary : '#9E9E9E'}
                    />
                    <Text style={styles.transferMemberText}>{m.name} {m.className ? `(${m.className})` : ''}</Text>
                  </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity
              style={[styles.confirmTransferBtn, (!selectedNewLeaderId || actionLoading) && { opacity: 0.6 }]}
              onPress={handleTransferAndLeave}
              disabled={!selectedNewLeaderId || actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.confirmTransferText}>Alihkan & Keluar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelModalBtn}
              onPress={() => setShowTransferModal(false)}
            >
              <Text style={styles.cancelModalText}>Batal</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
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
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textSubtitle,
    marginTop: 1,
  },
  content: {
    padding: Spacing.base,
    paddingBottom: 170,
  },
  codeCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: Spacing.lg,
  },
  codeSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#757575',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 4,
  },
  copyPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  copyPillActive: {
    backgroundColor: '#E8F5E9',
  },
  codeDesc: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
  },
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textMain,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.round,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  membersCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderAvatar: {
    backgroundColor: '#FEE2E2',
  },
  memberAvatar: {
    backgroundColor: '#E0F2FE',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  leaderAvatarText: {
    color: Colors.primary,
  },
  memberAvatarText: {
    color: '#0284C7',
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: 2,
  },
  memberSub: {
    fontSize: 12,
    color: '#757575',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  waitingAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  waitingText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
  },
  noticeText: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontWeight: '500',
  },
  lockTeamBtn: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  lockTeamText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  lockTeamDisabledBtn: {
    backgroundColor: '#F1F5F9',
  },
  lockTeamDisabledText: {
    color: '#94A3B8',
  },
  leaveTeamOutlineBtn: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveTeamOutlineText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },

  // State Containers
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSubtitle,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textMain,
  },
  errorSub: {
    fontSize: 14,
    color: Colors.textSubtitle,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  retryBtnText: {
    color: Colors.white,
    fontWeight: '700',
  },

  // Modal
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textMain,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 13,
    color: Colors.textSubtitle,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: Spacing.lg,
  },
  transferMemberList: {
    width: '100%',
    marginBottom: Spacing.lg,
    gap: 8,
  },
  transferMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  transferMemberItemActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF5F5',
  },
  transferMemberText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMain,
  },
  confirmTransferBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  confirmTransferText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  cancelModalBtn: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSubtitle,
  },
});
