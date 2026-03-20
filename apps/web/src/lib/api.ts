import { fetchWithAuth } from './auth';

const RAILWAY_URL = 'https://dms-production-598e.up.railway.app';
const _rawUrl = process.env.NEXT_PUBLIC_API_URL || RAILWAY_URL;

// In the browser, localhost URLs are unreachable (they point to the user's machine).
// Fall back to relative paths so Next.js proxy handles routing in dev.
// In production (Vercel), NEXT_PUBLIC_API_URL is the Railway URL and is used directly.
export const API_BASE =
  typeof window !== 'undefined' && _rawUrl.startsWith('http://localhost')
    ? ''
    : _rawUrl;

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
