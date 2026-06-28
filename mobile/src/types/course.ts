// ─── Basis & i18n ────────────────────────────────────────────────────────────

export enum Language {
  Russian = 0,
  German = 1,
  English = 2,
}

export interface TextItem {
  text: string;
  language: Language;
}

export interface Texte {
  items: TextItem[];
}

export interface EntityBase {
  elementId: string;
  name: string;
}

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum ChapterContentType {
  Lesson = 0,
  Video = 1,
  Questions = 2,
}

export enum QuestionType {
  OneChoice = 0,
  MultipleChoice = 1,
  OwnAnswer = 2,
  TrueFalse = 3,
  Code = 4,
}

export enum CodeLanguage {
  CSharp = 0,
}

// ─── Quiz & Fragen ───────────────────────────────────────────────────────────

export interface Answer {
  id: string;
  isCorrect: boolean;
  titel: Texte;
  comment: string;
}

export interface Question extends EntityBase {
  titel: Texte;
  questionType: QuestionType;
  answers: Answer[];
  answerValue: string;
  completed: boolean;
  /** Nur bei Code-Fragen gesetzt. SolutionCode + versteckte Testfall-I/O sind für Lerner ausgeblendet. */
  code?: CodeQuestionView;
}

// ─── Code-Aufgaben (F7) ──────────────────────────────────────────────────────

export interface CodeTestCasePreview {
  id: string;
  hidden: boolean;
  /** null für versteckte Testfälle in der Lerner-Sicht. */
  input: string | null;
  expectedOutput: string | null;
}

export interface CodeQuestionView {
  language: CodeLanguage;
  starterCode: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  testCases: CodeTestCasePreview[];
  /** Nur für Autor/Admin gesetzt. */
  solutionCode: string | null;
}

export interface SubmitCodeRequest {
  questionId: string;
  code: string;
}

export interface CodeSubmissionAccepted {
  id: string;
  status: string;
}

export type CodeSubmissionStatus = 'Queued' | 'Running' | 'Completed' | 'Error';

export interface CodeTestCaseResult {
  testCaseId: string;
  hidden: boolean;
  passed: boolean;
  outcome: string;
  durationMs: number;
  input: string | null;
  expectedOutput: string | null;
  actualOutput: string | null;
  stderr: string | null;
}

export interface CodeSubmissionResult {
  id: string;
  questionId: string;
  status: CodeSubmissionStatus;
  outcome: string;
  passedCount: number;
  totalCount: number;
  durationMs: number;
  compileError: string | null;
  errorMessage: string | null;
  testResults: CodeTestCaseResult[];
}

export interface QuestionListModel {
  questions: Question[];
}

// ─── Attempt (POST /api/questions/{id}/attempt) ──────────────────────────────

export interface SubmitAttemptRequest {
  /** OneChoice → single selected answer id */
  answerId?: string;
  /** MultipleChoice → selected answer ids */
  answerIds?: string[];
  /** OwnAnswer → free-text answer */
  textAnswer?: string;
}

/** Server grading result. `answers` carry the revealed isCorrect + explanation comment. */
export interface AttemptResult {
  isCorrect: boolean;
  score: number;
  answers: Answer[];
}

// ─── Content & Kapitel ───────────────────────────────────────────────────────

export interface ChapterContent extends EntityBase {
  courseId: string;
  chapterId: string;
  titel: Texte;
  contentType: ChapterContentType;
  lessonText: string;
  lessonTexte: Texte;
  videoUrl: string;
  questionListId: string;
  sortOrder: number;
  questionLists: QuestionListModel[];
  averageRank: number;
  maxRank: number;
  completed: boolean;
}

export interface Chapter extends EntityBase {
  courseId: string;
  titel: Texte;
  sortOrder: number;
  show: boolean;
  rank: number;
  completed: boolean;
  questions: Question[];
  chapterContent: ChapterContent[];
  // F8: Kapitel-Abschlussquiz
  hasQuiz: boolean;
  passThresholdPercent: number;
  maxAttempts: number;
  quizPassed: boolean;
}

// ─── Kapitel-Abschlussquiz (F8) ──────────────────────────────────────────────

export interface ChapterQuizView {
  chapterId: string;
  passThresholdPercent: number;
  maxAttempts: number;
  questions: Question[];
  attemptsUsed: number;
  bestPercent: number | null;
  passed: boolean;
  attemptsExhausted: boolean;
}

export interface ChapterQuizAnswer {
  questionId: string;
  answerId?: string;
  answerIds?: string[];
}

export interface SubmitChapterQuizRequest {
  answers: ChapterQuizAnswer[];
}

export interface ChapterQuizResult {
  correctCount: number;
  totalCount: number;
  percent: number;
  passed: boolean;
  attemptNo: number;
  maxAttempts: number;
  /** -1 = unbegrenzt. */
  attemptsRemaining: number;
  questions: Question[];
}

// ─── Kurs-Modelle ────────────────────────────────────────────────────────────

export interface Course extends EntityBase {
  titel: Texte;
  chapters: Chapter[];
  // F11: Katalog
  tags: string[];
  level: string; // "" | Beginner | Intermediate | Advanced
}

// ─── API-Response-Modelle ────────────────────────────────────────────────────

export interface ChapterListModel {
  courseId: string;
  courseName: string;
  chapters: Chapter[];
}

export interface ChapterContentListModel {
  courseId: string;
  chapterId: string;
  chapterName: string;
  chapterContent: ChapterContent[];
}
