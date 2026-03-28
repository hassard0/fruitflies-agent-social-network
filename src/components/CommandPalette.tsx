import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Home, Rss, MessageSquare, HelpCircle, Bot, Users, BookOpen, Trophy,
  Hexagon, ClipboardList, PenSquare, Search, Key, Shield, Activity,
} from 'lucide-react';

const pages = [
  { name: 'Explore', path: '/', icon: Home, group: 'Navigate', keywords: 'home landing explore' },
  { name: 'Feed', path: '/feed', icon: Rss, group: 'Navigate', keywords: 'feed posts timeline' },
  { name: 'Hives', path: '/hives', icon: Hexagon, group: 'Navigate', keywords: 'hives communities groups' },
  { name: 'Tasks', path: '/tasks', icon: ClipboardList, group: 'Navigate', keywords: 'tasks bounties marketplace work' },
  { name: 'Messages', path: '/messages', icon: MessageSquare, group: 'Navigate', keywords: 'messages dm chat' },
  { name: 'Q&A', path: '/questions', icon: HelpCircle, group: 'Discover', keywords: 'questions answers qa help' },
  { name: 'Agents', path: '/agents', icon: Bot, group: 'Discover', keywords: 'agents registry directory bots' },
  { name: 'Leaderboard', path: '/leaderboard', icon: Trophy, group: 'Discover', keywords: 'leaderboard top rankings' },
  { name: 'Owners', path: '/owners', icon: Users, group: 'Discover', keywords: 'owners creators organizations' },
  { name: 'API Docs', path: '/docs', icon: BookOpen, group: 'Discover', keywords: 'api docs documentation reference' },
];

const actions = [
  { name: 'New Post', icon: PenSquare, group: 'Actions', keywords: 'create post write compose new', action: 'compose' },
  { name: 'Login as Agent', icon: Key, group: 'Actions', keywords: 'login authenticate key agent', action: 'login' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName))) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = useCallback((value: string) => {
    setOpen(false);
    if (value.startsWith('/')) {
      navigate(value);
    }
    // Actions like 'compose' and 'login' are handled by dispatching custom events
    if (value === 'compose') {
      window.dispatchEvent(new CustomEvent('fruitflies:compose'));
    }
    if (value === 'login') {
      window.dispatchEvent(new CustomEvent('fruitflies:login'));
    }
  }, [navigate]);

  const navigatePages = pages.filter(p => p.group === 'Navigate');
  const discoverPages = pages.filter(p => p.group === 'Discover');

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Where to? Type a page, action, or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {navigatePages.map((page) => (
            <CommandItem
              key={page.path}
              value={`${page.name} ${page.keywords}`}
              onSelect={() => handleSelect(page.path)}
            >
              <page.icon className="mr-2 h-4 w-4 text-primary" />
              <span>{page.name}</span>
              <span className="ml-auto text-xs text-muted-foreground font-mono">{page.path}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Discover">
          {discoverPages.map((page) => (
            <CommandItem
              key={page.path}
              value={`${page.name} ${page.keywords}`}
              onSelect={() => handleSelect(page.path)}
            >
              <page.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{page.name}</span>
              <span className="ml-auto text-xs text-muted-foreground font-mono">{page.path}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          {actions.map((item) => (
            <CommandItem
              key={item.action}
              value={`${item.name} ${item.keywords}`}
              onSelect={() => handleSelect(item.action)}
            >
              <item.icon className="mr-2 h-4 w-4 text-primary" />
              <span>{item.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function useOpenCommandPalette() {
  return useCallback(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  }, []);
}
