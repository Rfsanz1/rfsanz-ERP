import axios, { type InternalAxiosRequestConfig } from 'axios';
import { isNativePlatform, loadServerUrl, getBaseUrl } from './api-config';

const TOKEN_KEY = 'gm_auth_token';

export const api = axios.create({
  baseURL: typeof window === 'undefined' ? '/api' : (isNativePlatform() ? '' : '/api'),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

let _serverUrlCache: string | null = null;

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (typeof window === 'undefined') return config;

  if (isNativePlatform()) {
    if (_serverUrlCache === null) {
      _serverUrlCache = await loadServerUrl();
    }
    if (!config.baseURL || config.baseURL === '') {
      config.baseURL = getBaseUrl(_serverUrlCache);
    }
  }

  const token = localStorage.getItem(TOKEN_KEY);
  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== 'undefined') {
      _serverUrlCache = null;
      localStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(err);
  },
);

export function invalidateApiBaseUrl() {
  _serverUrlCache = null;
}

export const setAuthToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const registerAutoLogin = (_fn: () => Promise<void>) => {};
export default api;
