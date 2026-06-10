import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const setAuthToken = (token: string | null) => {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
};

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401 && !error.config.__isRetryRequest && typeof window !== 'undefined') {
      const refreshToken = window.localStorage.getItem('erp_refresh_token');
      if (refreshToken) {
        try {
          error.config.__isRetryRequest = true;
          const res = await axios.post('/api/auth/refresh', { refreshToken });
          const { accessToken } = res.data;
          window.localStorage.setItem('erp_token', accessToken);
          document.cookie = `erp_token=${accessToken}; path=/; SameSite=Strict`;
          setAuthToken(accessToken);
          return api(error.config);
        } catch {
          window.localStorage.removeItem('erp_token');
          document.cookie = 'erp_token=; path=/; Max-Age=0';
          window.location.href = '/login';
        }
      } else { window.location.href = '/login'; }
    }
    return Promise.reject(error);
  },
);

export default api;
