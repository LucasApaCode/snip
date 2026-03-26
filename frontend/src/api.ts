const BASE = `${import.meta.env.VITE_API_URL ?? ""}/api`;

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("snip_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(
  res: Response,
  redirectOn401 = true,
): Promise<T> {
  if (res.status === 401 && redirectOn401) {
    localStorage.removeItem("snip_token");
    localStorage.removeItem("snip_email");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  email: string;
}

export async function loginApi(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AuthResponse>(res, false);
}

export async function registerApi(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AuthResponse>(res, false);
}

export interface ShortenResponse {
  slug: string;
  short_url: string;
  original_url: string;
}

export interface UrlItem {
  slug: string;
  short_url: string;
  original_url: string;
  click_count: number;
  created_at: string;
  expires_at: string | null;
}

export interface UrlsPage {
  total: number;
  page: number;
  size: number;
  items: UrlItem[];
}

export async function shortenUrl(
  url: string,
  customSlug?: string,
  expiresAt?: string,
): Promise<ShortenResponse> {
  const res = await fetch(`${BASE}/shorten`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      url,
      ...(customSlug ? { custom_slug: customSlug } : {}),
      ...(expiresAt ? { expires_at: expiresAt } : {}),
    }),
  });
  return handleResponse<ShortenResponse>(res);
}

export async function listUrls(page = 0, size = 10): Promise<UrlsPage> {
  const res = await fetch(`${BASE}/urls?page=${page}&size=${size}`, {
    headers: authHeaders(),
  });
  return handleResponse<UrlsPage>(res);
}

export async function deleteUrl(slug: string): Promise<void> {
  const res = await fetch(`${BASE}/urls/${slug}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (res.status === 204) return;
  await handleResponse<void>(res);
}

export interface AnalyticsData {
  slug: string;
  short_url?: string;
  original_url: string;
  total_clicks: number;
  created_at: string;
  visits_by_day: { day: string; count: number }[];
  top_referers: { referer: string; count: number }[];
  top_devices: { device_type: string; count: number }[];
  top_browsers: { browser: string; count: number }[];
  top_countries: { country_code: string; count: number }[];
}

export async function getAnalytics(slug: string): Promise<AnalyticsData> {
  const res = await fetch(`${BASE}/analytics/${slug}`, {
    headers: authHeaders(),
  });
  return handleResponse<AnalyticsData>(res);
}
