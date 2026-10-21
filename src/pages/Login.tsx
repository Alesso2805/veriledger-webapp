import { useState, type FormEvent } from 'react';
import { useLocation } from 'react-router';
import { LogoMark } from '../components/LogoMark';
import { cubeFaces } from '../lib/isometric';
import { apiHost } from '../services/api';
import { InvalidCredentialsError, login } from '../services/auth';
import { useAppStore } from '../store/useAppStore';
import { useHealthStore } from '../store/useHealthStore';
import type { LoginRedirectState } from '../types/session';

type Phase = 'idle' | 'submitting' | 'refused' | 'unreachable';

const HEALTH_DOT = { checking: 'fill-vl-faint', online: 'fill-vl-ok', offline: 'fill-vl-danger' };

const CUBES = [0, 1, 2, 3, 4, 5].map((level) => ({ level, ...cubeFaces(170, 270 - level * 40) }));

const fieldClass = (refused: boolean) =>
  `h-[46px] w-full rounded-[10px] border bg-vl-surface px-3.5 text-[15px] text-vl-text transition-colors duration-(--vl-dur-fast) ${
    refused ? 'border-vl-danger' : 'border-vl-line'
  }`;

export function Login() {
  const reason = (useLocation().state as LoginRedirectState | null)?.reason;
  const setToken = useAppStore((state) => state.setToken);
  const online = useHealthStore((state) => state.online);
  const healthState = online === null ? 'checking' : online ? 'online' : 'offline';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [attempt, setAttempt] = useState(0);
  const busy = phase === 'submitting';
  const refused = phase === 'refused';

  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    if (phase === 'refused' || phase === 'unreachable') setPhase('idle');
  };

  // A successful sign-in only stores the token: PublicRoute then returns the person to the page they were on.
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setPhase('submitting');
    try {
      setToken(await login(email, password));
    } catch (error) {
      setPhase(error instanceof InvalidCredentialsError ? 'refused' : 'unreachable');
      setAttempt((count) => count + 1);
    }
  };

  return (
    <div className="flex min-h-screen flex-wrap text-[15px] leading-normal">
      {/* Below 940 px the two columns stack: the form comes first and this decoration follows (DESIGN.md › Login). */}
      <section
        aria-hidden="true"
        className="order-last flex min-w-0 flex-[1_1_520px] flex-col justify-between gap-8 border-t border-vl-line p-10 min-[940px]:order-none min-[940px]:border-t-0 min-[940px]:border-r"
      >
        <span className="flex items-center gap-2.5">
          <LogoMark className="size-[26px]" />
          <span className="text-lg font-bold">veriledger</span>
        </span>
        <svg viewBox="0 0 340 360" className="w-full max-w-[360px] self-center overflow-visible">
          <ellipse cx="170" cy="338" rx="120" ry="18" className="fill-vl-shadow" />
          {CUBES.map((cube) => (
            <g key={cube.level} className="animate-vl-drop" style={{ animationDelay: `${200 + cube.level * 140}ms` }}>
              <polygon points={cube.left} className="fill-vl-cube-left" />
              <polygon points={cube.right} className="fill-vl-cube-right" />
              <polygon points={cube.top} className={cube.level === 5 ? 'fill-vl-accent' : 'fill-vl-cube-top'} />
            </g>
          ))}
        </svg>
        <div>
          <p className="text-[34px] leading-[1.1] font-bold tracking-[-0.03em]">A ledger anyone can check.</p>
          <ul className="mt-4 flex flex-col gap-1.5 text-vl-muted">
            <li>Every entry is signed by its author.</li>
            <li>Every block is sealed by proof of work and rests on the one below.</li>
            <li>Every node keeps a copy and checks what it receives.</li>
          </ul>
        </div>
      </section>

      <main className="flex min-w-0 flex-[1_1_420px] items-center justify-center px-6 py-10">
        <div className="w-full max-w-[400px] animate-vl-fade-up">
          {reason === 'expired' && (
            <div
              role="status"
              className="mb-5 flex animate-vl-fade-up items-start gap-2.5 rounded-xl border border-vl-accent bg-vl-surface px-3.5 py-3"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="mt-0.5 shrink-0">
                <circle cx="9" cy="9" r="7.5" fill="none" strokeWidth="1.5" className="stroke-vl-accent" />
                <path d="M9 5v4.5l2.5 1.5" fill="none" strokeWidth="1.5" className="stroke-vl-accent" />
              </svg>
              <span>Your session expired. Sign in again to continue where you were.</span>
            </div>
          )}
          <h1 className="text-[32px] font-bold tracking-[-0.02em]">Sign in</h1>
          <p className="mt-1.5 flex items-center gap-2 font-vl-mono text-xs text-vl-muted">
            <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
              <circle cx="4" cy="4" r="4" className={HEALTH_DOT[healthState]} />
            </svg>
            {apiHost()} · {healthState}
          </p>

          {/* Remounted on each failed attempt so the shake replays (DESIGN.md › The promise, rule 4). */}
          <form
            key={attempt}
            onSubmit={submit}
            className={`mt-6 flex flex-col gap-4 ${refused ? 'animate-vl-shake' : ''}`}
          >
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => edit(setEmail)(event.target.value)}
                className={fieldClass(refused)}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => edit(setPassword)(event.target.value)}
                className={fieldClass(refused)}
              />
            </div>
            <div className="min-h-5">
              {refused && (
                <p role="alert" className="animate-vl-fade-up text-sm text-vl-danger">
                  Invalid credentials. Check the email and password and try again.
                </p>
              )}
              {phase === 'unreachable' && (
                <p role="alert" className="animate-vl-fade-up text-sm text-vl-danger">
                  The API did not answer. Check that it is running and try again.
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={busy}
              className={`h-12 rounded-[10px] text-[15px] font-semibold transition-colors duration-(--vl-dur-base) ${
                busy ? 'bg-vl-line text-vl-muted' : 'bg-vl-accent text-vl-on-accent'
              }`}
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-[18px] text-[13px] text-vl-muted">Regular accounts are created by an administrator.</p>
        </div>
      </main>
    </div>
  );
}
