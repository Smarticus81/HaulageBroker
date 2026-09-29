/**
 * Thin API client. Talks to the FastAPI gateway when NEXT_PUBLIC_API_URL is set,
 * otherwise callers fall back to the demo dataset (see src/lib/data).
 */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export const apiEnabled = () => BASE.length > 0;

function token(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('haulage.token');
  } catch {
    return null;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `Request failed: ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  get: <T>(p: string) => request<T>('GET', p),
  post: <T>(p: string, b?: unknown) => request<T>('POST', p, b),
  put: <T>(p: string, b?: unknown) => request<T>('PUT', p, b),
  patch: <T>(p: string, b?: unknown) => request<T>('PATCH', p, b),
  del: <T>(p: string) => request<T>('DELETE', p),
};

/** Try the API; if it's disabled or fails, return the fallback. */
export async function withFallback<T>(fn: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
  if (!apiEnabled()) return fallback();
  try {
    return await fn();
  } catch {
    return fallback();
  }
}
