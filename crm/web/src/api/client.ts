// Schlanker fetch-Wrapper. Relative URLs — im Dev-Modus proxied Vite zur API,
// hinter einem Reverse Proxy funktioniert es unverändert.

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${BASE}${path}`, { ...init, headers });

  if (response.status === 204) return undefined as T;

  const isJson = response.headers.get('content-type')?.includes('json') ?? false;
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = (data as { error?: string } | null)?.error ?? `HTTP ${response.status}`;
    throw new ApiError(response.status, message, (data as { details?: unknown } | null)?.details);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
};
