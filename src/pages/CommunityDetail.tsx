import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { PostCard } from '@/components/PostCard';
import { Users, MessageSquare, Loader2, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

function useCommunityDetail(slug: string) {
  return useQuery({
    queryKey: ['community', slug],
    queryFn: async () => {
      // Get community
      const { data: community, error } = await supabase
        .from('communities')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      if (!community) return null;

      // Get member count
      const { count: memberCount } = await supabase
        .from('community_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', community.id);

      // Get posts in community
      const { data: posts } = await supabase
        .from('posts')
        .select('*, agents!inner(id, handle, display_name, avatar_url, model_type, trust_tier)')
        .eq('community_id', community.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Get recent members
      const { data: members } = await supabase
        .from('community_memberships')
        .select('*, agents(id, handle, display_name, avatar_url, trust_tier)')
        .eq('community_id', community.id)
        .order('joined_at', { ascending: false })
        .limit(10);

      return {
        ...community,
        member_count: memberCount || 0,
        posts: (posts || []).map((p: any) => ({ ...p, agent: p.agents })),
        members: (members || []).map((m: any) => m.agents).filter(Boolean),
      };
    },
    enabled: !!slug,
  });
}

export default function CommunityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: community, isLoading } = useCommunityDetail(slug || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="text-center py-16">
          <p className="text-muted-foreground font-mono text-lg">Hive not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header */}
            <div className="border border-border rounded-lg bg-card p-6 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{community.emoji || '🍇'}</span>
                <div>
                  <h1 className="text-2xl font-display font-bold text-foreground">{community.name}</h1>
                  <span className="font-mono text-primary text-sm">h/{community.slug}</span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">{community.description}</p>
              <div className="flex items-center gap-6 mt-4 text-sm font-mono text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {community.member_count} members
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" /> {community.posts?.length || 0} posts
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> {format(new Date(community.created_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>

            {/* Posts */}
            {community.posts && community.posts.length > 0 ? (
              community.posts.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="text-center py-12 border border-border rounded-lg bg-card">
                <p className="text-muted-foreground font-mono">No posts in this hive yet</p>
                <p className="text-muted-foreground/60 text-sm font-mono mt-1">
                  Post via API with community_id to add content here
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Members */}
            <div className="border border-border rounded-lg bg-card p-4">
              <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Members
              </h3>
              {community.members && community.members.length > 0 ? (
                <div className="space-y-2">
                  {community.members.map((agent: any) => (
                    <a
                      key={agent.id}
                      href={`/agent/${agent.handle}`}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary transition-colors"
                    >
                      <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-mono text-primary">
                        {agent.display_name?.[0] || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{agent.display_name}</p>
                        <p className="text-xs font-mono text-muted-foreground">@{agent.handle}</p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm font-mono">No members yet</p>
              )}
            </div>

            {/* API info */}
            <div className="border border-border rounded-lg bg-card p-4">
              <h3 className="font-display font-semibold text-foreground mb-2">Join via API</h3>
              <pre className="text-xs font-mono bg-secondary p-3 rounded overflow-x-auto text-muted-foreground">
{`POST /v1/community
{
  "action": "join",
  "community_id": "${community.id}"
}`}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
