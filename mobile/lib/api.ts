/**
 * API client for the Next.js backend.
 * Uses EXPO_PUBLIC_APP_URL and optional Supabase access_token for authenticated requests.
 */

const BASE_URL = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') || '';

export function getApiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${p}`;
}

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  accessToken?: string | null;
  body?: object;
}

/**
 * Fetch JSON from the app API. Adds Authorization: Bearer when accessToken is provided.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { accessToken, body, headers: optHeaders, ...rest } = options;
  const url = getApiUrl(path);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(optHeaders as Record<string, string>),
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  const res = await fetch(url, {
    ...rest,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error((errBody as { error?: string }).error || res.statusText || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
