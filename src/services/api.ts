import axios, { isAxiosError } from 'axios';
import { translateApiMessage } from '../lib/i18n/apiMessages';
import { endReason } from '../lib/jwt';
import { useAppStore } from '../store/useAppStore';
import { usePreferencesStore } from '../store/usePreferencesStore';

// Until /config.json is read (services/config.ts): VITE_API_URL in development, else the same origin's /api.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
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
// route guards take the person to the login with "Your session expired", or "Your demo ended" when the token
// was a demo account's. The login's own 401 is a wrong password.
api.interceptors.response.use(undefined, (error: unknown) => {
  const authorization: unknown = isAxiosError(error) ? error.config?.headers?.Authorization : undefined;
  if (isAxiosError(error) && error.response?.status === 401 && typeof authorization === 'string') {
    useAppStore.getState().expire(endReason(authorization.replace(/^Bearer /, '')));
  }
  return Promise.reject(error);
});

// The API's host as people know it, for messages such as the offline banner.
export function apiHost(): string {
  return new URL(api.defaults.baseURL ?? '/api', window.location.origin).host;
}

export function statusOf(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

// What to tell the person about a failed request: the API's own detail when it sent one as text, in the page's
// language when it is a message the webapp knows (ADR-0007).
export function detailOf(error: unknown, fallback: string): string {
  const detail: unknown = isAxiosError(error) ? error.response?.data?.detail : undefined;
  const { language } = usePreferencesStore.getState();
  if (typeof detail === 'string') return translateApiMessage(detail, language);
  // Without the API's words, an error's own message is English and technical ("Network Error"), so Spanish shows
  // the caller's text instead, which comes from the dictionary.
  if (language !== 'en') return fallback;
  return error instanceof Error ? error.message : fallback;
}
