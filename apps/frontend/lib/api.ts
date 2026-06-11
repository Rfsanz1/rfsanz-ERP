import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

const refreshAuthToken = async () => {
  if (typeof window === 'undefined') throw new Error('Cannot refresh on server');
  const refreshToken = window.localStorage.getItem('erp_refresh_token');
  if (!refreshToken) throw new Error('Refresh token missing');
  const response = await api.post('/auth/refresh', { refreshToken });
  const accessToken = response.data.accessToken;
  window.localStorage.setItem('erp_token', accessToken);
  setAuthToken(accessToken);
  return accessToken;
};

let _autoLoginFn: (() => Promise<void>) | null = null;
export const registerAutoLogin = (fn: () => Promise<void>) => { _autoLoginFn = fn; };

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error.response?.status === 401 &&
      error.config &&
      !error.config.__isRetryRequest &&
      typeof window !== 'undefined'
    ) {
      try {
        error.config.__isRetryRequest = true;
        await refreshAuthToken();
        return api(error.config);
      } catch {
        // refresh gagal → coba auto-login ulang
        if (_autoLoginFn) {
          try {
            await _autoLoginFn();
            const newToken = window.localStorage.getItem('erp_token');
            if (newToken) {
              error.config.headers = error.config.headers ?? {};
              error.config.headers.Authorization = `Bearer ${newToken}`;
              return api(error.config);
            }
          } catch { /* ignore */ }
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
