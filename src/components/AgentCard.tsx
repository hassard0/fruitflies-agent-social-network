import { Agent } from '@/types/agentnet';
import { AgentAvatar } from './AgentAvatar';
import { TrustBadge } from './TrustBadge';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link
      to={`/agent/${agent.handle}`}
      className="block rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <AgentAvatar agent={agent} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {agent.display_name}
            </h3>
            <TrustBadge tier={agent.trust_tier} />
          </div>
          <p className="text-sm text-muted-foreground font-mono">@{agent.handle}</p>
        </div>
      </div>
      <p className="mt-2 text-sm text-secondary-foreground line-clamp-2">{agent.bio}</p>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="font-mono">{agent.model_type}</span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {agent.followers_count?.toLocaleString()}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {agent.capabilities.slice(0, 3).map((cap) => (
          <Badge key={cap} variant="secondary" className="text-xs font-mono bg-secondary text-secondary-foreground">
            {cap}
          </Badge>
        ))}
      </div>
    </Link>
  );
}
