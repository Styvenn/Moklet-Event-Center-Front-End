// services/admin/students.service.ts
import { Linking } from 'react-native';
import api, { API_URL } from '../api';

export interface StudentItem {
  id: string;
  name: string;
  nis: string;
  angkatan?: number | string; // TODO(backend gap #3): field ini belum ada di CreateStudentDto
  class?: {
    id: string;
    grade: string;
    name: string;
  };
  classId?: string;
  avatarUrl?: string;
  account?: {
    id: string;
    email: string;
  } | null;
}

export interface PaginatedStudents {
  data: StudentItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateStudentDto {
  name: string;
  nis: string;
  classId: string;
}

export interface UpdateStudentDto {
  name?: string;
  nis?: string;
  classId?: string;
}

export interface BindManualDto {
  accountId?: string;
  email?: string;
}

export interface ImportResult {
  successCount?: number;
  failedCount?: number;
  errors?: string[];
  message?: string;
}

export interface RosterSyncPreviewResult {
  added?: number;
  updated?: number;
  graduated?: number;
  preview?: any[];
  message?: string;
}

export interface RosterSyncExecuteResult {
  success?: boolean;
  message?: string;
  stats?: {
    added?: number;
    updated?: number;
    graduated?: number;
  };
}

/**
 * Ambil daftar siswa dengan paginasi.
 */
export async function getStudents(page = 1, limit = 50): Promise<PaginatedStudents> {
  const res: any = await api.get(`/students?page=${page}&limit=${limit}`);
  if (res?.data && Array.isArray(res.data)) {
    return { data: res.data, meta: res.meta || { total: res.data.length, page, limit, totalPages: 1 } };
  }
  if (Array.isArray(res)) {
    return { data: res, meta: { total: res.length, page, limit, totalPages: 1 } };
  }
  return { data: [], meta: { total: 0, page, limit, totalPages: 1 } };
}

export async function createStudent(dto: CreateStudentDto): Promise<StudentItem> {
  try {
    const res: any = await api.post('/students', dto);
    return res?.data || res;
  } catch (error: any) {
    console.error('[ERROR createStudent]:', error?.response?.data || error);
    throw error;
  }
}

export async function updateStudent(id: string, dto: UpdateStudentDto): Promise<StudentItem> {
  try {
    const res: any = await api.patch(`/students/${id}`, dto);
    return res?.data || res;
  } catch (error: any) {
    console.error(`[ERROR updateStudent] ID ${id}:`, error?.response?.data || error);
    throw error;
  }
}

export async function deleteStudent(id: string): Promise<void> {
  try {
    await api.delete(`/students/${id}`);
  } catch (error: any) {
    console.error(`[ERROR deleteStudent] ID ${id}:`, error?.response?.data || error);
    throw error;
  }
}

/**
 * Manual bind akun ke siswa via PATCH /students/:id/bind-manual
 */
export async function bindManualStudent(id: string, dto: BindManualDto): Promise<StudentItem> {
  try {
    const res: any = await api.patch(`/students/${id}/bind-manual`, dto);
    return res?.data || res;
  } catch (error: any) {
    console.error(`[ERROR bindManualStudent] ID ${id}:`, error?.response?.data || error);
    throw error;
  }
}

/**
 * Upload file Excel siswa ke POST /students/import (multipart/form-data).
 */
export async function importStudentsExcel(fileUri: string, fileName: string, mimeType: string): Promise<ImportResult> {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);

    const res: any = await api.post('/students/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res?.data || res;
  } catch (error: any) {
    console.error('[ERROR importStudentsExcel]:', error?.response?.data || error);
    throw error;
  }
}

/**
 * Dapatkan URL ekspor promosi kelas (GET /students/export-for-promotion).
 */
export function getExportPromotionUrl(): string {
  return `${API_URL}/students/export-for-promotion`;
}

/**
 * Buka URL ekspor promosi kelas di browser/download.
 */
export async function exportStudentsForPromotion(): Promise<void> {
  try {
    const url = getExportPromotionUrl();
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(url);
    }
  } catch (error: any) {
    console.error('[ERROR exportStudentsForPromotion]:', error);
    throw error;
  }
}

/**
 * Eksekusi import promosi kelas (POST /students/import-promotion).
 */
export async function importStudentsPromotion(fileUri: string, fileName: string, mimeType: string): Promise<ImportResult> {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);

    const res: any = await api.post('/students/import-promotion', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res?.data || res;
  } catch (error: any) {
    console.error('[ERROR importStudentsPromotion]:', error?.response?.data || error);
    throw error;
  }
}

/**
 * Preview sync roster (POST /students/sync/preview).
 */
export async function previewRosterSync(fileUri: string, fileName: string, mimeType: string): Promise<RosterSyncPreviewResult> {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);

    const res: any = await api.post('/students/sync/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res?.data || res;
  } catch (error: any) {
    console.error('[ERROR previewRosterSync]:', error?.response?.data || error);
    throw error;
  }
}

/**
 * Eksekusi sync roster (POST /students/sync/execute).
 */
export async function executeRosterSync(data?: any): Promise<RosterSyncExecuteResult> {
  try {
    const res: any = await api.post('/students/sync/execute', data || {});
    return res?.data || res;
  } catch (error: any) {
    console.error('[ERROR executeRosterSync]:', error?.response?.data || error);
    throw error;
  }
}

/**
 * Upload avatar siswa ke PATCH /students/me/avatar (multipart/form-data).
 */
export async function uploadStudentAvatar(fileUri: string, fileName = 'avatar.jpg', mimeType = 'image/jpeg'): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);

    const res: any = await api.patch('/students/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res?.data || res;
  } catch (error: any) {
    console.error('[ERROR uploadStudentAvatar]:', error?.response?.data || error);
    throw error;
  }
}

