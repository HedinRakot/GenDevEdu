/**
 * F14: Typen des AZAV-Anwesenheitsnachweises — Spiegel der Backend-DTOs
 * (backend/Dtos/AttendanceDtos.cs). Enums reisen als camelCase-Strings.
 */

export type AttendanceEventType = 'login' | 'logout' | 'heartbeat';

export type DayStatus = 'anwesend' | 'teilweise' | 'fehlend' | 'entschuldigt' | 'keinSolltag';

export type ExcuseReason = 'krank' | 'urlaub' | 'feiertag' | 'sonstig';

export interface TrackedEvent {
  clientEventId: string;
  type: AttendanceEventType;
  occurredAt: string; // ISO-UTC
  courseId?: string;
  chapterId?: string;
  screen?: string;
  platform?: string;
}

export interface PostEventsResponse {
  accepted: number;
  duplicates: number;
  rejected: number;
}

export interface DailyAttendance {
  date: string; // yyyy-MM-dd
  minutes: number;
  requiredMinutes: number;
  status: DayStatus;
  firstActivityUtc?: string | null;
  lastActivityUtc?: string | null;
  sessionCount: number;
  excuseReason?: ExcuseReason | null;
  excuseNote?: string | null;
}

export interface LearnerDayOverview {
  userId: string;
  displayName: string;
  email: string;
  status: DayStatus;
  minutes: number;
  requiredMinutes: number;
  firstActivityUtc?: string | null;
  lastActivityUtc?: string | null;
  excuseReason?: ExcuseReason | null;
}

export interface LearnerRangeOverview {
  userId: string;
  displayName: string;
  email: string;
  targetDays: number;
  presentDays: number;
  partialDays: number;
  excusedDays: number;
  absentDays: number;
  totalMinutes: number;
  lastActiveDate?: string | null;
}

export interface AttendanceSession {
  startUtc: string;
  endUtc: string;
  minutes: number;
  courseId?: string | null;
  screen?: string | null;
}

export interface Excuse {
  id: string;
  userId: string;
  date: string;
  reason: ExcuseReason;
  note?: string | null;
  createdBy: string;
  createdAt: string;
}

export interface TrainingPeriod {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  requiredMinutesPerDay: number;
  label?: string | null;
}
