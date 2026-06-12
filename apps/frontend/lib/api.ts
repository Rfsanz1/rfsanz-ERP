import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (_token: string | null) => {};

export const registerAutoLogin = (_fn: () => Promise<void>) => {};

export default api;
