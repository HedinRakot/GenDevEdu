import { apiClient } from '@/services/apiClient';
import type { AdminUser, AppRole } from '@/types/admin';

// ─── Admin: Rollenverwaltung (nur Admin-Rolle) ───────────────────────────────

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const { data } = await apiClient.get<AdminUser[]>('/api/admin/users');
  return data;
}

export async function setUserRole(userId: string, role: AppRole): Promise<AdminUser> {
  const { data } = await apiClient.patch<AdminUser>(
    `/api/admin/users/${encodeURIComponent(userId)}/role`,
    { role },
  );
  return data;
}
