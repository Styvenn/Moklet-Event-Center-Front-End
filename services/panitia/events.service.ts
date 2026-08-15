// services/panitia/events.service.ts
import api from '../api';

// ─── Raw API Shapes ────────────────────────────────────────────────────────────
export interface RawEvent {
  id: string;
  name: string;
  description?: string | null;
  eventDate?: string | null;
  status?: string;
  bannerUrl?: string | null;
  guidebookUrl?: string | null;
  creatorId?: string;
  createdAt?: string;
}

export interface RawCategory {
  id: string;
  name: string;
  minMember: number;
  maxMember: number;
  teamCompositionMode: 'FREE' | 'PER_CLASS' | 'PER_ANGKATAN';
  maxTeamsPerGroup?: number | null;
  maxTotalTeams?: number | null;
  excludeGrade12: boolean;
  eventId?: string;
  _count?: { teams?: number; registrations?: number };
}

export interface RawSchedule {
  id: string;
  date: string;
  dayLabel: string;
  dresscodeText: string;
  dresscodeImageUrl?: string | null;
  eventId?: string;
}

export interface RawCommitteeMember {
  studentId: string;
  role?: string | null;
  student?: {
    id: string;
    name: string;
    nis?: string;
    avatarUrl?: string | null;
    class?: { grade: string; name: string } | null;
  };
}

// ─── Normalized Internal Shapes ────────────────────────────────────────────────
export interface EventItem {
  id: string; name: string; description: string; eventDate: string;
  status: string; bannerUrl: string | null; guidebookUrl: string | null;
  creatorId: string; createdAt: string;
}

export interface CategoryItem {
  id: string; name: string; minMember: number; maxMember: number;
  teamCompositionMode: 'FREE' | 'PER_CLASS' | 'PER_ANGKATAN';
  maxTeamsPerGroup: number | null; maxTotalTeams: number | null;
  excludeGrade12: boolean; totalRegistrations: number;
}

export interface ScheduleItem {
  id: string; date: string; dayLabel: string; dresscodeText: string;
  dresscodeImageUrl: string | null;
}

export interface CommitteeMemberItem {
  studentId: string; role: string; name: string; nis: string;
  avatarUrl: string | null; classLabel: string;
}

// ─── Normalisers ───────────────────────────────────────────────────────────────
export function normalizeEvent(raw: RawEvent): EventItem {
  return {
    id: raw.id, name: raw.name || '', description: raw.description || '',
    eventDate: raw.eventDate || '', status: raw.status || 'ONGOING',
    bannerUrl: raw.bannerUrl || null, guidebookUrl: raw.guidebookUrl || null,
    creatorId: raw.creatorId || '', createdAt: raw.createdAt || '',
  };
}

export function normalizeCategory(raw: RawCategory): CategoryItem {
  const count = raw._count;
  return {
    id: raw.id, name: raw.name || '', minMember: raw.minMember ?? 1,
    maxMember: raw.maxMember ?? 1, teamCompositionMode: raw.teamCompositionMode || 'FREE',
    maxTeamsPerGroup: raw.maxTeamsPerGroup ?? null, maxTotalTeams: raw.maxTotalTeams ?? null,
    excludeGrade12: raw.excludeGrade12 ?? true,
    totalRegistrations: (count?.teams ?? 0) + (count?.registrations ?? 0),
  };
}

export function normalizeSchedule(raw: RawSchedule): ScheduleItem {
  return {
    id: raw.id, date: raw.date || '', dayLabel: raw.dayLabel || '',
    dresscodeText: raw.dresscodeText || '', dresscodeImageUrl: raw.dresscodeImageUrl || null,
  };
}

export function normalizeCommitteeMember(raw: RawCommitteeMember): CommitteeMemberItem {
  const st = raw.student;
  return {
    studentId: raw.studentId, role: raw.role || 'Anggota', name: st?.name || '',
    nis: st?.nis || '', avatarUrl: st?.avatarUrl || null,
    classLabel: st?.class ? `${st.class.grade} ${st.class.name}`.trim() : '',
  };
}

// ─── DTOs ──────────────────────────────────────────────────────────────────────
export interface CreateEventDto { name: string; eventDate: string; description?: string; }
export type UpdateEventDto = Partial<CreateEventDto>;

