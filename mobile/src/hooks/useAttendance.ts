/** F14: TanStack-Query-Hooks des Anwesenheitsnachweises (Lehrer/Admin-UI). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createExcuse,
  createPeriod,
  deleteExcuse,
  deletePeriod,
  fetchExcuses,
  fetchLearnerDays,
  fetchOverview,
  fetchPeriods,
  fetchRangeOverview,
  updatePeriod,
} from '@/api/attendance';

export const attendanceKeys = {
  all: ['attendance'] as const,
  overview: (date: string) => ['attendance', 'overview', date] as const,
  range: (from: string, to: string) => ['attendance', 'range', from, to] as const,
  learner: (userId: string, from: string, to: string) =>
    ['attendance', 'learner', userId, from, to] as const,
  excuses: (userId: string, from: string, to: string) =>
    ['attendance', 'excuses', userId, from, to] as const,
  periods: (userId?: string) => ['attendance', 'periods', userId ?? 'all'] as const,
};

export function useAttendanceOverview(date: string) {
  return useQuery({
    queryKey: attendanceKeys.overview(date),
    queryFn: () => fetchOverview(date),
  });
}

export function useAttendanceRange(from: string, to: string) {
  return useQuery({
    queryKey: attendanceKeys.range(from, to),
    queryFn: () => fetchRangeOverview(from, to),
  });
}

export function useLearnerDays(userId: string, from: string, to: string) {
  return useQuery({
    queryKey: attendanceKeys.learner(userId, from, to),
    queryFn: () => fetchLearnerDays(userId, from, to),
  });
}

export function useExcuses(userId: string, from: string, to: string) {
  return useQuery({
    queryKey: attendanceKeys.excuses(userId, from, to),
    queryFn: () => fetchExcuses(userId, from, to),
  });
}

export function usePeriods(userId?: string) {
  return useQuery({
    queryKey: attendanceKeys.periods(userId),
    queryFn: () => fetchPeriods(userId),
  });
}

/** Entschuldigungen/Zeiträume ändern den abgeleiteten Status vieler Ansichten →
 *  pauschal alle Attendance-Queries invalidieren (Datenmengen sind klein). */
function useInvalidateAttendance() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: attendanceKeys.all });
}

export function useCreateExcuse() {
  const invalidate = useInvalidateAttendance();
  return useMutation({ mutationFn: createExcuse, onSuccess: invalidate });
}

export function useDeleteExcuse() {
  const invalidate = useInvalidateAttendance();
  return useMutation({ mutationFn: deleteExcuse, onSuccess: invalidate });
}

export function useCreatePeriod() {
  const invalidate = useInvalidateAttendance();
  return useMutation({ mutationFn: createPeriod, onSuccess: invalidate });
}

export function useUpdatePeriod() {
  const invalidate = useInvalidateAttendance();
  return useMutation({
    mutationFn: ({ id, ...input }: Parameters<typeof updatePeriod>[1] & { id: string }) =>
      updatePeriod(id, input),
    onSuccess: invalidate,
  });
}

export function useDeletePeriod() {
  const invalidate = useInvalidateAttendance();
  return useMutation({ mutationFn: deletePeriod, onSuccess: invalidate });
}
