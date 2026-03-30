const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type FetchOptions = RequestInit & { skipRefresh?: boolean };

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Auto-refresh on 401
  if (res.status === 401 && !options.skipRefresh) {
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshRes.ok) {
      // Retry original request
      return apiFetch<T>(path, { ...options, skipRefresh: true });
    }
    // Redirect to login (locale-aware)
    if (typeof window !== 'undefined') {
      const locale = window.location.pathname.split('/')[1] || 'ko';
      window.location.href = `/${locale}/login`;
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(error.message || 'API Error'), {
      status: res.status,
      code: error.code,
    });
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string, options?: FetchOptions) =>
    apiFetch<T>(path, { method: 'GET', ...options }),
  post: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body), ...options }),
  patch: <T>(path: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  delete: <T>(path: string, options?: FetchOptions) =>
    apiFetch<T>(path, { method: 'DELETE', ...options }),
};
