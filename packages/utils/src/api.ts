import axios, { type AxiosInstance } from 'axios';
import { getToken, getRefreshToken, setTokens, clearTokens } from './auth';

export function createApiClient(baseURL = '/api'): AxiosInstance {
  const client = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      if (
        error.response?.status === 401 &&
        error.config &&
        !error.config.__isRetryRequest &&
        typeof window !== 'undefined'
      ) {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          try {
            error.config.__isRetryRequest = true;
            const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
            const { accessToken, refreshToken: newRefresh } = res.data;
            setTokens(accessToken, newRefresh);
            error.config.headers.Authorization = `Bearer ${accessToken}`;
            return client(error.config);
          } catch {
            clearTokens();
            window.location.href = '/dashboard';
          }
        } else {
          clearTokens();
          window.location.href = '/dashboard';
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}
