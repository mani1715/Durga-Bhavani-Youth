/**
 * API Configuration for Garuvupalem Dasara Platform.
 * Supports configurable API base URL via Vite environment variables:
 * - VITE_API_URL (e.g. https://backend-production.up.railway.app)
 * - VITE_API_BASE_URL (alias)
 * Defaults to relative /api in development (proxied by Vite) or production (served/proxied).
 */

const rawApiUrl = (
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL)) ||
  ''
).trim().replace(/\/$/, '');

export const API_BASE_URL = rawApiUrl;

export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return cleanPath;
  }
  return `${API_BASE_URL}${cleanPath}`;
};
