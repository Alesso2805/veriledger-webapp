import type { Health } from '../types/session';
import { api } from './api';

// Only the API's own answer counts: a misrouted /api can get index.html with a 200 from the static server.
export async function getHealth(): Promise<Health> {
  const response = await api.get<Health>('/health');
  if (response.data?.status !== 'ok') throw new Error('The API did not answer /health');
  return response.data;
}
