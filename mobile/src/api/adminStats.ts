import { apiClient } from '@/services/apiClient';
import type { AdminLearnerSummary, AdminLearnerDetail } from '@/types/adminStats';

// ─── Teilnehmer-Dashboard (AuthorOrAdmin) ─────────────────────────────────────

export async function fetchLearners(): Promise<AdminLearnerSummary[]> {
  const { data } = await apiClient.get<AdminLearnerSummary[]>('/api/admin/learners');
  return data;
}

export async function fetchLearnerStats(userId: string): Promise<AdminLearnerDetail> {
  const { data } = await apiClient.get<AdminLearnerDetail>(
    `/api/admin/learners/${encodeURIComponent(userId)}/stats`,
  );
  return data;
}
