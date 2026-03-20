const RAILWAY_URL = 'https://dms-production-598e.up.railway.app';
const _rawUrl = process.env.NEXT_PUBLIC_API_URL || RAILWAY_URL;

// In the browser, localhost URLs are unreachable (they point to the user's machine).
// Fall back to relative paths so Next.js proxy handles routing in dev.
// In production (Vercel), NEXT_PUBLIC_API_URL is the Railway URL and is used directly.
const API_BASE =
  typeof window !== 'undefined' && _rawUrl.startsWith('http://localhost')
    ? ''
    : _rawUrl;

let _isRefreshing = false;
let _refreshWaiters: Array<(token: string | null) => void> = [];

async function refreshAccessToken(): Promise<string | null> {
  if (_isRefreshing) {
    return new Promise((resolve) => { _refreshWaiters.push(resolve); });
  }
  _isRefreshing = true;
  try {
    const refreshToken = sessionStorage.getItem('refreshToken');
    if (!refreshToken) { forceLogout(); return null; }

    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) { forceLogout(); _refreshWaiters.forEach((fn) => fn(null)); return null; }

    const data = await res.json();
    const newToken = data?.tokens?.accessToken || data?.accessToken || null;
    if (newToken) {
      sessionStorage.setItem('accessToken', newToken);
      sessionStorage.setItem('token', newToken);
      if (data?.tokens?.refreshToken) {
        sessionStorage.setItem('refreshToken', data.tokens.refreshToken);
      }
    } else {
      forceLogout();
    }
    _refreshWaiters.forEach((fn) => fn(newToken));
    return newToken;
  } finally {
    _isRefreshing = false;
    _refreshWaiters = [];
  }
}

function forceLogout() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('user');
  sessionStorage.setItem('authMessage', 'Your session has expired. Please log in again.');
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}

export async function apiClient<T = unknown>(
  path: string,
  options: RequestInit = {},
  _isRetry = false,
): Promise<T> {
  const token =
    typeof window !== 'undefined'
      ? (sessionStorage.getItem('accessToken') || sessionStorage.getItem('token'))
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

  // Handle token expiry: attempt refresh once, then retry
  if (response.status === 401 && !_isRetry && typeof window !== 'undefined') {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiClient<T>(path, options, true);
    }
    // refreshAccessToken already called forceLogout
    throw Object.assign(new Error('Session expired'), { status: 401 });
  }

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
