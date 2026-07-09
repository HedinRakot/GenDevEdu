import type { LearnerStats } from './learner';

// ─── Teilnehmer-Dashboard (GET /api/admin/learners…) ─────────────────────────

export interface AdminLearnerSummary {
  userId: string;
  displayName: string;
  email: string;
  role: string;
  /** Letzte Aktivität innerhalb der letzten 7 Tage. */
  active: boolean;
  lastActivityUtc: string | null;
  /** Sessionisierte Minuten aus F14 (Summe aller Tage). */
  totalLearningMinutes: number;
  overallProgressPercent: number;
  quizAccuracyPercent: number;
  totalAnswered: number;
  activeCourses: number;
  completedCourses: number;
}

export interface ChapterTime {
  chapterId: string;
  chapterName: string;
  minutes: number;
}

export interface CourseTime {
  courseId: string;
  courseName: string;
  minutes: number;
  chapters: ChapterTime[];
}

export interface AttemptHistoryEntry {
  questionId: string;
  /** null = Frage existiert nicht mehr (Quiz wurde ersetzt). */
  questionText: string | null;
  courseId: string;
  courseName: string | null;
  isCorrect: boolean;
  selectedAnswers: string[];
  submittedText: string | null;
  createdAt: string;
}

export interface CodeSubmissionSummary {
  questionId: string;
  status: string;
  outcome: string;
  passedCount: number;
  totalCount: number;
  createdAt: string;
}

export interface ChapterEngagement {
  courseId: string;
  chapterId: string;
  chapterName: string;
  completedContentCount: number;
  totalContentCount: number;
  quizPassed: boolean;
  /** ~Minuten mit Heartbeats in diesem Kapitel (0 = nie aktiv getrackt). */
  minutesTracked: number;
  lastCompletionUtc: string | null;
}

export interface AdminLearnerDetail {
  userId: string;
  displayName: string;
  email: string;
  lastActivityUtc: string | null;
  totalLearningMinutes: number;
  stats: LearnerStats;
  courseTimes: CourseTime[];
  engagement: ChapterEngagement[];
  recentAttempts: AttemptHistoryEntry[];
  recentCodeSubmissions: CodeSubmissionSummary[];
}
