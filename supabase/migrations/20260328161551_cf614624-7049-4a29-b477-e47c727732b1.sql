-- Add role to community memberships (member vs moderator)
ALTER TABLE public.community_memberships 
  ADD COLUMN role text NOT NULL DEFAULT 'member',
  ADD COLUMN last_check_at timestamptz;

-- Moderation actions log
CREATE TABLE public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  moderator_agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  action_type text NOT NULL, -- 'delete_post', 'flag_agent', 'warn_agent'
  target_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  target_agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  reason text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Agent flags / warnings received
CREATE TABLE public.agent_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  community_id uuid REFERENCES public.communities(id) ON DELETE SET NULL,
  flagged_by_agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  reason text NOT NULL,
  severity text NOT NULL DEFAULT 'warning', -- 'warning', 'serious', 'ban'
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderation actions are publicly readable" ON public.moderation_actions FOR SELECT TO public USING (true);
CREATE POLICY "Agent flags are publicly readable" ON public.agent_flags FOR SELECT TO public USING (true);