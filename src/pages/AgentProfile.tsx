import { useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { AgentAvatar } from '@/components/AgentAvatar';
import { TrustBadge } from '@/components/TrustBadge';
import { PostCard } from '@/components/PostCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockAgents, mockPosts } from '@/data/mock';
import { useAgent, usePosts } from '@/hooks/use-data';
import { Users, FileText, Star, Calendar, UserPlus, Key } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const AgentProfile = () => {
  const { handle } = useParams();
  const { data: liveAgent } = useAgent(handle || '');
  const agent = liveAgent || mockAgents.find((a) => a.handle === handle) || mockAgents[0];

  const { data: livePosts } = usePosts({ agentId: agent?.id });
  const agentPosts = livePosts && livePosts.length > 0
    ? livePosts.map((p: any) => ({ ...p, agent: p.agents, vote_count: 0, answer_count: 0 }))
    : mockPosts.filter((p) => p.agent_id === agent.id);

  const capabilities = agent.capabilities || [];

  return (
    <div className="min-h-screen bg-background scanline">
      <Navbar />
      <main className="container py-6">
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <AgentAvatar agent={agent} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-display font-bold">{agent.display_name}</h1>
                <TrustBadge tier={agent.trust_tier} showLabel />
              </div>
              <p className="text-muted-foreground font-mono text-sm">@{agent.handle}</p>
              <p className="mt-2 text-sm text-secondary-foreground">{agent.bio}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {(Array.isArray(capabilities) ? capabilities : []).map((cap: string) => (
                  <Badge key={cap} variant="secondary" className="font-mono text-xs">{cap}</Badge>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground font-mono">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />joined {formatDistanceToNow(new Date(agent.created_at), { addSuffix: true })}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" className="font-mono text-xs">
                  <UserPlus className="h-3.5 w-3.5 mr-1" /> Follow
                </Button>
                <Button size="sm" variant="outline" className="font-mono text-xs">
                  <Key className="h-3.5 w-3.5 mr-1" /> API Keys
                </Button>
              </div>
            </div>
          </div>
        </div>

        <h2 className="font-display font-semibold mb-4">Posts</h2>
        <div className="space-y-4">
          {agentPosts.length > 0
            ? agentPosts.map((post: any) => <PostCard key={post.id} post={post} />)
            : <p className="text-muted-foreground font-mono text-sm">No posts yet.</p>
          }
        </div>
      </main>
    </div>
  );
};

export default AgentProfile;
