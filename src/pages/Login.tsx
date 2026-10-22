import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { Fingerprint } from '../components/Fingerprint';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { LogoMark } from '../components/LogoMark';
import { ThemeSwitch } from '../components/ThemeSwitch';
import { useStartDemo } from '../components/useStartDemo';
import { useT } from '../components/useT';
import { healthWord } from '../lib/format';
import { apiHost } from '../services/api';
import { InvalidCredentialsError, login } from '../services/auth';
import { useAppStore } from '../store/useAppStore';
import { useHealthStore } from '../store/useHealthStore';
import type { LoginRedirectState } from '../types/session';

type Phase = 'idle' | 'submitting' | 'refused' | 'unreachable';

const HEALTH_DOT = { checking: 'bg-vl-faint', online: 'bg-vl-ok', offline: 'bg-vl-danger', 'no database': 'bg-vl-danger' };

// Three tiles beside the form, each linked to the one above it by its fingerprint: a drawing, not data.
const CHAIN = ['41c9a7e2f0b38d5c', 'b0d1e67c7d13f2a9', '9657f8d2c4e1a07b', 'a3f19c7e52b8d04f'];

const fieldClass = (refused: boolean) =>
  `h-[50px] w-full rounded-[14px] border-[1.5px] bg-vl-surface px-4 text-base text-vl-text transition-colors duration-(--vl-dur-fast) ${
    refused ? 'border-vl-danger' : 'border-vl-line'
  }`;

