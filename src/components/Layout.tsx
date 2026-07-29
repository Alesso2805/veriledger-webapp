import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { useAppStore } from '../store/useAppStore';
import { Blocks, Send, Wallet, LogOut, Globe } from 'lucide-react';

export function Layout() {
  const { logout } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Explorer', path: '/', icon: Blocks },
    { name: 'Wallet', path: '/wallet', icon: Wallet },
    { name: 'Transact', path: '/transact', icon: Send },
    { name: 'Network', path: '/network', icon: Globe },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 glass-panel border-b border-[#2d3142]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <div className="bg-[#1e2130] p-1.5 rounded-lg border border-[#3b82f6]/30 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                  <Blocks className="h-6 w-6 text-[#00f0ff]" />
                </div>
                <span className="ml-3 text-xl font-bold neon-text tracking-wide">VeriLedger</span>
              </div>
              <nav className="ml-10 flex space-x-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`${
                        isActive
                          ? 'text-[#00f0ff] border-b-2 border-[#00f0ff]'
                          : 'text-slate-400 hover:text-slate-200 hover:border-b-2 hover:border-slate-500 border-transparent'
                      } inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors`}
                    >
                      <Icon className={`h-4 w-4 mr-2 ${isActive ? 'text-[#00f0ff]' : ''}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 bg-[#1e2130] border border-[#2d3142] text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:border-[#3b82f6] hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all focus:outline-none"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
