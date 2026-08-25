// services/admin/panitia.service.ts
import api, { appStorage } from '../api';

const PANITIA_STORAGE_KEY = 'mec_registered_panitia_list';

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
 * Buat akun panitia baru via backend POST /auth/panitia,
 * dan simpan ke persistent storage agar selalu muncul di daftar panitia.
 */
export async function createPanitia(dto: CreatePanitiaDto): Promise<PanitiaItem> {
  const res: any = await api.post('/auth/panitia', dto);
  const createdId = res?.id || res?.data?.id || `panitia-${Date.now()}`;

  const newPanitia: PanitiaItem = {
    id: String(createdId),
    email: dto.email.trim(),
    role: 'PANITIA',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  // Simpan ke local persistent storage
  const currentList = await getLocalPanitiaList();
  const filtered = currentList.filter((p) => p.email.toLowerCase() !== dto.email.trim().toLowerCase());
  const updatedList = [newPanitia, ...filtered];
  await appStorage.setItem(PANITIA_STORAGE_KEY, updatedList);

  return newPanitia;
}

/**
 * Ambil daftar panitia dari storage lokal
 */
export async function getLocalPanitiaList(): Promise<PanitiaItem[]> {
  return await appStorage.getItem<PanitiaItem[]>(PANITIA_STORAGE_KEY, []);
}

/**
 * Ambil daftar panitia: coba dari backend, jika backend 404 (belum ada endpoint GET),
 * fallback secara transparan ke data persistent storage.
 */
export async function getPanitia(): Promise<PanitiaItem[]> {
  try {
    const res: any = await api.get('/auth/panitia');
    const items: PanitiaItem[] = Array.isArray(res) ? res : res?.data || [];
    if (items.length > 0) {
      await appStorage.setItem(PANITIA_STORAGE_KEY, items);
      return items;
    }
  } catch (err: any) {
    // 404 atau network error: gunakan fallback storage lokal
  }

  return await getLocalPanitiaList();
}

/**
 * Toggle status panitia (aktif/non-aktif).
 */
export async function togglePanitiaStatus(id: string, isActive: boolean): Promise<void> {
  try {
    await api.patch(`/auth/panitia/${id}/status`, { isActive });
  } catch (err) {
    // Graceful fallback jika backend patch belum aktif
  }

  // Update persistent local storage
  const list = await getLocalPanitiaList();
  const updated = list.map((p) => (p.id === id ? { ...p, isActive } : p));
  await appStorage.setItem(PANITIA_STORAGE_KEY, updated);
}

/**
 * Hapus akun panitia dari daftar
 */
export async function deletePanitia(id: string): Promise<void> {
  try {
    await api.delete(`/auth/panitia/${id}`);
  } catch (err) {
    // Graceful fallback jika backend delete belum aktif
  }

  const list = await getLocalPanitiaList();
  const updated = list.filter((p) => p.id !== id);
  await appStorage.setItem(PANITIA_STORAGE_KEY, updated);
}

