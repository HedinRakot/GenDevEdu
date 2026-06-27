import type { ChapterContentType, QuestionType } from './course';

export interface TextItemDto {
  text: string;
  language: number;
}

export interface CreateCourseRequest {
  name: string;
  titelItems: TextItemDto[];
}

export interface CreateChapterRequest {
  name: string;
  titelItems: TextItemDto[];
  sortOrder: number;
  show: boolean;
}

export interface CreateChapterContentRequest {
  name: string;
  titelItems: TextItemDto[];
  contentType: ChapterContentType;
  lessonText?: string;
  lessonTexteItems?: TextItemDto[];
  videoUrl?: string;
  sortOrder: number;
}

export interface CreateAnswerRequest {
  isCorrect: boolean;
  titelItems: TextItemDto[];
  comment?: string;
}

export interface CreateCodeTestCaseRequest {
  input: string;
  expectedOutput: string;
  hidden: boolean;
}

export interface CreateCodeQuestionRequest {
  language: number;
  starterCode: string;
  solutionCode: string;
  testCases: CreateCodeTestCaseRequest[];
  timeLimitMs?: number;
  memoryLimitMb?: number;
}

export interface CreateQuestionRequest {
  name: string;
  titelItems: TextItemDto[];
  questionType: QuestionType;
  answers: CreateAnswerRequest[];
  /** Nur bei Code-Fragen (questionType === Code). */
  code?: CreateCodeQuestionRequest;
}

export interface CreateQuestionListRequest {
  chapterContentId: string;
  questions: CreateQuestionRequest[];
}

export interface SetChapterQuizRequest {
  questions: CreateQuestionRequest[];
  passThresholdPercent: number;
  maxAttempts: number;
}

export interface CourseSummary {
  elementId: string;
  name: string;
  status: string;
}
