import type { ApiDailyChallenge, SaveDailyChallengeRequest } from '@/types/challenges';
import { apiClient } from '@/services/apiClient';

// ─── Lerner ───────────────────────────────────────────────────────────────────

export async function fetchTodayChallenge(): Promise<ApiDailyChallenge> {
  const { data } = await apiClient.get<ApiDailyChallenge>('/api/daily-challenges/today');
  return data;
}

// ─── Verwaltung (Author/Admin) ────────────────────────────────────────────────

export async function fetchAllChallenges(): Promise<ApiDailyChallenge[]> {
  const { data } = await apiClient.get<ApiDailyChallenge[]>('/api/admin/daily-challenges');
  return data;
}

export async function createChallenge(req: SaveDailyChallengeRequest): Promise<ApiDailyChallenge> {
  const { data } = await apiClient.post<ApiDailyChallenge>('/api/admin/daily-challenges', req);
  return data;
}

export async function updateChallenge(
  id: string,
  req: SaveDailyChallengeRequest,
): Promise<ApiDailyChallenge> {
  const { data } = await apiClient.put<ApiDailyChallenge>(
    `/api/admin/daily-challenges/${encodeURIComponent(id)}`,
    req,
  );
  return data;
}

export async function deleteChallenge(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/daily-challenges/${encodeURIComponent(id)}`);
}
