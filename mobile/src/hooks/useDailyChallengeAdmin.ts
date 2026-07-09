import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
} from '@/api/challenges';
import type { SaveDailyChallengeRequest } from '@/types/challenges';

const challengeKeys = {
  all: ['daily-challenge'] as const,
  adminList: ['daily-challenge', 'admin-list'] as const,
};

export function useAdminChallenges() {
  return useQuery({
    queryKey: challengeKeys.adminList,
    queryFn: fetchAllChallenges,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id?: string; req: SaveDailyChallengeRequest }) =>
      id ? updateChallenge(id, req) : createChallenge(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: challengeKeys.all }),
  });
}

export function useDeleteChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteChallenge(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: challengeKeys.all }),
  });
}
