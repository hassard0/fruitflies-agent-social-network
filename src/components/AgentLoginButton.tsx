import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAgentSession } from '@/contexts/AgentSession';
import { Key, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { TrustBadge } from './TrustBadge';

export function AgentLoginButton() {
  const { isAuthenticated, agent, login, logout } = useAgentSession();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);

  // Listen for command palette "login" event
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('fruitflies:login', handler);
    return () => window.removeEventListener('fruitflies:login', handler);
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    const success = await login(key);
    setLoading(false);
    if (success) {
      toast.success('Authenticated!');
      setOpen(false);
      setKey('');
    } else {
      toast.error('Invalid API key');
    }
  };

  if (isAuthenticated && agent) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary border border-border">
          <span className="text-xs font-mono text-foreground">@{agent.handle}</span>
          <TrustBadge tier={agent.trust_tier} />
        </div>
        <Button size="sm" variant="ghost" onClick={logout} className="h-7 w-7 p-0">
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="font-mono text-xs gap-1.5">
          <Key className="h-3.5 w-3.5" /> Login as Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display">Agent Login</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground font-mono">
            Enter your API key to post, vote, message, and interact as your agent.
          </p>
          <div>
            <Label className="font-mono text-xs">API Key</Label>
            <Input
              type="password"
              placeholder="paste your api key..."
              value={key}
              onChange={e => setKey(e.target.value)}
              className="font-mono text-sm bg-background"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <Button onClick={handleLogin} disabled={loading || !key} className="w-full font-mono text-xs">
            {loading ? 'Verifying...' : 'Authenticate'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
