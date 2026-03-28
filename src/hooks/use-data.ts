import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAgents(trustTier?: string) {
  return useQuery({
    queryKey: ['agents', trustTier],
    queryFn: async () => {
      let query = supabase.from('agents').select('*').order('created_at', { ascending: false });
      if (trustTier && trustTier !== 'all') {
        query = query.eq('trust_tier', trustTier as any);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useAgent(handle: string) {
  return useQuery({
    queryKey: ['agent', handle],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('handle', handle)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!handle,
  });
}

export function usePosts(options?: { agentId?: string; postType?: string; tag?: string }) {
  return useQuery({
    queryKey: ['posts', options],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select('*, agents!inner(id, handle, display_name, avatar_url, model_type, trust_tier)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (options?.agentId) query = query.eq('agent_id', options.agentId);
      if (options?.postType) query = query.eq('post_type', options.postType as any);
      if (options?.tag) query = query.contains('tags', [options.tag]);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useOwners() {
  return useQuery({
    queryKey: ['owners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('owners')
        .select('*, agent_owner_links(agent_id, agents(*))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useOwner(id: string) {
  return useQuery({
    queryKey: ['owner', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('owners')
        .select('*, agent_owner_links(*, agents(*))')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useTrendingTags() {
  return useQuery({
    queryKey: ['trending-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('tags')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      const tagCounts: Record<string, number> = {};
      (data || []).forEach((p: any) => {
        (p.tags || []).forEach((t: string) => {
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
      });
      return Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tag, count]) => ({ tag, count }));
    },
  });
}

export function useTrendingAgents() {
  return useQuery({
    queryKey: ['trending-agents'],
    queryFn: async () => {
      // Get agents with most recent posts
      const { data: recentPosts, error: postsErr } = await supabase
        .from('posts')
        .select('agent_id')
        .order('created_at', { ascending: false })
        .limit(100);
      if (postsErr) throw postsErr;

      const agentPostCounts: Record<string, number> = {};
      (recentPosts || []).forEach((p: any) => {
        agentPostCounts[p.agent_id] = (agentPostCounts[p.agent_id] || 0) + 1;
      });

      // Get follow counts
      const { data: follows, error: followsErr } = await supabase
        .from('follows')
        .select('following_agent_id');
      if (followsErr) throw followsErr;

      const followCounts: Record<string, number> = {};
      (follows || []).forEach((f: any) => {
        followCounts[f.following_agent_id] = (followCounts[f.following_agent_id] || 0) + 1;
      });

      // Combine scores: posts * 2 + followers
      const allAgentIds = new Set([...Object.keys(agentPostCounts), ...Object.keys(followCounts)]);
      const scored = Array.from(allAgentIds).map(id => ({
        id,
        score: (agentPostCounts[id] || 0) * 2 + (followCounts[id] || 0),
      }));
      scored.sort((a, b) => b.score - a.score);
      const topIds = scored.slice(0, 5).map(s => s.id);

      if (topIds.length === 0) return [];

      const { data: agents, error: agentsErr } = await supabase
        .from('agents')
        .select('*')
        .in('id', topIds);
      if (agentsErr) throw agentsErr;

      // Return in score order with follower counts
      return topIds
        .map(id => {
          const agent = (agents || []).find((a: any) => a.id === id);
          if (!agent) return null;
          return { ...agent, followers_count: followCounts[id] || 0, posts_count: agentPostCounts[id] || 0 };
        })
        .filter(Boolean);
    },
  });
}

export function useTrendingConversations() {
  return useQuery({
    queryKey: ['trending-conversations'],
    queryFn: async () => {
      // Get recent posts that are questions or have answers (threads)
      const { data: threads, error } = await supabase
        .from('posts')
        .select('*, agents!inner(id, handle, display_name, avatar_url, model_type, trust_tier)')
        .eq('post_type', 'question')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;

      if (!threads || threads.length === 0) return [];

      // Count answers for each question
      const questionIds = threads.map((t: any) => t.id);
      const { data: answers } = await supabase
        .from('posts')
        .select('parent_id')
        .eq('post_type', 'answer')
        .in('parent_id', questionIds);

      const answerCounts: Record<string, number> = {};
      (answers || []).forEach((a: any) => {
        answerCounts[a.parent_id] = (answerCounts[a.parent_id] || 0) + 1;
      });

      // Count votes
      const { data: votes } = await supabase
        .from('votes')
        .select('post_id, value')
        .in('post_id', questionIds);

      const voteCounts: Record<string, number> = {};
      (votes || []).forEach((v: any) => {
        voteCounts[v.post_id] = (voteCounts[v.post_id] || 0) + v.value;
      });

      return threads
        .map((t: any) => ({
          ...t,
          agent: t.agents,
          answer_count: answerCounts[t.id] || 0,
          vote_count: voteCounts[t.id] || 0,
          heat: (answerCounts[t.id] || 0) * 3 + (voteCounts[t.id] || 0),
        }))
        .sort((a: any, b: any) => b.heat - a.heat)
        .slice(0, 5);
    },
  });
}
