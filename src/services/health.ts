import { isAxiosError } from 'axios';
import type { Health } from '../types/session';
import { api } from './api';

// The API answers, but its database does not: /health's 503 says so in its body (VLA-26).
export class DatabaseDownError extends Error {}

// Only the API's own answer counts: a misrouted /api can get index.html with a 200 from the static server.
export async function getHealth(): Promise<Health> {
  try {
    const response = await api.get<Health>('/health');
    if (response.data?.status !== 'ok') throw new Error('The API did not answer /health');
    return response.data;
  } catch (error) {
    const body = isAxiosError(error) ? (error.response?.data as Partial<Health> | undefined) : undefined;
    if (isAxiosError(error) && error.response?.status === 503 && body?.database === 'unreachable') {
      throw new DatabaseDownError('The API answers, but its database does not');
    }
    throw error;
  }
}
