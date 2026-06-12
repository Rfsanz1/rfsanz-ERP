import axios, { type InternalAxiosRequestConfig } from 'axios';
import { isNativePlatform, loadServerUrl, getBaseUrl } from './api-config';

/**
 * Axios instance utama Gentong Mas ERP.
 *
 * - Browser web  : baseURL = '/api'          (melalui Next.js proxy)
 * - Native APK   : baseURL = '<serverUrl>/api' (langsung ke NestJS backend)
 *
 * Base URL di-resolve per-request via interceptor agar mendukung
 * perubahan URL dari halaman Settings → Koneksi Server tanpa restart app.
 */
export const api = axios.create({
  baseURL: typeof window === 'undefined' ? '/api' : (isNativePlatform() ? '' : '/api'),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

/* ── Request interceptor: resolve base URL untuk native ── */
let _serverUrlCache: string | null = null;

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (typeof window === 'undefined') return config;
  if (!isNativePlatform()) return config;

  if (_serverUrlCache === null) {
    _serverUrlCache = await loadServerUrl();
  }

  if (!config.baseURL || config.baseURL === '') {
    config.baseURL = getBaseUrl(_serverUrlCache);
  }

  return config;
});

/* ── Response interceptor: handle 401 ── */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== 'undefined') {
      _serverUrlCache = null;
    }
    return Promise.reject(err);
  },
);

/** Invalidasi cache URL server (dipanggil setelah user simpan URL baru). */
export function invalidateApiBaseUrl() {
  _serverUrlCache = null;
}

export const setAuthToken  = (_token: string | null) => {};
export const registerAutoLogin = (_fn: () => Promise<void>) => {};
export default api;
