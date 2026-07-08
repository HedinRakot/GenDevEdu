import type {
  Course,
  ChapterListModel,
  ChapterContentListModel,
  QuestionListModel,
  Chapter,
  ChapterContent,
  SubmitAttemptRequest,
  AttemptResult,
  CodeSubmissionAccepted,
  CodeSubmissionResult,
  ChapterQuizView,
  SubmitChapterQuizRequest,
  ChapterQuizResult,
} from '@/types/course';
import type { ProgressDto, LearnerStats, Certificate } from '@/types/learner';
import type {
  CreateCourseRequest,
  CreateChapterRequest,
  CreateChapterContentRequest,
  CreateQuestionListRequest,
  SetChapterQuizRequest,
  CourseSummary,
} from '@/types/author';
import { apiClient } from '@/services/apiClient';

// ─── Learner: Read ────────────────────────────────────────────────────────────

export interface CourseFilter {
  search?: string;
  tags?: string[];
  level?: string;
}

export async function fetchCourses(params?: CourseFilter): Promise<Course[]> {
  const query: Record<string, string> = {};
  if (params?.search?.trim()) query.search = params.search.trim();
  if (params?.tags?.length) query.tags = params.tags.join(',');
  if (params?.level) query.level = params.level;
  const { data } = await apiClient.get<Course[]>('/api/courses', { params: query });
  return data;
}

export async function fetchCourseTags(): Promise<string[]> {
  const { data } = await apiClient.get<string[]>('/api/courses/tags');
  return data;
}

export async function fetchChapterList(courseId: string): Promise<ChapterListModel> {
  const { data } = await apiClient.get<ChapterListModel>(
    `/api/courses/${encodeURIComponent(courseId)}/chapters`,
  );
  return data;
}

export async function fetchChapterContent(chapterId: string): Promise<ChapterContentListModel> {
  const { data } = await apiClient.get<ChapterContentListModel>(
    `/api/chapters/${encodeURIComponent(chapterId)}/content`,
  );
  return data;
}

export async function fetchQuestions(questionListId: string): Promise<QuestionListModel> {
  const { data } = await apiClient.get<QuestionListModel>(
    `/api/questionlists/${encodeURIComponent(questionListId)}`,
  );
  return data;
}

// ─── Learner: Progress & Enrollment ──────────────────────────────────────────

export async function enrollInCourse(courseId: string): Promise<void> {
  await apiClient.post('/api/enrollments', { courseId });
}

export async function getProgress(): Promise<ProgressDto[]> {
  const { data } = await apiClient.get<ProgressDto[]>('/api/me/progress');
  return data;
}

export async function getStats(): Promise<LearnerStats> {
  const { data } = await apiClient.get<LearnerStats>('/api/me/stats');
  return data;
}

export async function getCertificates(): Promise<Certificate[]> {
  const { data } = await apiClient.get<Certificate[]>('/api/me/certificates');
  return data;
}

export async function completeChapterContent(contentId: string): Promise<void> {
  await apiClient.post(`/api/content/${encodeURIComponent(contentId)}/complete`);
}

export async function submitAttempt(
  questionId: string,
  req: SubmitAttemptRequest,
): Promise<AttemptResult> {
  const { data } = await apiClient.post<AttemptResult>(
    `/api/questions/${encodeURIComponent(questionId)}/attempt`,
    req,
  );
  return data;
}

// ─── Learner: Code-Aufgaben (F7) ──────────────────────────────────────────────

export async function submitCode(
  questionId: string,
  code: string,
): Promise<CodeSubmissionAccepted> {
  const { data } = await apiClient.post<CodeSubmissionAccepted>('/api/code-submissions', {
    questionId,
    code,
  });
  return data;
}

export async function fetchCodeSubmission(id: string): Promise<CodeSubmissionResult> {
  const { data } = await apiClient.get<CodeSubmissionResult>(
    `/api/code-submissions/${encodeURIComponent(id)}`,
  );
  return data;
}

// ─── Author: Course CRUD ──────────────────────────────────────────────────────

export async function createCourse(req: CreateCourseRequest): Promise<CourseSummary> {
  const { data } = await apiClient.post<CourseSummary>('/api/courses', req);
  return data;
}

export async function publishCourse(courseId: string): Promise<CourseSummary> {
  const { data } = await apiClient.post<CourseSummary>(
    `/api/courses/${encodeURIComponent(courseId)}/publish`,
  );
  return data;
}

export async function addChapter(courseId: string, req: CreateChapterRequest): Promise<Chapter> {
  const { data } = await apiClient.post<Chapter>(
    `/api/courses/${encodeURIComponent(courseId)}/chapters`,
    req,
  );
  return data;
}

export async function addChapterContent(
  chapterId: string,
  req: CreateChapterContentRequest,
): Promise<ChapterContent> {
  const { data } = await apiClient.post<ChapterContent>(
    `/api/chapters/${encodeURIComponent(chapterId)}/content`,
    req,
  );
  return data;
}

export async function updateChapterContent(
  contentId: string,
  req: CreateChapterContentRequest,
): Promise<ChapterContent> {
  const { data } = await apiClient.put<ChapterContent>(
    `/api/content/${encodeURIComponent(contentId)}`,
    req,
  );
  return data;
}

export async function createQuestionList(
  req: CreateQuestionListRequest,
): Promise<QuestionListModel> {
  const { data } = await apiClient.post<QuestionListModel>('/api/questionlists', req);
  return data;
}

// ─── Kapitel-Abschlussquiz (F8) ───────────────────────────────────────────────

export async function getChapterQuiz(chapterId: string): Promise<ChapterQuizView> {
  const { data } = await apiClient.get<ChapterQuizView>(
    `/api/chapters/${encodeURIComponent(chapterId)}/quiz`,
  );
  return data;
}

export async function setChapterQuiz(
  chapterId: string,
  req: SetChapterQuizRequest,
): Promise<ChapterQuizView> {
  const { data } = await apiClient.put<ChapterQuizView>(
    `/api/chapters/${encodeURIComponent(chapterId)}/quiz`,
    req,
  );
  return data;
}

export async function deleteChapterQuiz(chapterId: string): Promise<void> {
  await apiClient.delete(`/api/chapters/${encodeURIComponent(chapterId)}/quiz`);
}

export async function submitChapterQuiz(
  chapterId: string,
  req: SubmitChapterQuizRequest,
): Promise<ChapterQuizResult> {
  const { data } = await apiClient.post<ChapterQuizResult>(
    `/api/chapters/${encodeURIComponent(chapterId)}/quiz/attempt`,
    req,
  );
  return data;
}

// ─── Author: Delete ───────────────────────────────────────────────────────────

export async function deleteCourse(courseId: string): Promise<void> {
  await apiClient.delete(`/api/courses/${encodeURIComponent(courseId)}`);
}

export async function deleteChapter(chapterId: string): Promise<void> {
  await apiClient.delete(`/api/chapters/${encodeURIComponent(chapterId)}`);
}

export async function deleteChapterContent(contentId: string): Promise<void> {
  await apiClient.delete(`/api/content/${encodeURIComponent(contentId)}`);
}
