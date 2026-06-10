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
  if (typeof window === 'undefined') {
    throw new Error('Cannot refresh token on server');
  }

  const refreshToken = window.localStorage.getItem('erp_refresh_token');
  if (!refreshToken) {
    throw new Error('Refresh token missing');
  }

  const response = await api.post('/auth/refresh', { refreshToken });
  const accessToken = response.data.accessToken;
  window.localStorage.setItem('erp_token', accessToken);
  setAuthToken(accessToken);
  return accessToken;
};

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
        window.localStorage.removeItem('erp_token');
        window.localStorage.removeItem('erp_refresh_token');
      }
    }
    return Promise.reject(error);
  },
);

export default api;
