// services/admin/classes.service.ts
import api from '../api';

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

export async function getClasses(page = 1, limit = 100): Promise<ClassItem[]> {
  const res: any = await api.get(`/classes?page=${page}&limit=${limit}`);
  return Array.isArray(res) ? res : res?.data || [];
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
}
