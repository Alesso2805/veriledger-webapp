export type UserRole = 'admin' | 'trader' | 'viewer';

export interface CurrentUser {
  id: string;
  // null for a demo account, which has no email or password (API ADR-0006, VLA-35).
  email: string | null;
  // The email, or "Guest XXXX" for a demo account.
  display_name: string;
  role: UserRole;
  // When a demo account ends; null for a regular account.
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// Why a session ended without a sign-out: its time ran out (VLW-17), or it was a demo account (VLW-34).
export type SessionEndReason = 'expired' | 'demo-ended';

// Router state of a redirect to /login: where to return after signing in, and why the session ended.
export interface LoginRedirectState {
  from?: { pathname: string; search?: string };
  reason?: SessionEndReason;
}

export interface Health {
  status: string;
  environment: string;
  // Whether this node starts demo accounts at POST /auth/demo (VLA-35).
  demo_mode?: boolean;
}
