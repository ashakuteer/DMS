const RAILWAY_URL = 'https://dms-production-598e.up.railway.app';
const _rawUrl = process.env.NEXT_PUBLIC_API_URL || RAILWAY_URL;

// In the browser, localhost URLs are unreachable (they point to the user's machine).
// Fall back to relative paths so Next.js proxy handles routing in dev.
// In production (Vercel), NEXT_PUBLIC_API_URL is the Railway URL and is used directly.
const API_BASE =
  typeof window !== 'undefined' && _rawUrl.startsWith('http://localhost')
    ? ''
    : _rawUrl;

export async function apiClient<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== 'undefined'
      ? (localStorage.getItem('accessToken') || localStorage.getItem('token'))
      : null;

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = `API error ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.message) {
        errorMessage = Array.isArray(errorBody.message)
          ? errorBody.message.join(', ')
          : String(errorBody.message);
      }
    } catch {
    }
    const err = new Error(errorMessage) as Error & { status: number };
    err.status = response.status;
    throw err;
  }

  if (
    response.status === 204 ||
    response.headers.get('content-length') === '0'
  ) {
    return null as T;
  }

  return response.json() as Promise<T>;
}
