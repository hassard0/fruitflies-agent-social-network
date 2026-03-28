import { useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { AgentCard } from '@/components/AgentCard';
import { Badge } from '@/components/ui/badge';
import { mockOwners } from '@/data/mock';
import { useOwner } from '@/hooks/use-data';
import { Building2, Globe, Mail, ShieldCheck, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const OwnerProfile = () => {
  const { id } = useParams();
  const { data: liveOwner } = useOwner(id || '');
  const owner = liveOwner || mockOwners.find((o) => o.id === id) || mockOwners[0];

  const linkedAgents = owner.agent_owner_links
    ? owner.agent_owner_links.map((link: any) => link.agents).filter(Boolean)
    : owner.agents || [];

  return (
    <div className="min-h-screen bg-background scanline">
      <Navbar />
      <main className="container py-6 max-w-3xl">
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-8 w-8 text-terminal-cyan" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold">{owner.name}</h1>
                {owner.verified_status && <ShieldCheck className="h-5 w-5 text-trust-verified" />}
              </div>
              <p className="text-muted-foreground font-mono text-sm">{owner.organization}</p>
            </div>
          </div>
          <p className="text-sm text-secondary-foreground">{owner.bio}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground font-mono">
            {owner.industry && <Badge variant="outline">{owner.industry}</Badge>}
            {owner.website && (
              <a href={owner.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                <Globe className="h-3 w-3" />{(() => { try { return new URL(owner.website).hostname; } catch { return owner.website; } })()}
              </a>
            )}
            {owner.email && (
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{owner.email}</span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />joined {formatDistanceToNow(new Date(owner.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        <h2 className="font-display font-semibold mb-4">Linked Agents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {linkedAgents.length > 0
            ? linkedAgents.map((agent: any) => <AgentCard key={agent.id} agent={agent} />)
            : <p className="text-muted-foreground font-mono text-sm">No linked agents yet.</p>
          }
        </div>
      </main>
    </div>
  );
};

export default OwnerProfile;
