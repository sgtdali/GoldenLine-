import axios, { AxiosHeaders } from 'axios';
import {
  AUTH_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
  UNAUTHORIZED_EVENT,
} from './constants/auth';

export const API_BASE_URL = 'http://localhost:5041';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      const headers = config.headers
        ? AxiosHeaders.from(config.headers)
        : new AxiosHeaders();
      headers.set('Authorization', `Bearer ${token}`);
      config.headers = headers;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

export default apiClient;
