import { clearAuth, getToken } from "./auth";
import type {
  AnswerPayload,
  AttemptResult,
  AuthResponse,
  CourseDetail,
  CourseSummary,
  Role,
} from "./types";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

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
  } catch (e) {
    throw new ApiError(0, "Netzwerkfehler. Bitte erneut versuchen.");
  }

  if (res.status === 401) {
    // Token invalid/expired: clear auth and force re-login.
    clearAuth();
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
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

  createCourse(input: {
    title: string;
    description: string;
    tags?: string[];
    level?: string;
  }): Promise<CourseSummary> {
    return request<CourseSummary>("/courses", {
      method: "POST",
      body: input,
    });
  },

  publishCourse(id: string): Promise<void> {
    return request<void>(`/courses/${id}/publish`, { method: "POST" });
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
};
