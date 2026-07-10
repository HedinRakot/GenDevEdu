import { clearAuth, getToken } from "./auth";
import type {
  AnswerPayload,
  AttemptResult,
  AuthResponse,
  ChapterQuizResult,
  CourseDetail,
  CourseSummary,
  Progress,
  Role,
} from "./types";

// Point to your backend. In development, set this to the local/cluster address.
const BASE_URL = "http://localhost:8080/api";

let _onUnauthorized: (() => void) | null = null;

export function configureApi(opts: { onUnauthorized: () => void }): void {
  _onUnauthorized = opts.onUnauthorized;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = opts;

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Netzwerkfehler. Bitte erneut versuchen.");
  }

  if (res.status === 401) {
    clearAuth();
    _onUnauthorized?.();
    throw new ApiError(401, "Nicht authentifiziert.");
  }

  if (!res.ok) {
    let message = `Anfrage fehlgeschlagen (${res.status})`;
    let details: unknown;
    try {
      const data = await res.json();
      if (data && typeof data === "object") {
        if (typeof data.error === "string") message = data.error;
        details = data.details;
      }
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new ApiError(res.status, message, details);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export const api = {
  login(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
  },

  register(
    email: string,
    displayName: string,
    password: string,
    role: Role,
  ): Promise<AuthResponse> {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: { email, displayName, password, role },
      auth: false,
    });
  },

  listCourses(): Promise<CourseSummary[]> {
    return request<CourseSummary[]>("/courses");
  },

  getCourse(id: string): Promise<CourseDetail> {
    return request<CourseDetail>(`/courses/${id}`);
  },

  enroll(courseId: string): Promise<unknown> {
    return request<unknown>("/enrollments", {
      method: "POST",
      body: { courseId },
    });
  },

  submitAttempt(
    questionId: string,
    answer: AnswerPayload,
  ): Promise<AttemptResult> {
    return request<AttemptResult>(`/questions/${questionId}/attempts`, {
      method: "POST",
      body: { answer },
    });
  },

  completeTopic(topicId: string): Promise<void> {
    return request<void>(`/topics/${topicId}/complete`, { method: "POST" });
  },

  getProgress(): Promise<Progress[]> {
    return request<Progress[]>("/me/progress");
  },

  submitChapterQuiz(
    chapterId: string,
    answers: { questionId: string; answer: AnswerPayload }[],
  ): Promise<ChapterQuizResult> {
    return request<ChapterQuizResult>(`/chapters/${chapterId}/quiz/submit`, {
      method: "POST",
      body: { answers },
    });
  },
};
