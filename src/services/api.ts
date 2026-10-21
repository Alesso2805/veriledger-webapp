import axios, { isAxiosError } from 'axios';
import { useAppStore } from '../store/useAppStore';

export const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAppStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// The API's host as people know it, for messages such as the offline banner.
export function apiHost(): string {
  return new URL(api.defaults.baseURL ?? window.location.origin).host;
}

export function statusOf(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}
