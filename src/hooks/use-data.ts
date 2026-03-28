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
