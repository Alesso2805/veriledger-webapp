export type UserRole = 'admin' | 'trader' | 'viewer';

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Health {
  status: string;
  environment: string;
}
