/**
 * F14: API-Aufrufe des Anwesenheitsnachweises (Auth via apiClient-Interceptor).
 */
import { apiClient } from '@/services/apiClient';
import type {
  AttendanceSession,
  DailyAttendance,
  Excuse,
  ExcuseReason,
  LearnerDayOverview,
  LearnerRangeOverview,
  PostEventsResponse,
  TrackedEvent,
  TrainingPeriod,
} from '@/types/attendance';

// ── Tracking (Learner) ────────────────────────────────────────────────────────

export async function postAttendanceEvents(events: TrackedEvent[]): Promise<PostEventsResponse> {
  const { data } = await apiClient.post<PostEventsResponse>('/api/attendance/events', { events });
  return data;
}

export async function fetchMyAttendance(from: string, to: string): Promise<DailyAttendance[]> {
  const { data } = await apiClient.get<DailyAttendance[]>('/api/attendance/me', {
    params: { from, to },
  });
  return data;
}

// ── Lehrer/Admin ──────────────────────────────────────────────────────────────

export async function fetchOverview(date?: string): Promise<LearnerDayOverview[]> {
  const { data } = await apiClient.get<LearnerDayOverview[]>('/api/attendance/overview', {
    params: date ? { date } : undefined,
  });
  return data;
}

export async function fetchRangeOverview(from: string, to: string): Promise<LearnerRangeOverview[]> {
  const { data } = await apiClient.get<LearnerRangeOverview[]>('/api/attendance/overview/range', {
    params: { from, to },
  });
  return data;
}

export async function fetchLearnerDays(
  userId: string,
  from: string,
  to: string,
): Promise<DailyAttendance[]> {
  const { data } = await apiClient.get<DailyAttendance[]>(
    `/api/attendance/learners/${encodeURIComponent(userId)}`,
    { params: { from, to } },
  );
  return data;
}

export async function fetchSessions(userId: string, date: string): Promise<AttendanceSession[]> {
  const { data } = await apiClient.get<AttendanceSession[]>(
    `/api/attendance/learners/${encodeURIComponent(userId)}/days/${date}/sessions`,
  );
  return data;
}

export async function createExcuse(input: {
  userId: string;
  from: string;
  to: string;
  reason: ExcuseReason;
  note?: string;
}): Promise<Excuse[]> {
  const { data } = await apiClient.post<Excuse[]>('/api/attendance/excuses', input);
  return data;
}

export async function fetchExcuses(userId: string, from: string, to: string): Promise<Excuse[]> {
  const { data } = await apiClient.get<Excuse[]>('/api/attendance/excuses', {
    params: { userId, from, to },
  });
  return data;
}

export async function deleteExcuse(id: string): Promise<void> {
  await apiClient.delete(`/api/attendance/excuses/${encodeURIComponent(id)}`);
}

// ── Admin: Maßnahmezeiträume + Exporte ────────────────────────────────────────

export async function fetchPeriods(userId?: string): Promise<TrainingPeriod[]> {
  const { data } = await apiClient.get<TrainingPeriod[]>('/api/admin/attendance/periods', {
    params: userId ? { userId } : undefined,
  });
  return data;
}

export async function createPeriod(input: {
  userId: string;
  startDate: string;
  endDate: string;
  requiredMinutesPerDay: number;
  label?: string;
}): Promise<TrainingPeriod> {
  const { data } = await apiClient.post<TrainingPeriod>('/api/admin/attendance/periods', input);
  return data;
}

export async function updatePeriod(
  id: string,
  input: {
    userId: string;
    startDate: string;
    endDate: string;
    requiredMinutesPerDay: number;
    label?: string;
  },
): Promise<TrainingPeriod> {
  const { data } = await apiClient.put<TrainingPeriod>(
    `/api/admin/attendance/periods/${encodeURIComponent(id)}`,
    input,
  );
  return data;
}

export async function deletePeriod(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/attendance/periods/${encodeURIComponent(id)}`);
}

/** Export-Pfade (Download läuft über utils/downloadFile, nicht über Axios-JSON). */
export const attendanceExportPaths = {
  eventsCsv: (userId: string, from: string, to: string) =>
    `/api/admin/attendance/export/events.csv?userId=${encodeURIComponent(userId)}&from=${from}&to=${to}`,
  dailyCsv: (from: string, to: string, userId?: string) =>
    `/api/admin/attendance/export/daily.csv?from=${from}&to=${to}` +
    (userId ? `&userId=${encodeURIComponent(userId)}` : ''),
  reportPdf: (userId: string, year: number, month: number) =>
    `/api/admin/attendance/export/report.pdf?userId=${encodeURIComponent(userId)}&year=${year}&month=${month}`,
};
