import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchCourses,
  fetchCourseTags,
  type CourseFilter,
  fetchChapterList,
  fetchChapterContent,
  fetchQuestions,
  completeChapterContent,
  submitAttempt,
  submitCode,
  fetchCodeSubmission,
  enrollInCourse,
  getProgress,
  getStats,
  getCertificates,
  createCourse,
  publishCourse,
  addChapter,
  addChapterContent,
  updateChapterContent,
  createQuestionList,
  updateQuestionList,
  deleteCourse,
  deleteChapter,
  deleteChapterContent,
  getChapterQuiz,
  setChapterQuiz,
  deleteChapterQuiz,
  submitChapterQuiz,
} from '@/api/courses';
import type { SubmitAttemptRequest, SubmitChapterQuizRequest } from '@/types/course';
import type {
  CreateCourseRequest,
  CreateChapterRequest,
  CreateChapterContentRequest,
  CreateQuestionListRequest,
  SetChapterQuizRequest,
} from '@/types/author';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  chapters: (courseId: string) => [...courseKeys.all, 'chapters', courseId] as const,
  content: (chapterId: string) => [...courseKeys.all, 'content', chapterId] as const,
  questions: (qlId: string) => [...courseKeys.all, 'questions', qlId] as const,
  codeSubmission: (id: string) => [...courseKeys.all, 'code-submission', id] as const,
  chapterQuiz: (chapterId: string) => [...courseKeys.all, 'chapter-quiz', chapterId] as const,
  progress: ['progress'] as const,
};

// ─── Learner: Read ────────────────────────────────────────────────────────────

export function useCourses(params?: CourseFilter) {
  return useQuery({
    queryKey: [...courseKeys.lists(), params ?? {}] as const,
    queryFn: () => fetchCourses(params),
    staleTime: 1000 * 60 * 15,
  });
}

export function useCourseTags() {
  return useQuery({
    queryKey: [...courseKeys.all, 'tags'] as const,
    queryFn: fetchCourseTags,
    staleTime: 1000 * 60 * 30,
  });
}

export function useChapterList(courseId: string) {
  return useQuery({
    queryKey: courseKeys.chapters(courseId),
    queryFn: () => fetchChapterList(courseId),
    staleTime: 1000 * 60 * 10,
    enabled: !!courseId,
  });
}

export function useChapterContent(chapterId: string) {
  return useQuery({
    queryKey: courseKeys.content(chapterId),
    queryFn: () => fetchChapterContent(chapterId),
    staleTime: 1000 * 60 * 10,
    enabled: !!chapterId,
  });
}

export function useQuestions(questionListId: string | undefined) {
  return useQuery({
    queryKey: courseKeys.questions(questionListId ?? ''),
    queryFn: () => fetchQuestions(questionListId!),
    staleTime: 1000 * 60 * 30,
    enabled: !!questionListId,
  });
}

// ─── Learner: Progress & Enrollment ──────────────────────────────────────────

export function useProgress() {
  return useQuery({
    queryKey: courseKeys.progress,
    queryFn: getProgress,
    staleTime: 1000 * 60 * 5,
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'] as const,
    queryFn: getStats,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCertificates() {
  return useQuery({
    queryKey: ['certificates'] as const,
    queryFn: getCertificates,
    staleTime: 1000 * 60 * 5,
  });
}

export function useEnrollment() {
  return useMutation({ mutationFn: enrollInCourse });
}

export function useCompleteContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: completeChapterContent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.all });
      qc.invalidateQueries({ queryKey: courseKeys.progress });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['certificates'] });
    },
  });
}

export function useSubmitAttempt() {
  return useMutation({
    mutationFn: ({ questionId, req }: { questionId: string; req: SubmitAttemptRequest }) =>
      submitAttempt(questionId, req),
  });
}

// ─── Learner: Code-Aufgaben (F7) ──────────────────────────────────────────────

export function useSubmitCode() {
  return useMutation({
    mutationFn: ({ questionId, code }: { questionId: string; code: string }) =>
      submitCode(questionId, code),
  });
}

/** Pollt das Ergebnis einer Code-Einreichung, bis der Status terminal ist. */
export function usePollCodeSubmission(id: string | undefined) {
  return useQuery({
    queryKey: courseKeys.codeSubmission(id ?? ''),
    queryFn: () => fetchCodeSubmission(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'Completed' || status === 'Error' ? false : 1500;
    },
  });
}

// ─── Kapitel-Abschlussquiz (F8) ───────────────────────────────────────────────

export function useChapterQuiz(chapterId: string | undefined) {
  return useQuery({
    queryKey: courseKeys.chapterQuiz(chapterId ?? ''),
    queryFn: () => getChapterQuiz(chapterId!),
    enabled: !!chapterId,
    // 404 = Kapitel hat (noch) kein Quiz; nicht wiederholen.
    retry: false,
  });
}

export function useSetChapterQuiz(chapterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: SetChapterQuizRequest) => setChapterQuiz(chapterId, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.chapterQuiz(chapterId) });
      qc.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}

export function useDeleteChapterQuiz(chapterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteChapterQuiz(chapterId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.chapterQuiz(chapterId) });
      qc.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}

export function useSubmitChapterQuiz(chapterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: SubmitChapterQuizRequest) => submitChapterQuiz(chapterId, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.chapterQuiz(chapterId) });
      qc.invalidateQueries({ queryKey: courseKeys.progress });
      qc.invalidateQueries({ queryKey: courseKeys.all });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['certificates'] });
    },
  });
}

// ─── Author: Mutations ────────────────────────────────────────────────────────

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateCourseRequest) => createCourse(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.lists() }),
  });
}

export function usePublishCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => publishCourse(courseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.lists() }),
  });
}

export function useAddChapter(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateChapterRequest) => addChapter(courseId, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.chapters(courseId) }),
  });
}

export function useAddChapterContent(chapterId: string, courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateChapterContentRequest) => addChapterContent(chapterId, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.chapters(courseId) });
      qc.invalidateQueries({ queryKey: courseKeys.content(chapterId) });
    },
  });
}

export function useUpdateChapterContent(chapterId: string, courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contentId, req }: { contentId: string; req: CreateChapterContentRequest }) =>
      updateChapterContent(contentId, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.chapters(courseId) });
      qc.invalidateQueries({ queryKey: courseKeys.content(chapterId) });
    },
  });
}

export function useCreateQuestionList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateQuestionListRequest) => createQuestionList(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.all }),
  });
}

export function useUpdateQuestionList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      questionListId,
      questions,
    }: {
      questionListId: string;
      questions: CreateQuestionListRequest['questions'];
    }) => updateQuestionList(questionListId, questions),
    onSuccess: (_data, { questionListId }) => {
      qc.invalidateQueries({ queryKey: courseKeys.questions(questionListId) });
      qc.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}

// ─── Author: Delete ───────────────────────────────────────────────────────────

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => deleteCourse(courseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.all }),
  });
}

export function useDeleteChapter(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chapterId: string) => deleteChapter(chapterId),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.chapters(courseId) }),
  });
}

export function useDeleteChapterContent(chapterId: string, courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contentId: string) => deleteChapterContent(contentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.chapters(courseId) });
      qc.invalidateQueries({ queryKey: courseKeys.content(chapterId) });
    },
  });
}
