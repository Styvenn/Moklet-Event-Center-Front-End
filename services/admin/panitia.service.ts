// services/admin/panitia.service.ts
import api from '../api';

export interface PanitiaItem {
  id: string;
  name?: string;
  email: string;
  isActive?: boolean;
  role: 'PANITIA';
  createdAt?: string;
}

export interface CreatePanitiaDto {
  email: string;
  password: string;
}

/**
 * Buat akun panitia baru via backend POST /auth/panitia.
 */
export async function createPanitia(dto: CreatePanitiaDto): Promise<PanitiaItem> {
  const res: any = await api.post('/auth/panitia', dto);
  const createdId = res?.id || res?.data?.id || `panitia-${Date.now()}`;

  return {
    id: String(createdId),
    email: dto.email.trim(),
    role: 'PANITIA',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Ambil daftar panitia dari backend.
 */
export async function getPanitia(): Promise<PanitiaItem[]> {
  const res: any = await api.get('/auth/panitia');
  return Array.isArray(res) ? res : res?.data || [];
}

/**
 * Toggle status panitia (aktif/non-aktif).
 */
export async function togglePanitiaStatus(id: string, isActive: boolean): Promise<void> {
  await api.patch(`/auth/panitia/${id}/status`, { isActive });
}

/**
 * Hapus akun panitia.
 */
export async function deletePanitia(id: string): Promise<void> {
  await api.delete(`/auth/panitia/${id}`);
}
