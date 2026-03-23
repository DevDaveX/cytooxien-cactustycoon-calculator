import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useChangelog } from '@/hooks/useChangelog';

interface WikiLayoutProps {
  children: ReactNode;
  sidebarPages?: { slug: string; title: string; icon: string; category: string }[];
}

const NAV_LINKS = [
  { to: '/', label: 'Rechner', icon: '🧮' },
  { to: '/changelog', label: 'Changelog', icon: '📋' },
  { to: '/feedback', label: 'Feedback', icon: '📝' },
];

export function WikiLayout({ children, sidebarPages = [] }: WikiLayoutProps) {
  const { user, isAdmin, isEditor, signInWithDiscord, signOut, loading } = useAuth();
  const { data: changelogEntries } = useChangelog();
  const hasChangelog = (changelogEntries?.length ?? 0) > 0;
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const categories: Record<string, typeof sidebarPages> = {};
  sidebarPages.forEach(p => {
    if (!categories[p.category]) categories[p.category] = [];
    categories[p.category].push(p);
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {}
      <header className="border-b-4 border-border bg-card sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mc-button text-sm lg:hidden">
              ☰
            </button>
            <Link to="/" className="flex items-center gap-2 hover:opacity-80">
              <span className="text-2xl">🌵</span>
              <span className="font-title text-[10px] text-cactus pixel-text hidden sm:inline">
                Cactus Tycoon Tools
              </span>
              <span className="font-title text-[10px] text-cactus pixel-text sm:hidden">
                CT Tools
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {!loading && (
              user ? (
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Link to="/admin" className="mc-button text-sm">
                      ⚙️ Admin
                    </Link>
                  )}
                  <div className="flex items-center gap-2">
                    {user.avatarUrl && (
                      <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-sm border border-border" />
                    )}
                    <span className="text-sm text-foreground hidden md:inline">{user.displayName}</span>
                  </div>
                  <button onClick={signOut} className="mc-button text-sm">
                    Logout
                  </button>
                </div>
              ) : (
                <button onClick={signInWithDiscord} className="mc-button mc-button-primary text-sm">
                  🎮 Login mit Discord
                </button>
              )
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {}
        <aside className={`${sidebarOpen ? 'w-56' : 'w-0 overflow-hidden'} transition-all duration-200 border-r-2 border-border bg-sidebar-background flex-shrink-0 hidden lg:block`}>
          <nav className="p-3 space-y-4 sticky top-16">
            {}
            <div className="space-y-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block px-3 py-2 text-sm hover:bg-sidebar-accent flex items-center gap-1 ${
                    location.pathname === link.to ? 'bg-sidebar-accent text-cactus' : 'text-sidebar-foreground'
                  }`}
                >
                  {link.icon} {link.label}
                  {link.to === '/changelog' && hasChangelog && (
                    <span className="w-2 h-2 rounded-full bg-cactus inline-block ml-auto animate-pulse" />
                  )}
                </Link>
              ))}
            </div>

          </nav>
        </aside>

        {}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {}
      <footer className="border-t-2 border-border bg-card px-4 py-3 text-center">
        <p className="text-muted-foreground text-sm">
          Community Tools · nicht offiziell · Powered by Noxera
        </p>
      </footer>
    </div>
  );
}
