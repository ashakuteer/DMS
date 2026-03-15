const RAILWAY_URL = 'https://dms-production-598e.up.railway.app';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? RAILWAY_URL : '');

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}
