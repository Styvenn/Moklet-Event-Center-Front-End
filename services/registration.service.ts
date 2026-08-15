// services/registration.service.ts
import api from './api';

// ─── Raw API Interfaces ────────────────────────────────────────────────────────
export interface RawRegistration {
  id: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    minMember?: number;
    maxMember?: number;
    eventId?: string;
    event?: {
      id: string;
      name: string;
    };
  };
  teamId?: string | null;
  team?: {
    id: string;
    name: string;
    code?: string;
    isLocked?: boolean;
    status?: string;
  } | null;
  studentId?: string;
  student?: {
    id: string;
    name: string;
    nis?: string;
  };
}

export interface RawTeamMember {
  id?: string;
  studentId: string;
  isLeader?: boolean;
  role?: string;
  student?: {
    id: string;
    name: string;
    nis?: string;
    avatarUrl?: string | null;
    class?: {
      id?: string;
      grade: string;
      name: string;
    } | null;
  };
}

export interface RawTeam {
  id: string;
  name: string;
  code: string;
  isLocked?: boolean;
  status?: string;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    minMember?: number;
    maxMember?: number;
    eventId?: string;
    event?: {
      id: string;
      name: string;
    };
  };
  members?: RawTeamMember[];
  teamMembers?: RawTeamMember[];
  leaderStudentId?: string;
  creatorId?: string;
  createdAt?: string;
}

// ─── Normalized Interfaces ─────────────────────────────────────────────────────
export interface RegistrationHistoryItem {
  id: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  dateFormatted: string;
  rawDate: string;
  categoryId: string;
  categoryName: string;
  eventId: string;
  eventName: string;
  teamId: string | null;
  teamName: string | null;
  teamCode: string | null;
  isTeamLocked: boolean;
  isIndividual: boolean;
}

export interface TeamMemberItem {
  id: string;
  studentId: string;
  name: string;
  nis: string;
  className: string;
  avatarUrl: string | null;
  isLeader: boolean;
  role: string;
}

export interface TeamDetailItem {
  id: string;
  name: string;
  code: string;
  isLocked: boolean;
  status: string;
  categoryId: string;
  categoryName: string;
  minMember: number;
  maxMember: number;
  eventId: string;
  eventName: string;
  members: TeamMemberItem[];
  leaderStudentId: string;
}

