const rawUrl = process.env.NEXT_PUBLIC_API_URL || '';

// In the browser, localhost URLs are unreachable (they point to the user's machine,
// not the server). When NEXT_PUBLIC_API_URL is localhost, fall back to relative paths
// so Next.js proxy handles routing in dev. In production (Vercel), NEXT_PUBLIC_API_URL
// is set to the Railway URL and is used directly by the browser.
export const API_URL =
  typeof window !== 'undefined' && rawUrl.startsWith('http://localhost')
    ? ''
    : rawUrl;

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}
