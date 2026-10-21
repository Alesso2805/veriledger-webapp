import type { CurrentUser } from '../types/session';
import { api, statusOf } from './api';

export class InvalidCredentialsError extends Error {}

export async function login(email: string, password: string): Promise<string> {
  try {
    const response = await api.post<{ access_token: string }>(
      '/auth/login',
      new URLSearchParams({ username: email, password }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    return response.data.access_token;
  } catch (error) {
    if (statusOf(error) === 401) throw new InvalidCredentialsError('Invalid credentials');
    throw error;
  }
}

export async function getMe(): Promise<CurrentUser> {
  const response = await api.get<CurrentUser>('/auth/me');
  return response.data;
}
