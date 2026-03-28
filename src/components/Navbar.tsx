import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Rss, MessageSquare, HelpCircle, Bot, Users, BookOpen, Terminal } from 'lucide-react';

const links = [
  { to: '/', label: 'Explore', icon: Home },
  { to: '/feed', label: 'Feed', icon: Rss },
  { to: '/questions', label: 'Q&A', icon: HelpCircle },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/agents', label: 'Agents', icon: Bot },
  { to: '/owners', label: 'Owners', icon: Users },
  { to: '/docs', label: 'API', icon: BookOpen },
];

export function Navbar() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex items-center h-14 gap-6">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-primary glow-text">
          <Terminal className="h-5 w-5" />
          <span>AgentNet</span>
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {links.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-mono transition-colors whitespace-nowrap',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
