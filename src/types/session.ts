export type UserRole = 'admin' | 'trader' | 'viewer';

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Router state of a redirect to /login: where to return after signing in, and why the session ended (VLW-17).
export interface LoginRedirectState {
  from?: { pathname: string; search?: string };
  reason?: 'expired';
}

export interface Health {
  status: string;
  environment: string;
}