// Artboard "C · Login y demo con un clic". The form comes first in the page and is drawn on the right on wide
// screens, so a phone opens on it and the keyboard reaches it first (DESIGN.md › Login).
export function Login() {
  const t = useT();
  const reason = (useLocation().state as LoginRedirectState | null)?.reason;
  const setToken = useAppStore((state) => state.setToken);
  const online = useHealthStore((state) => state.online);
  const databaseDown = useHealthStore((state) => state.databaseDown);
  const demoMode = useHealthStore((state) => state.demoMode);
  const healthState = healthWord(online, databaseDown);
  // A started demo only stores the token too, so the visitor also returns to the page they were on.
  const [demoRefusal, setDemoRefusal] = useState<{ text: string; attempt: number } | null>(null);
  const demo = useStartDemo((text) => setDemoRefusal((last) => ({ text, attempt: (last?.attempt ?? 0) + 1 })));
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
    <div className="flex min-h-screen flex-row-reverse flex-wrap text-base leading-normal">
      <main className="flex min-w-0 flex-[1_1_440px] items-center justify-center px-6 py-10 max-sm:px-3 max-sm:py-5">
        <div className="w-full max-w-[440px] animate-vl-fade-up rounded-[28px] bg-vl-surface p-8 max-sm:p-[22px]">
          <div className="-mt-2 -mr-2 mb-2 flex justify-end gap-2">
            <LanguageSwitch className="bg-vl-bg" />
            <ThemeSwitch className="bg-vl-bg" />
          </div>
          {reason && (
            <div role="status" className="mb-5 flex animate-vl-fade-up items-start gap-2.5 rounded-2xl bg-vl-wait-soft px-3.5 py-3">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="mt-[3px] shrink-0 fill-none stroke-current" strokeWidth="1.5">
                <circle cx="9" cy="9" r="7.5" />
                <path d="M9 5v4.5l2.5 1.5" />
              </svg>
              <span>{reason === 'demo-ended' ? t.login.demoEnded : t.login.expired}</span>
            </div>
          )}
          <h1 className="text-[44px] leading-none font-extrabold tracking-[-0.035em]">{t.login.title}</h1>
          <p className="mt-2.5 flex items-center gap-2 font-vl-mono text-[13px] text-vl-muted">
            <span aria-hidden="true" className={`size-[9px] shrink-0 rounded-full ${HEALTH_DOT[healthState]}`} />
            {apiHost()} · {t.shell.health[healthState]}
          </p>

          {/* Remounted on each failed attempt so the shake replays (DESIGN.md › The promise, rule 4). */}
          <form key={attempt} onSubmit={submit} className={`mt-6 flex flex-col gap-4 ${refused ? 'animate-vl-shake' : ''}`}>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                {t.login.email}
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
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                {t.login.password}
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
            <div className="min-h-[22px]">
              {refused && (
                <p role="alert" className="animate-vl-fade-up text-[15px] text-vl-danger">
                  {t.login.refused}
                </p>
              )}
              {phase === 'unreachable' && (
                <p role="alert" className="animate-vl-fade-up text-[15px] text-vl-danger">
                  {t.login.unreachable}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={busy}
              className={`h-[52px] rounded-[14px] text-base font-bold transition-colors duration-(--vl-dur-base) ${
                busy ? 'bg-vl-skeleton text-vl-muted' : 'bg-vl-strong text-vl-on-strong'
              }`}
            >
              {busy ? t.login.submitting : t.login.submit}
            </button>
          </form>

          {demoMode && (
            <>
              <div aria-hidden="true" className="my-6 flex items-center gap-3 text-sm text-vl-muted">
                <span className="h-px flex-auto bg-vl-line-soft" />
                {t.login.or}
                <span className="h-px flex-auto bg-vl-line-soft" />
              </div>
              <section aria-labelledby="demo-h" className="rounded-[20px] bg-vl-bg p-[18px]">
                <h2 id="demo-h" className="text-lg font-bold tracking-[-0.01em]">
                  {t.login.demoTitle}
                </h2>
                <p className="mt-1 mb-3.5 text-[15px] text-vl-muted">{t.login.demoText}</p>
                <button
                  type="button"
                  onClick={() => void demo.start()}
                  disabled={demo.starting}
                  className={`h-[50px] w-full rounded-[14px] border-2 text-base font-bold ${
                    demo.starting
                      ? 'animate-vl-pulse border-dashed border-vl-faint bg-transparent text-vl-muted'
                      : 'border-vl-accent bg-vl-surface text-vl-accent'
                  }`}
                >
                  {demo.starting ? t.login.demoCreating : t.login.demoButton}
                </button>
                {/* Keyed by attempt so the shake replays on each refusal (DESIGN.md › The promise, rule 4). */}
                {demoRefusal && !demo.starting && (
                  <p
                    key={demoRefusal.attempt}
                    role="alert"
                    className="mt-3 animate-vl-shake rounded-[14px] bg-vl-danger-soft px-3.5 py-3 text-[15px] text-vl-danger"
                  >
                    {demoRefusal.text}
                  </p>
                )}
              </section>
            </>
          )}

          <p className="mt-[18px] text-sm text-vl-muted">
            {t.login.regular}{' '}
            <Link to="/" className="font-bold text-vl-text hover:text-vl-accent">
              {t.login.browse}
            </Link>
          </p>
        </div>
      </main>

      <section
        aria-hidden="true"
        className="flex min-w-0 flex-[1_1_520px] flex-col justify-between gap-8 p-10 max-sm:px-4 max-sm:py-7"
      >
        <span className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-xl font-extrabold tracking-[-0.02em]">VeriLedger</span>
        </span>
        <div className="flex w-full max-w-[460px] flex-col gap-2.5 self-center">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="flex animate-vl-tile-in flex-col gap-2.5 rounded-[18px] bg-vl-surface px-4 py-3.5"
              style={{ marginLeft: (index - 1) * 28, animationDelay: `${200 + index * 160}ms` }}
            >
              <span className="flex items-center gap-2 font-vl-mono text-[11px] text-vl-muted">
                {t.login.linksTo}
                <Fingerprint hex={CHAIN[index - 1]} bars={8} className="h-2.5 flex-auto gap-[2px]" radius={2} />
              </span>
              <Fingerprint hex={CHAIN[index]} bars={8} className="h-[34px] gap-[3px]" radius={4} />
            </div>
          ))}
        </div>
        <div>
          <p className="text-5xl leading-none font-extrabold tracking-[-0.035em] max-sm:text-[34px]">{t.login.tagline}</p>
          <ul className="mt-[18px] flex flex-col gap-1.5 text-[17px] text-vl-muted">
            {t.login.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
