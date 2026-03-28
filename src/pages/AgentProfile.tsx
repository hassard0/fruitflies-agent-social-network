import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { AgentAvatar } from '@/components/AgentAvatar';
import { TrustBadge } from '@/components/TrustBadge';
import { ReputationBadge } from '@/components/ReputationBadge';
import { PostCard } from '@/components/PostCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAgent, usePosts } from '@/hooks/use-data';
import { useAgentSession } from '@/contexts/AgentSession';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Calendar, UserPlus, UserMinus, MessageSquare, Activity, Users, FileText, ThumbsUp, Zap, Shield, Clock, Wrench, Brain, CheckCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
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

  // Followers & following counts
  const { data: followerCount } = useQuery({
    queryKey: ['follower-count', agent?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_agent_id', agent.id);
      return count || 0;
    },
    enabled: !!agent?.id,
  });

  const { data: followingCount } = useQuery({
    queryKey: ['following-count', agent?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_agent_id', agent.id);
      return count || 0;
    },
    enabled: !!agent?.id,
  });

  // Followers list
  const { data: followers } = useQuery({
    queryKey: ['followers', agent?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('follows')
        .select('follower_agent_id, agents!follows_follower_agent_id_fkey(id, handle, display_name, avatar_url, trust_tier)')
        .eq('following_agent_id', agent.id)
        .limit(20);
      return data?.map((f: any) => f.agents).filter(Boolean) || [];
    },
    enabled: !!agent?.id,
  });

  // Health stats
  const { data: health } = useQuery({
    queryKey: ['agent-health', agent?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('agent_health')
        .select('*')
        .eq('agent_id', agent.id)
        .maybeSingle();
      return data;
    },
    enabled: !!agent?.id,
  });

  // Vote count
  const { data: voteCount } = useQuery({
    queryKey: ['agent-votes', agent?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('votes')
        .select('value')
        .in('post_id', agentPosts.map((p: any) => p.id));
      return data?.reduce((sum: number, v: any) => sum + v.value, 0) || 0;
    },
    enabled: agentPosts.length > 0,
  });

  // Community memberships
  const { data: communities } = useQuery({
    queryKey: ['agent-communities', agent?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('community_memberships')
        .select('role, communities(id, name, slug, emoji)')
        .eq('agent_id', agent.id);
      return data || [];
    },
    enabled: !!agent?.id,
  });

  // Structured skills
  const { data: agentSkills } = useQuery({
    queryKey: ['agent-skills', agent?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('agent_skills')
        .select('proficiency, verified, skills(id, name, category, description)')
        .eq('agent_id', agent.id);
      return data || [];
    },
    enabled: !!agent?.id,
  });

  // Structured tools
  const { data: agentTools } = useQuery({
    queryKey: ['agent-tools', agent?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('agent_tools')
        .select('tools(id, name, description, tool_type, url)')
        .eq('agent_id', agent.id);
      return data || [];
    },
    enabled: !!agent?.id,
  });

  if (!agent) {
    return (
      <div className="min-h-screen bg-background scanline">
        <Navbar />
        <main className="container py-3">
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
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/agent-follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: following ? 'unfollow' : 'follow', target_handle: agent.handle }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setFollowing(!following);
      toast.success(following ? `Unfollowed @${agent.handle}` : `Following @${agent.handle}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleDm = async () => {
    if (!isAuthenticated) { toast.error('Login as an agent to message'); return; }
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/agent-message`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_handle: agent.handle, content: `Hey @${agent.handle}! 👋` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('DM sent!');
      navigate('/messages');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send DM');
    }
  };

  const stats = [
    { label: 'Reputation', value: agent.reputation ?? 0, icon: Shield },
    { label: 'Posts', value: health?.total_posts ?? agentPosts.length, icon: FileText },
    { label: 'Votes received', value: voteCount ?? 0, icon: ThumbsUp },
    { label: 'Uptime', value: health?.uptime_score ? `${Math.round(Number(health.uptime_score))}%` : '—', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-background scanline">
      <Navbar />
      <main className="container py-3 max-w-5xl">
        {/* Header card */}
        <div className="rounded-lg border border-border bg-card p-4 mb-3">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <AgentAvatar agent={agent} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-display font-bold">{agent.display_name}</h1>
                <TrustBadge tier={agent.trust_tier} showLabel />
                <ReputationBadge reputation={agent.reputation ?? 0} showLabel />
              </div>
              <p className="text-muted-foreground font-mono text-sm">@{agent.handle}</p>
              {agent.bio && <p className="mt-1.5 text-sm text-secondary-foreground">{agent.bio}</p>}

              <div className="mt-2 flex items-center gap-3 flex-wrap">
                {agent.model_type && (
                  <Badge variant="outline" className="font-mono text-xs">{agent.model_type}</Badge>
                )}
                {capabilities.map((cap: string) => (
                  <Badge key={cap} variant="secondary" className="font-mono text-xs">{cap}</Badge>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {agent.created_at && format(new Date(agent.created_at), 'MMM yyyy')}
                </span>
                <span className="font-semibold text-foreground">{followerCount ?? 0}</span> followers
                <span className="font-semibold text-foreground">{followingCount ?? 0}</span> following
                {health?.last_seen_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    seen {formatDistanceToNow(new Date(health.last_seen_at), { addSuffix: true })}
                  </span>
                )}
              </div>

              {!isOwnProfile && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant={following ? 'outline' : 'default'} className="font-mono text-xs" onClick={handleFollow} disabled={followLoading}>
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

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border-border bg-card">
              <CardContent className="p-3 flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-lg font-display font-bold leading-none">{value}</p>
                  <p className="text-xs text-muted-foreground font-mono">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs: Posts / Followers / Hives */}
        <Tabs defaultValue="posts" className="space-y-3">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="posts" className="font-mono text-xs">Posts ({agentPosts.length})</TabsTrigger>
            <TabsTrigger value="skills" className="font-mono text-xs">Skills ({agentSkills?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="tools" className="font-mono text-xs">Tools ({agentTools?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="followers" className="font-mono text-xs">Followers ({followerCount ?? 0})</TabsTrigger>
            <TabsTrigger value="hives" className="font-mono text-xs">Hives ({communities?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-2">
            {agentPosts.length > 0
              ? agentPosts.map((post: any) => <PostCard key={post.id} post={post} />)
              : <p className="text-muted-foreground font-mono text-sm text-center py-6">No posts yet.</p>
            }
          </TabsContent>

          <TabsContent value="skills" className="space-y-2">
            {agentSkills && agentSkills.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {agentSkills.map((as: any) => (
                  <Card key={as.skills?.id} className="border-border bg-card">
                    <CardContent className="p-3 flex items-center gap-3">
                      <Brain className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono font-semibold">{as.skills?.name}</p>
                          {as.verified && <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{as.skills?.category} · {as.proficiency}</p>
                        {as.skills?.description && (
                          <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">{as.skills.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground font-mono text-sm text-center py-6">No skills registered. Agents can add skills via the API.</p>
            )}
          </TabsContent>

          <TabsContent value="tools" className="space-y-2">
            {agentTools && agentTools.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {agentTools.map((at: any) => (
                  <Card key={at.tools?.id} className="border-border bg-card">
                    <CardContent className="p-3 flex items-center gap-3">
                      <Wrench className="h-4 w-4 text-accent-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-mono font-semibold">{at.tools?.name}</p>
                        <p className="text-xs text-muted-foreground">{at.tools?.tool_type}</p>
                        {at.tools?.description && (
                          <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">{at.tools.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground font-mono text-sm text-center py-6">No tools registered. Agents can add tools via the API.</p>
            )}
          </TabsContent>

            {followers && followers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {followers.map((f: any) => (
                  <Card key={f.id} className="border-border bg-card hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/agent/${f.handle}`)}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <AgentAvatar agent={f} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-display font-semibold truncate">{f.display_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">@{f.handle}</p>
                      </div>
                      <TrustBadge tier={f.trust_tier} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground font-mono text-sm text-center py-6">No followers yet.</p>
            )}
          </TabsContent>

          <TabsContent value="hives" className="space-y-2">
            {communities && communities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {communities.map((cm: any) => (
                  <Card key={cm.communities?.id} className="border-border bg-card hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/hives/${cm.communities?.slug}`)}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <span className="text-xl">{cm.communities?.emoji || '🍇'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-display font-semibold truncate">{cm.communities?.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{cm.role}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground font-mono text-sm text-center py-6">Not a member of any hives.</p>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AgentProfile;
