const RAILWAY_URL = 'https://dms-production-598e.up.railway.app';

const _rawUrl = process.env.NEXT_PUBLIC_API_URL || RAILWAY_URL;

// In the browser, localhost URLs are unreachable (they point to the user's machine).
// Fall back to relative paths so Next.js proxy handles routing in dev.
// In production (Vercel), NEXT_PUBLIC_API_URL is the Railway URL and is used directly.
const API_URL =
  typeof window !== 'undefined' && _rawUrl.startsWith('http://localhost')
    ? ''
    : _rawUrl;

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'FOUNDER' | 'ADMIN' | 'STAFF';
  phone?: string;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export const authStorage = {
  getAccessToken: () => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('accessToken') || sessionStorage.getItem('token');
  },
  getRefreshToken: () => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('refreshToken');
  },
  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  setTokens: (tokens: AuthTokens) => {
    sessionStorage.setItem('accessToken', tokens.accessToken);
    sessionStorage.setItem('token', tokens.accessToken);
    sessionStorage.setItem('refreshToken', tokens.refreshToken);
  },
  setUser: (user: User) => {
    sessionStorage.setItem('user', JSON.stringify(user));
  },
  clear: () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
  },
};

export async function sendOtp(phone: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to send OTP');
  }

  return res.json();
}

export async function verifyOtp(phone: string, code: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'OTP verification failed');
  }

  const data: AuthResponse = await res.json();
  authStorage.setTokens(data.tokens);
  authStorage.setUser(data.user);
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Login failed');
  }

  const data: AuthResponse = await res.json();
  authStorage.setTokens(data.tokens);
  authStorage.setUser(data.user);
  return data;
}

export async function logout(): Promise<void> {
  const token = authStorage.getAccessToken();
  if (token) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (e) {
      // Ignore errors on logout
    }
  }
  authStorage.clear();
}

// Mutex to prevent multiple concurrent refresh requests
let isRefreshing = false;
let refreshPromise: Promise<AuthResponse | null> | null = null;

export async function refreshTokens(): Promise<AuthResponse | null> {
  // If already refreshing, wait for the existing refresh to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) {
    handleAuthFailure();
    return null;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        handleAuthFailure();
        return null;
      }

      const data: AuthResponse = await res.json();
      authStorage.setTokens(data.tokens);
      authStorage.setUser(data.user);
      return data;
    } catch (e) {
      handleAuthFailure();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Handle authentication failure - clear storage and redirect to login
function handleAuthFailure() {
  authStorage.clear();
  if (typeof window !== 'undefined') {
    // Store a message to display on the login page
    sessionStorage.setItem('authMessage', 'Your session has expired. Please log in again.');
    // Only redirect if not already on login page
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }
}

export async function fetchWithAuth(
  url: string, 
  options: RequestInit = {}, 
  _isRetry: boolean = false
): Promise<Response> {
  const token = authStorage.getAccessToken();
  
  const makeRequest = async (accessToken: string | null) => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };
    
    // Only set Content-Type for JSON if body is a string (not FormData)
    if (typeof options.body === 'string' || options.body === undefined) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
    return fetch(fullUrl, {
      ...options,
      headers,
    });
  };

  let res = await makeRequest(token);
  
  // Handle 401 Unauthorized - attempt token refresh (only once per request)
  if (res.status === 401 && !_isRetry) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      // Retry the original request with the new token (mark as retry to prevent loops)
      return fetchWithAuth(url, options, true);
    }
    // Refresh failed, user will be redirected to login by refreshTokens()
  }

  return res;
}

// Helper to get auth message and clear it
export function getAndClearAuthMessage(): string | null {
  if (typeof window === 'undefined') return null;
  const message = sessionStorage.getItem('authMessage');
  if (message) {
    sessionStorage.removeItem('authMessage');
  }
  return message;
}