// ─── Normalizers ───────────────────────────────────────────────────────────────
export function normalizeRegistration(raw: RawRegistration): RegistrationHistoryItem {
  const status = (raw.status || 'REGISTERED').toUpperCase();

  let statusLabel = 'Terdaftar';
  let statusColor = '#2E7D32';
  let statusBg = '#E8F5E9';

  if (status === 'WAITING' || status === 'PENDING') {
    statusLabel = 'Menunggu';
    statusColor = '#F57C00';
    statusBg = '#FFF3E0';
  } else if (status === 'REJECTED' || status === 'DITOLAK') {
    statusLabel = 'Ditolak';
    statusColor = '#D32F2F';
    statusBg = '#FFEBEE';
  } else if (status === 'DISQUALIFIED') {
    statusLabel = 'Didiskualifikasi';
    statusColor = '#7B1FA2';
    statusBg = '#F3E5F5';
  } else if (status === 'REGISTERED' || status === 'APPROVED') {
    statusLabel = 'Terdaftar';
    statusColor = '#2E7D32';
    statusBg = '#E8F5E9';
  }

  const rawDate = raw.createdAt || '';
  let dateFormatted = '-';
  if (rawDate) {
    try {
      dateFormatted = new Date(rawDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      dateFormatted = rawDate;
    }
  }

  const isIndividual = !raw.teamId && !raw.team;

  return {
    id: raw.id,
    status,
    statusLabel,
    statusColor,
    statusBg,
    dateFormatted,
    rawDate,
    categoryId: raw.categoryId || raw.category?.id || '',
    categoryName: raw.category?.name || 'Cabang Lomba',
    eventId: raw.category?.eventId || raw.category?.event?.id || '',
    eventName: raw.category?.event?.name || 'Event Moklet',
    teamId: raw.teamId || raw.team?.id || null,
    teamName: raw.team?.name || (isIndividual ? 'Individu' : 'Tim'),
    teamCode: raw.team?.code || null,
    isTeamLocked: Boolean(raw.team?.isLocked),
    isIndividual,
  };
}

export function normalizeTeamMember(raw: RawTeamMember, leaderStudentId?: string): TeamMemberItem {
  const student = raw.student;
  const isLeader = Boolean(
    raw.isLeader || (leaderStudentId && raw.studentId === leaderStudentId) || raw.role?.toLowerCase() === 'leader'
  );

  const className = student?.class
    ? `${student.class.grade || ''} ${student.class.name || ''}`.trim()
    : '';

  return {
    id: raw.id || raw.studentId,
    studentId: raw.studentId,
    name: student?.name || 'Anggota Tim',
    nis: student?.nis || '-',
    className,
    avatarUrl: student?.avatarUrl || null,
    isLeader,
    role: isLeader ? 'Leader' : 'Anggota',
  };
}

export function normalizeTeamDetail(raw: RawTeam): TeamDetailItem {
  const leaderId = raw.leaderStudentId || raw.creatorId || '';
  const rawMembers = raw.members || raw.teamMembers || [];
  const members = rawMembers.map((m) => normalizeTeamMember(m, leaderId));

  // Urutkan leader paling atas
  members.sort((a, b) => (b.isLeader ? 1 : 0) - (a.isLeader ? 1 : 0));

  return {
    id: raw.id,
    name: raw.name || 'Tim Lomba',
    code: raw.code || '',
    isLocked: Boolean(raw.isLocked),
    status: raw.status || 'ACTIVE',
    categoryId: raw.categoryId || raw.category?.id || '',
    categoryName: raw.category?.name || '',
    minMember: raw.category?.minMember ?? 1,
    maxMember: raw.category?.maxMember ?? 1,
    eventId: raw.category?.eventId || raw.category?.event?.id || '',
    eventName: raw.category?.event?.name || '',
    members,
    leaderStudentId: leaderId,
  };
}

// ─── API Methods ───────────────────────────────────────────────────────────────

/**
 * [SISWA] Mengambil daftar riwayat pendaftaran lomba milik siswa yang sedang login.
 * Endpoint: GET /registrations/me
 */
export async function getRegistrationHistory(): Promise<RegistrationHistoryItem[]> {
  const res: any = await api.get('/registrations/me');
  const rawList: RawRegistration[] = Array.isArray(res) ? res : res?.data || [];
  return rawList.map(normalizeRegistration);
}

/**
 * [SISWA] Mendaftar ke cabang lomba kategori individu (maxMember === 1).
 * Endpoint: POST /registrations/individual
 */
export async function registerIndividual(categoryId: string): Promise<any> {
  const res: any = await api.post('/registrations/individual', { categoryId });
  return res?.data || res;
}

/**
 * [SISWA] Membuat tim baru untuk kategori kelompok (maxMember > 1).
 * Pembuat otomatis menjadi leader.
 * Endpoint: POST /teams
 */
export async function createTeam(name: string, categoryId: string): Promise<TeamDetailItem> {
  const res: any = await api.post('/teams', { name, categoryId });
  const raw: RawTeam = res?.data || res;
  return normalizeTeamDetail(raw);
}

/**
 * [SISWA] Bergabung ke tim yang sudah ada menggunakan kode tim.
 * Endpoint: POST /teams/join
 */
export async function joinTeam(code: string): Promise<TeamDetailItem> {
  const res: any = await api.post('/teams/join', { code: code.trim() });
  const raw: RawTeam = res?.data || res;
  return normalizeTeamDetail(raw);
}

/**
 * Mendapatkan detail informasi tim dan daftar anggotanya.
 * Endpoint: GET /teams/:id
 */
export async function getTeamById(teamId: string): Promise<TeamDetailItem> {
  const res: any = await api.get(`/teams/${teamId}`);
  const raw: RawTeam = res?.data || res;
  return normalizeTeamDetail(raw);
}

/**
 * [SISWA] Mengunci tim agar anggota tidak bisa masuk/keluar lagi (Khusus Leader).
 * Endpoint: PATCH /teams/:id/lock
 */
export async function lockTeam(teamId: string): Promise<void> {
  await api.patch(`/teams/${teamId}/lock`);
}

/**
 * [SISWA] Keluar dari tim (Self leave).
 * Endpoint: DELETE /teams/:id/members/me
 */
export async function leaveTeam(teamId: string, newLeaderStudentId?: string): Promise<void> {
  await api.delete(`/teams/${teamId}/members/me`, {
    data: newLeaderStudentId ? { newLeaderStudentId } : {},
  });
}
