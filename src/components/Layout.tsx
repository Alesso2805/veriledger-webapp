import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAppStore } from '../store/useAppStore';
import { useHealthStore } from '../store/useHealthStore';
import { useKeyStore } from '../store/useKeyStore';
import { useToastStore } from '../store/useToastStore';
import type { LoginRedirectState } from '../types/session';
import { ErrorBoundary } from './ErrorBoundary';
import { HeaderSearch } from './HeaderSearch';
import { HealthStatus } from './HealthStatus';
import { LanguageSwitch } from './LanguageSwitch';
import { LogoMark } from './LogoMark';
import { OfflineBanner } from './OfflineBanner';
import { PageFailed } from './PageFailed';
import { ThemeSwitch } from './ThemeSwitch';
import { UserChip } from './UserChip';
import { useSessionToken } from './useSessionToken';
import { useStartDemo } from './useStartDemo';
import { useT } from './useT';

const TABS = [
  { tab: 'chain', to: '/', end: true },
  { tab: 'transact', to: '/transact', end: false },
  { tab: 'wallet', to: '/wallet', end: false },
  { tab: 'network', to: '/network', end: false },
] as const;

const pillClass =
  'inline-flex h-10 items-center rounded-full border-[1.5px] border-vl-line px-3.5 text-sm font-bold whitespace-nowrap transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised';

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex h-10 items-center rounded-full px-[18px] font-medium whitespace-nowrap transition-colors duration-(--vl-dur-fast) ${
    isActive ? 'bg-vl-strong text-vl-on-strong' : 'text-vl-muted hover:bg-vl-raised hover:text-vl-text'
  }`;

// The shell of design C (DESIGN.md › Shell). Below 640 px the switches and the account share the logo's row, the
// search takes the next one and the tabs the last, scrolling sideways.
export function Layout() {
  const t = useT();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const logout = useAppStore((state) => state.logout);
  const { token } = useSessionToken();
  const demoMode = useHealthStore((state) => state.demoMode);
  const show = useToastStore((state) => state.show);
  const demo = useStartDemo((text) => show(text, 'err'));

  // Signing out also forgets the key this tab held, so the next person at this browser cannot sign with it.
  const signOut = () => {
    logout();
    useKeyStore.getState().forget();
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen text-base leading-normal">
      {/* Moved with transform, not top: only transform, opacity and colours animate (DESIGN.md › Motion map). */}
      <a
        href="#main"
        className="absolute top-3 left-3 z-60 -translate-y-20 rounded-[14px] bg-vl-accent px-4 py-3 font-bold text-vl-on-accent transition-transform duration-(--vl-dur-fast) focus:translate-y-0"
      >
        {t.shell.skip}
      </a>
      <header className="sticky top-0 z-30 bg-vl-bg">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-5 gap-y-3 px-6 pt-3.5 pb-2.5 max-sm:gap-x-3 max-sm:gap-y-2.5 max-sm:px-3 max-sm:py-2.5">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-xl font-extrabold tracking-[-0.02em] max-sm:sr-only">VeriLedger</span>
          </Link>
          <HeaderSearch />
          <div className="ml-auto flex items-center gap-3 max-sm:order-1 max-sm:flex-wrap max-sm:justify-end max-sm:gap-2">
            <LanguageSwitch />
            <ThemeSwitch />
            <HealthStatus />
            <UserChip />
            {token ? (
              <button type="button" onClick={signOut} className={pillClass}>
                {t.shell.signOut}
              </button>
            ) : (
              <>
                {/* After signing in, the login returns the visitor to this page; a demo starts right here. */}
                <Link to="/login" state={{ from: { pathname, search } } satisfies LoginRedirectState} className={pillClass}>
                  {t.shell.signIn}
                </Link>
                {demoMode && (
                  <button
                    type="button"
                    onClick={() => void demo.start()}
                    disabled={demo.starting}
                    className={`inline-flex h-10 items-center rounded-full bg-vl-accent px-4 text-sm font-bold whitespace-nowrap text-vl-on-accent ${
                      demo.starting ? 'animate-vl-pulse' : ''
                    }`}
                  >
                    {demo.starting ? t.shell.starting : t.shell.tryDemo}
                  </button>
                )}
              </>
            )}
          </div>
          <nav aria-label={t.shell.mainNav} className="flex basis-full overflow-x-auto max-sm:order-3">
            <span className="inline-flex gap-1 rounded-full bg-vl-surface p-1">
              {TABS.map((tab) => (
                <NavLink key={tab.to} to={tab.to} end={tab.end} className={tabClass}>
                  {t.shell.tabs[tab.tab]}
                </NavLink>
              ))}
            </span>
          </nav>
        </div>
        <OfflineBanner />
      </header>
      <main
        id="main"
        tabIndex={-1}
        key={pathname}
        className="mx-auto max-w-[1320px] animate-vl-fade-up px-6 pt-5 pb-[72px] focus:outline-none max-sm:px-3"
      >
        {/* A page that throws while drawing fails alone, inside the shell; the key above clears it on another route. */}
        <ErrorBoundary fallback={(retry) => <PageFailed onRetry={retry} />}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