export interface CreateCategoryDto {
  name: string; minMember: number; maxMember: number;
  teamCompositionMode: 'FREE' | 'PER_CLASS' | 'PER_ANGKATAN';
  maxTeamsPerGroup?: number; maxTotalTeams?: number; excludeGrade12?: boolean;
}
export type UpdateCategoryDto = Partial<CreateCategoryDto>;

export interface CreateScheduleDto { date: string; dayLabel: string; dresscodeText: string; }
export type UpdateScheduleDto = Partial<CreateScheduleDto>;

// ─── Events CRUD ───────────────────────────────────────────────────────────────
export async function getEvents(page = 1, limit = 50): Promise<EventItem[]> {
  const res: any = await api.get(`/events?page=${page}&limit=${limit}`);
  const raw: RawEvent[] = Array.isArray(res) ? res : (res?.data ?? []);
  return raw.map(normalizeEvent);
}

export async function getEventById(id: string): Promise<EventItem> {
  const res: any = await api.get(`/events/${id}`);
  const raw: RawEvent = res?.data ?? res;
  return normalizeEvent(raw);
}

export async function createEvent(dto: CreateEventDto): Promise<EventItem> {
  const res: any = await api.post('/events', dto);
  const raw: RawEvent = res?.data ?? res;
  return normalizeEvent(raw);
}

export async function updateEvent(id: string, dto: UpdateEventDto): Promise<EventItem> {
  const res: any = await api.patch(`/events/${id}`, dto);
  const raw: RawEvent = res?.data ?? res;
  return normalizeEvent(raw);
}

export async function updateEventStatus(id: string, status: 'ONGOING' | 'CLOSED'): Promise<void> {
  await api.patch(`/events/${id}/status`, { status });
}

export async function uploadBanner(id: string, uri: string): Promise<void> {
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'banner.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  formData.append('file', { uri, name: filename, type } as any);
  await api.patch(`/events/${id}/banner`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}

export async function uploadGuidebook(id: string, uri: string): Promise<void> {
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'guidebook.pdf';
  formData.append('file', { uri, name: filename, type: 'application/pdf' } as any);
  await api.patch(`/events/${id}/guidebook`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}

// ─── Categories ────────────────────────────────────────────────────────────────
export async function getCategoriesByEvent(eventId: string): Promise<CategoryItem[]> {
  const res: any = await api.get(`/events/${eventId}/categories`);
  const raw: RawCategory[] = Array.isArray(res) ? res : (res?.data ?? []);
  return raw.map(normalizeCategory);
}

export async function createCategory(eventId: string, dto: CreateCategoryDto): Promise<CategoryItem> {
  const res: any = await api.post(`/events/${eventId}/categories`, dto);
  return normalizeCategory(res?.data ?? res);
}

export async function updateCategory(id: string, dto: UpdateCategoryDto): Promise<CategoryItem> {
  const res: any = await api.patch(`/categories/${id}`, dto);
  return normalizeCategory(res?.data ?? res);
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`);
}

// ─── Schedules ─────────────────────────────────────────────────────────────────
export async function getSchedulesByEvent(eventId: string): Promise<ScheduleItem[]> {
  const res: any = await api.get(`/events/${eventId}/schedules`);
  const raw: RawSchedule[] = Array.isArray(res) ? res : (res?.data ?? []);
  return raw.map(normalizeSchedule);
}

export async function createSchedule(eventId: string, dto: CreateScheduleDto): Promise<ScheduleItem> {
  const res: any = await api.post(`/events/${eventId}/schedules`, dto);
  return normalizeSchedule(res?.data ?? res);
}

export async function updateSchedule(id: string, dto: UpdateScheduleDto): Promise<ScheduleItem> {
  const res: any = await api.patch(`/schedules/${id}`, dto);
  return normalizeSchedule(res?.data ?? res);
}

export async function deleteSchedule(id: string): Promise<void> {
  await api.delete(`/schedules/${id}`);
}

// ─── Committee ─────────────────────────────────────────────────────────────────
export async function getCommittee(eventId: string): Promise<CommitteeMemberItem[]> {
  const res: any = await api.get(`/events/${eventId}/committee`);
  const raw: RawCommitteeMember[] = Array.isArray(res) ? res : (res?.data ?? []);
  return raw.map(normalizeCommitteeMember);
}

export async function addCommitteeMember(eventId: string, studentId: string): Promise<void> {
  await api.post(`/events/${eventId}/committee`, { studentId });
}

export async function removeCommitteeMember(eventId: string, studentId: string): Promise<void> {
  await api.delete(`/events/${eventId}/committee/${studentId}`);
}
