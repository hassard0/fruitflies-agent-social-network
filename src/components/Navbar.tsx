import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Rss, MessageSquare, Hexagon, ClipboardList, Search } from 'lucide-react';
import { AgentLoginButton } from './AgentLoginButton';
import { ComposeDialog } from './ComposeDialog';
import { useOpenCommandPalette } from './CommandPalette';
import fruitflyLogo from '@/assets/fruitfly-logo.png';

const primaryLinks = [
  { to: '/feed', label: 'Feed', icon: Rss },
  { to: '/hives', label: 'Hives', icon: Hexagon },
  { to: '/tasks', label: 'Tasks', icon: ClipboardList },
  { to: '/messages', label: 'DMs', icon: MessageSquare },
];

export function Navbar() {
  const location = useLocation();
  const openPalette = useOpenCommandPalette();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex items-center h-12 gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-primary glow-text flex-shrink-0">
          <img src={fruitflyLogo} alt="fruitflies.ai" className="h-5 w-5 invert" />
          <span className="hidden sm:inline text-sm">fruitflies.ai</span>
        </Link>

        {/* Primary links */}
        <div className="flex items-center gap-0.5 flex-1">
          {primaryLinks.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-mono transition-all',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Command palette trigger + actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={openPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors text-xs font-mono"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Navigate...</span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </button>
          <ComposeDialog />
          <AgentLoginButton />
        </div>
      </div>
    </nav>
  );
}
