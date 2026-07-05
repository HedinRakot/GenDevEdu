/**
 * F14: Sammelt Anwesenheits-Events (login/logout/heartbeat) in einem
 * AsyncStorage-persistierten Puffer und flusht sie gebündelt ans Backend.
 *
 * Framework-frei (kein React) — vollständig mit Jest testbar.
 * Robustheit: Offline-Puffer überlebt App-Neustarts; Retries sind idempotent
 * (clientEventId ist serverseitig unique); 400-Antworten verwerfen den
 * Poison-Batch, Netzfehler behalten ihn.
 */
import { Platform } from 'react-native';
import { isAxiosError } from 'axios';

import { apiClient } from '@/services/apiClient';
import { getJson, setJson } from '@/store/storage';
import type { AttendanceEventType, PostEventsResponse, TrackedEvent } from '@/types/attendance';

export const ATTENDANCE_BUFFER_KEY = 'attendance.eventBuffer';

const FLUSH_THRESHOLD = 10;
const MAX_BATCH = 500;
const MAX_BUFFER = 2000; // Notbremse gegen unbegrenztes Wachstum bei langem Offline-Betrieb

export interface TrackContext {
  courseId?: string;
  chapterId?: string;
  screen?: string;
}

function newClientEventId(): string {
  const cryptoApi = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  return `ev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

class AttendanceTracker {
  private queue: TrackedEvent[] = [];
  private loaded = false;
  private flushInFlight = false;

  /** Puffer aus AsyncStorage laden (einmalig; ungesendete Events vom letzten Lauf). */
  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;
    const stored = await getJson<TrackedEvent[]>(ATTENDANCE_BUFFER_KEY);
    if (stored?.length) this.queue = [...stored, ...this.queue];
  }

  async track(type: AttendanceEventType, context: TrackContext = {}): Promise<void> {
    await this.ensureLoaded();
    this.queue.push({
      clientEventId: newClientEventId(),
      type,
      occurredAt: new Date().toISOString(),
      platform: Platform.OS,
      ...context,
    });
    if (this.queue.length > MAX_BUFFER) this.queue = this.queue.slice(-MAX_BUFFER);
    await setJson(ATTENDANCE_BUFFER_KEY, this.queue);
    if (this.queue.length >= FLUSH_THRESHOLD) void this.flush();
  }

  /**
   * Puffer ans Backend senden. true = Puffer leer bzw. erfolgreich geflusht.
   * Parallelaufrufe werden ignoriert (In-Flight-Guard).
   */
  async flush(): Promise<boolean> {
    await this.ensureLoaded();
    if (this.flushInFlight) return false;
    if (this.queue.length === 0) return true;

    this.flushInFlight = true;
    try {
      while (this.queue.length > 0) {
        const batch = this.queue.slice(0, MAX_BATCH);
        try {
          await apiClient.post<PostEventsResponse>('/api/attendance/events', { events: batch });
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 400) {
            // Poison-Batch (z. B. veraltete Events) verwerfen, sonst blockiert er ewig.
            console.warn('[attendance] Batch vom Server abgelehnt (400) — verworfen.');
          } else {
            return false; // Netz-/Serverfehler: Puffer behalten, nächster Trigger versucht erneut
          }
        }
        const sent = new Set(batch.map((e) => e.clientEventId));
        this.queue = this.queue.filter((e) => !sent.has(e.clientEventId));
        await setJson(ATTENDANCE_BUFFER_KEY, this.queue);
      }
      return true;
    } finally {
      this.flushInFlight = false;
    }
  }

  get pendingCount(): number {
    return this.queue.length;
  }

  /** Nur für Tests: Singleton-Zustand zurücksetzen. */
  __resetForTests(): void {
    this.queue = [];
    this.loaded = false;
    this.flushInFlight = false;
  }
}

export const attendanceTracker = new AttendanceTracker();
