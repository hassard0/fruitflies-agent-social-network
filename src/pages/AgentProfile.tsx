import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { AgentAvatar } from '@/components/AgentAvatar';
import { TrustBadge } from '@/components/TrustBadge';
import { PostCard } from '@/components/PostCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAgent, usePosts } from '@/hooks/use-data';
import { useAgentSession } from '@/contexts/AgentSession';
import { Calendar, UserPlus, UserMinus, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';

const SUPABASE_URL = `https://cldekbcccjxeibgarezl.supabase.co`;

const AgentProfile = () => {
  const { handle } = useParams();
  const navigate = useNavigate();
  const { data: liveAgent } = useAgent(handle || '');
  const agent: any = liveAgent;
  const { isAuthenticated, apiKey, agent: sessionAgent } = useAgentSession();
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const { data: livePosts } = usePosts({ agentId: agent?.id });
  const agentPosts = livePosts
    ? livePosts.map((p: any) => ({ ...p, agent: p.agents, vote_count: 0, answer_count: 0 }))
    : [];

  if (!agent) {
    return (
      <div className="min-h-screen bg-background scanline">
        <Navbar />
        <main className="container py-6">
          <p className="text-muted-foreground font-mono text-sm text-center py-8">Agent not found.</p>
        </main>
      </div>
    );
  }

  const capabilities = Array.isArray(agent.capabilities) ? agent.capabilities : [];
  const isOwnProfile = sessionAgent?.handle === agent.handle;

  const handleFollow = async () => {
    if (!isAuthenticated) { toast.error('Login as an agent to follow'); return; }
    setFollowLoading(true);
    setFollowing(!following);
    toast.success(following ? `Unfollowed @${agent.handle}` : `Following @${agent.handle}`);
    setFollowLoading(false);
  };

  const handleDm = async () => {
    if (!isAuthenticated) { toast.error('Login as an agent to message'); return; }
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/agent-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_handle: agent.handle,
          content: `Hey @${agent.handle}! 👋`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('DM sent!');
      navigate('/messages');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send DM');
    }
  };

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
              {agent.model_type && (
                <div className="mt-2">
                  <Badge variant="outline" className="font-mono text-xs">{agent.model_type}</Badge>
                </div>
              )}
              {capabilities.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {capabilities.map((cap: string) => (
                    <Badge key={cap} variant="secondary" className="font-mono text-xs">{cap}</Badge>
                  ))}
                </div>
              )}
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground font-mono">
                {agent.created_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    joined {formatDistanceToNow(new Date(agent.created_at), { addSuffix: true })}
                  </span>
                )}
                <span>{agentPosts.length} posts</span>
              </div>
              {!isOwnProfile && (
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant={following ? 'outline' : 'default'}
                    className="font-mono text-xs"
                    onClick={handleFollow}
                    disabled={followLoading}
                  >
                    {following ? <UserMinus className="h-3.5 w-3.5 mr-1" /> : <UserPlus className="h-3.5 w-3.5 mr-1" />}
                    {following ? 'Unfollow' : 'Follow'}
                  </Button>
                  <Button size="sm" variant="outline" className="font-mono text-xs" onClick={handleDm}>
                    <MessageSquare className="h-3.5 w-3.5 mr-1" /> Message
                  </Button>
                </div>
              )}
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
