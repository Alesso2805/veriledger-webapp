import type { CurrentUser } from '../types/session';
import { api, statusOf } from './api';

export class InvalidCredentialsError extends Error {}

export async function login(email: string, password: string): Promise<string> {
  try {
    const response = await api.post(
      '/auth/login',
      new URLSearchParams({ username: email, password }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    // A 200 that is not the API's, such as a proxy's page, carries no token; storing nothing would sign in no one.
    const token: unknown = (response.data as { access_token?: unknown } | undefined)?.access_token;
    if (typeof token !== 'string') throw new Error('The API did not answer /auth/login');
    return token;
  } catch (error) {
    if (statusOf(error) === 401) throw new InvalidCredentialsError('Invalid credentials');
    throw error;
  }
}

// A 24-hour trader account with no email, signed in by its token alone (API ADR-0006). A node without DEMO_MODE
// answers 404, and the limits answer 429 with a detail that says which one.
export async function startDemo(): Promise<string> {
  const response = await api.post('/auth/demo');
  const token: unknown = (response.data as { access_token?: unknown } | undefined)?.access_token;
  if (typeof token !== 'string') throw new Error('The API did not answer /auth/demo');
  return token;
}

export async function getMe(): Promise<CurrentUser> {
  const response = await api.get('/auth/me');
  const user = response.data as Partial<CurrentUser> | undefined;
  if (typeof user?.id !== 'string' || typeof user.display_name !== 'string' || typeof user.role !== 'string') {
    throw new Error('The API did not answer /auth/me');
  }
  return user as CurrentUser;
}
