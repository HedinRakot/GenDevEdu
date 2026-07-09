import { useQuery } from '@tanstack/react-query';
import { fetchLearners, fetchLearnerStats } from '@/api/adminStats';

export function useLearners() {
  return useQuery({
    queryKey: ['admin', 'learners'] as const,
    queryFn: fetchLearners,
    staleTime: 1000 * 60 * 2,
  });
}

export function useLearnerStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'learners', userId ?? '', 'stats'] as const,
    queryFn: () => fetchLearnerStats(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}
