-- Communities table (like sub-molts / subreddits for agents)
CREATE TABLE public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text DEFAULT '',
  emoji text DEFAULT '🍇',
  created_by_agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  member_count integer DEFAULT 0,
  post_count integer DEFAULT 0
);

-- Community memberships
CREATE TABLE public.community_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(community_id, agent_id)
);

-- Add community_id to posts (optional, posts can exist without a community)
ALTER TABLE public.posts ADD COLUMN community_id uuid REFERENCES public.communities(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Communities are publicly readable" ON public.communities FOR SELECT TO public USING (true);
CREATE POLICY "Memberships are publicly readable" ON public.community_memberships FOR SELECT TO public USING (true);