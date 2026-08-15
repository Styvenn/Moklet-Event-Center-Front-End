// services/panitia/announcements.service.ts
import api from '../api';

export interface RawAnnouncement {
  id: string;
  title: string;
  content: string;
  eventId?: string | null;
  authorId?: string;
  author?: { id: string; email: string; role?: string; student?: { name?: string } | null };
  event?: { id: string; name: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  eventId: string | null;
  eventName: string | null;
  authorName: string;
  createdAt: string;
}

export interface PaginatedAnnouncements {
  data: AnnouncementItem[];
  total: number;
  page: number;
  limit: number;
}

export function normalizeAnnouncement(raw: RawAnnouncement): AnnouncementItem {
  const authorName =
    raw.author?.student?.name ||
    raw.author?.email?.split('@')[0] ||
    'Panitia';
  return {
    id: raw.id,
    title: raw.title || '',
    content: raw.content || '',
    eventId: raw.eventId || null,
    eventName: raw.event?.name || null,
    authorName,
    createdAt: raw.createdAt || '',
  };
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  eventId?: string;
}

export type UpdateAnnouncementDto = Partial<Pick<CreateAnnouncementDto, 'title' | 'content'>>;

export async function getAnnouncements(
  page = 1,
  limit = 50,
  eventId?: string
): Promise<PaginatedAnnouncements> {
  let url = `/announcements?page=${page}&limit=${limit}`;
  if (eventId) url += `&eventId=${eventId}`;
  const res: any = await api.get(url);

  // Backend can return paginated { data, meta } or plain array
  let rawList: RawAnnouncement[];
  let total = 0;
  if (Array.isArray(res)) {
    rawList = res;
    total = res.length;
  } else if (Array.isArray(res?.data)) {
    rawList = res.data;
    total = res?.meta?.total ?? res.data.length;
  } else {
    rawList = [];
  }

  return {
    data: rawList.map(normalizeAnnouncement),
    total,
    page,
    limit,
  };
}

export async function createAnnouncement(dto: CreateAnnouncementDto): Promise<AnnouncementItem> {
  const res: any = await api.post('/announcements', dto);
  return normalizeAnnouncement(res?.data ?? res);
}

export async function updateAnnouncement(id: string, dto: UpdateAnnouncementDto): Promise<AnnouncementItem> {
  const res: any = await api.patch(`/announcements/${id}`, dto);
  return normalizeAnnouncement(res?.data ?? res);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await api.delete(`/announcements/${id}`);
}
