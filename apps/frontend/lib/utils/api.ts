import axios, { type AxiosInstance } from 'axios';

export function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = window.localStorage.getItem('erp_token');
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  instance.interceptors.response.use(
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
          const refreshToken = window.localStorage.getItem('erp_refresh_token');
          if (refreshToken) {
            const res = await axios.post('/api/auth/refresh', { refreshToken });
            const newToken = res.data.accessToken;
            window.localStorage.setItem('erp_token', newToken);
            error.config.headers = error.config.headers ?? {};
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return instance(error.config);
          }
        } catch {
          /* refresh gagal, biarkan error lanjut */
        }
      }
      return Promise.reject(error);
    },
  );

  return instance;
}
