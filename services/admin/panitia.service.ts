// services/admin/panitia.service.ts
import api from '../api';

export interface PanitiaItem {
  id: string;
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
 * Buat akun panitia baru. Endpoint ini sudah tersedia.
 */
export async function createPanitia(dto: CreatePanitiaDto): Promise<any> {
  const res: any = await api.post('/auth/panitia', dto);
  return res?.data || res;
}

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
