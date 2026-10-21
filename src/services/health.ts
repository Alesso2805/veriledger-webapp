import type { Health } from '../types/session';
import { api } from './api';

export async function getHealth(): Promise<Health> {
  const response = await api.get<Health>('/health');
  return response.data;
}
