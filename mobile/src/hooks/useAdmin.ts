import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchAdminUsers, setUserRole } from '@/api/admin';
import type { AppRole } from '@/types/admin';

export const adminKeys = {
  users: ['admin', 'users'] as const,
};

export function useAdminUsers() {
  return useQuery({
    queryKey: adminKeys.users,
    queryFn: fetchAdminUsers,
    staleTime: 1000 * 60,
  });
}

export function useSetUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AppRole }) => setUserRole(userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.users }),
  });
}
