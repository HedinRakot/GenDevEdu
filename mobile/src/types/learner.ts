export interface ProgressDto {
  courseId: string;
  completedChapterContentIds: string[];
}

// ─── Lerner-Statistiken (F9, GET /api/me/stats) ──────────────────────────────

export interface CourseStat {
  courseId: string;
  courseName: string;
  progressPercent: number;
  completedContent: number;
  totalContent: number;
  chaptersPassed: number;
  totalChapters: number;
  completed: boolean;
}

export interface LearnerStats {
  activeCourses: number;
  completedCourses: number;
  overallProgressPercent: number;
  correctAnswered: number;
  totalAnswered: number;
  quizAccuracyPercent: number;
  chapterQuizzesPassed: number;
  chapterQuizzesTaken: number;
  codeTasksSolved: number;
  codeTasksAttempted: number;
  courses: CourseStat[];
}
