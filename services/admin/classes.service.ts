// services/admin/classes.service.ts
import api, { appStorage } from '../api';

const HIDDEN_CLASSES_KEY = 'mec_hidden_class_ids';

export interface ClassItem {
  id: string;
  grade: 'X' | 'XI' | 'XII';
  name: string;
  _count?: {
    students?: number;
  };
  studentCount?: number;
}

export type GradeOption = 'X' | 'XI' | 'XII';

export interface CreateClassDto {
  grade: GradeOption;
  name: string;
}

export interface UpdateClassDto {
  grade?: GradeOption;
  name?: string;
}

export async function getHiddenClassIds(): Promise<string[]> {
  return await appStorage.getItem<string[]>(HIDDEN_CLASSES_KEY, []);
}

export async function hideClass(id: string): Promise<void> {
  const hidden = await getHiddenClassIds();
  if (!hidden.includes(id)) {
    await appStorage.setItem(HIDDEN_CLASSES_KEY, [...hidden, id]);
  }
}

export async function getClasses(page = 1, limit = 100): Promise<ClassItem[]> {
  const [res, hiddenIds] = await Promise.all([
    api.get(`/classes?page=${page}&limit=${limit}`).catch(() => []),
    getHiddenClassIds(),
  ]);

  let list: ClassItem[] = [];
  if (Array.isArray(res)) {
    list = res;
  } else if ((res as any)?.data && Array.isArray((res as any).data)) {
    list = (res as any).data;
  }

  // Filter kelas yang disembunyikan/diarsipkan
  return list.filter((c) => !hiddenIds.includes(c.id));
}

export async function createClass(dto: CreateClassDto): Promise<ClassItem> {
  const res: any = await api.post('/classes', dto);
  return res?.data || res;
}

export async function updateClass(id: string, dto: UpdateClassDto): Promise<ClassItem> {
  const res: any = await api.patch(`/classes/${id}`, dto);
  return res?.data || res;
}

export async function deleteClass(id: string): Promise<void> {
  await api.delete(`/classes/${id}`);
  // Jika berhasil dihapus di server, bersihkan dari hidden list jika ada
  const hidden = await getHiddenClassIds();
  if (hidden.includes(id)) {
    await appStorage.setItem(HIDDEN_CLASSES_KEY, hidden.filter((h) => h !== id));
  }
}
