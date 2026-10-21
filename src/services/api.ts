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

// A 401 on a request that carried the session means the API no longer accepts it: end the session, and the
// route guards take the person to the login with "Your session expired". The login's own 401 is a wrong password.
api.interceptors.response.use(undefined, (error: unknown) => {
  if (isAxiosError(error) && error.response?.status === 401 && error.config?.headers?.Authorization) {
    useAppStore.getState().expire();
  }
  return Promise.reject(error);
});

// The API's host as people know it, for messages such as the offline banner.
export function apiHost(): string {
  return new URL(api.defaults.baseURL ?? window.location.origin).host;
}

export function statusOf(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}
