/**
 * Centralized API service for Garuvupalem Dasara
 * Handles VITE_API_URL environment configuration, path normalization,
 * prevents duplicate/missing '/api' prefixes, and provides safe JSON parsing.
 */

// Normalized base URL from Vite environment (empty string if relative / proxied)
const envBase = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

export function getApiBaseUrl(): string {
  return envBase;
}

/**
 * Builds a normalized API URL:
 * - If VITE_API_URL is empty: returns relative clean path (e.g. '/api/auth/login')
 * - If VITE_API_URL is set (e.g. 'https://backend.up.railway.app'):
 *   handles whether VITE_API_URL already contains '/api' or not without duplicate prefixes.
 */
export function buildApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (!envBase) {
    return cleanEndpoint;
  }

  const baseEndsWithApi = envBase.endsWith('/api');
  const endpointStartsWithApi = cleanEndpoint.startsWith('/api');

  if (baseEndsWithApi && endpointStartsWithApi) {
    return `${envBase}${cleanEndpoint.slice(4)}`;
  }

  if (!baseEndsWithApi && !endpointStartsWithApi) {
    return `${envBase}/api${cleanEndpoint}`;
  }

  return `${envBase}${cleanEndpoint}`;
}

export interface ApiResult<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

/**
 * Safe fetch wrapper that handles:
 * - Content-Type verification before JSON parsing
 * - Non-JSON error responses (HTML/text 500s or 502s) without parser crashes
 * - Safe error messages
 */
export async function safeFetchJson<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  try {
    const url = buildApiUrl(endpoint);
    const res = await fetch(url, options);

    const contentType = res.headers.get('content-type') || '';
    let data: any = null;

    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    } else {
      const text = await res.text().catch(() => '');
      data = text ? { detail: text } : null;
    }

    if (!res.ok) {
      const errorMsg =
        (typeof data?.detail === 'string' && data.detail) ||
        data?.message ||
        `Request failed with status ${res.status}`;
      return { ok: false, status: res.status, error: errorMsg, data };
    }

    return { ok: true, status: res.status, data };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: err.name === 'AbortError' ? 'Request aborted' : (err.message || 'Network connection failed'),
    };
  }
}
