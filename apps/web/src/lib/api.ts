import { fetchWithAuth } from './auth';

export const API_BASE =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://dms-production-598e.up.railway.app'
        : 'http://localhost:3001')
    : '';

/**
 * Authenticated fetch. Prepends API_BASE only when path is relative.
 * Passes auth token and handles 401/refresh via fetchWithAuth.
 * Returns the raw Response so callers can check res.ok and parse as needed.
 */
export async function apiFetch(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  return fetchWithAuth(url, options);
}
