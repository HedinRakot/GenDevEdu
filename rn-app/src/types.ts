export type Role = "Learner" | "Author" | "Admin";

export interface User {
  id: string;
  email: string;
  displayName: string;
  roles: Role[];
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface CourseSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  tags: string[];
  level: string;
  status: string;
}

export type ContentBlockKind = "markdown" | "code";

export interface ContentBlock {
  kind: ContentBlockKind;
  text: string;
  language?: string;
}

export interface Example {
  id: string;
  title: string;
  contentBlocks: ContentBlock[];
  language?: string;
  order: number;
}

export type QuestionType = "SingleChoice" | "MultipleChoice" | "TrueFalse";
export type QuestionScope = "Topic" | "Chapter";

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  scope: QuestionScope;
  type: QuestionType;
  prompt: string;
  explanation?: string;
  points: number;
  difficulty: string;
  options?: Option[];
}

export interface Topic {
  id: string;
  title: string;
  order: number;
  examples: Example[];
  questions: Question[];
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  description: string;
  topics: Topic[];
  questions: Question[];
}

export interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  tags: string[];
  level: string;
  status: string;
  chapters: Chapter[];
}

export interface ChapterQuizSummary {
  chapterId: string;
  earnedPoints: number;
  totalPoints: number;
  passingThresholdPct: number;
  passed: boolean;
}

export interface Progress {
  courseId: string;
  completedTopicIds: string[];
  completedChapterIds: string[];
  chapterQuizResults: ChapterQuizSummary[];
}

export interface QuizAnswerResult {
  questionId: string;
  isCorrect: boolean;
  score: number;
  explanation?: string;
}

export interface ChapterQuizResult {
  chapterId: string;
  earnedPoints: number;
  totalPoints: number;
  passingThresholdPct: number;
  passed: boolean;
  results: QuizAnswerResult[];
}

export interface AttemptResult {
  isCorrect: boolean;
  score: number;
  explanation?: string;
}

export type AnswerPayload =
  | { selectedOptionId: string }
  | { selectedOptionIds: string[] }
  | { value: boolean };
