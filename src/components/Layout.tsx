import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAppStore } from '../store/useAppStore';
import { HeaderSearch } from './HeaderSearch';
import { HealthStatus } from './HealthStatus';
import { LogoMark } from './LogoMark';
import { OfflineBanner } from './OfflineBanner';
import { UserChip } from './UserChip';

const TABS = [
  { label: 'Tower', to: '/', end: true },
  { label: 'Sign and send', to: '/transact', end: false },
  { label: 'Wallet', to: '/wallet', end: false },
  { label: 'Network', to: '/network', end: false },
];

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap border-b-2 px-3 py-2.5 transition-colors duration-(--vl-dur-fast) ${
    isActive ? 'border-vl-accent font-semibold text-vl-text' : 'border-transparent text-vl-muted hover:text-vl-text'
  }`;

export function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const logout = useAppStore((state) => state.logout);

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen text-[15px] leading-normal">
      {/* Moved with transform, not top: only transform, opacity and colours animate (DESIGN.md › Motion map). */}
      <a
        href="#main"
        className="absolute top-3 left-3 z-60 -translate-y-[72px] rounded-[10px] bg-vl-accent px-3.5 py-2.5 font-semibold text-vl-on-accent transition-transform duration-(--vl-dur-fast) focus:translate-y-0"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-vl-line bg-vl-bg">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-3 gap-y-2.5 px-3 pt-2.5 sm:gap-x-5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoMark className="size-[22px] sm:size-[26px]" />
            <span className="font-bold sm:text-lg">veriledger</span>
          </Link>
          <HeaderSearch />
          {/* Below sm the status and Sign out share the logo's row and the search drops below, as in "E · Estados del shell". */}
          <div className="order-1 ml-auto flex items-center gap-2.5 sm:order-none sm:gap-3.5">
            <HealthStatus />
            <UserChip />
            <button
              type="button"
              onClick={signOut}
              className="inline-flex h-9 items-center rounded-full border border-vl-line px-3 text-[13px] font-semibold transition-colors duration-(--vl-dur-fast) hover:bg-vl-raised"
            >
              Sign out
            </button>
          </div>
          <nav aria-label="Main" className="order-3 flex basis-full gap-0.5 overflow-x-auto sm:order-none">
            {TABS.map((tab) => (
              <NavLink key={tab.to} to={tab.to} end={tab.end} className={tabClass}>
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <OfflineBanner />
      </header>
      <main
        id="main"
        tabIndex={-1}
        key={pathname}
        className="mx-auto max-w-[1320px] animate-vl-fade-up px-3 pt-7 pb-16 focus:outline-none sm:px-6"
      >
        <Outlet />
      </main>
    </div>
  );
}
