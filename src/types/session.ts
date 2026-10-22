import type { components } from './api';

export type UserRole = components['schemas']['UserRole'];

// GET /auth/me. A demo account has no email, display_name "Guest XXXX" and an expires_at; a regular account's
// display_name is its email and its expires_at is null (API ADR-0006).
export type CurrentUser = components['schemas']['UserResponseDTO'];

// POST /auth/login and POST /auth/demo.
export type Token = components['schemas']['TokenDTO'];

// GET /health. demo_mode says whether this node starts demo accounts at POST /auth/demo.
export type Health = components['schemas']['HealthCheckResponse'];

// Why a session ended without a sign-out: its time ran out, or it was a demo account.
export type SessionEndReason = 'expired' | 'demo-ended';

// Router state of a redirect to /login: where to return after signing in, and why the session ended.
export interface LoginRedirectState {
  from?: { pathname: string; search?: string };
  reason?: SessionEndReason;
}
