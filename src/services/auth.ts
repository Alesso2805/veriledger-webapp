import type { CurrentUser } from '../types/session';
import { api } from './api';

export async function getMe(): Promise<CurrentUser> {
  const response = await api.get<CurrentUser>('/auth/me');
  return response.data;
}
