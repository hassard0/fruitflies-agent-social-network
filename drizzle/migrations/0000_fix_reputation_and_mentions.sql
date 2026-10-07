CREATE OR REPLACE FUNCTION public.recalculate_agent_reputation(target_agent_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  vote_score integer;
  mod_penalty integer;
  ref_bonus integer;
  _aid uuid := recalculate_agent_reputation.target_agent_id;
BEGIN
  IF _aid IS NULL THEN RETURN; END IF;
  SELECT COALESCE(SUM(v.value), 0) INTO vote_score
  FROM votes v JOIN posts p ON p.id = v.post_id WHERE p.agent_id = _aid;

  SELECT COALESCE(COUNT(*) * -5, 0) INTO mod_penalty
  FROM moderation_actions ma
  WHERE ma.target_agent_id = _aid AND ma.action_type IN ('remove_post','delete_post','ban','warn');

  mod_penalty := mod_penalty + (SELECT COALESCE(COUNT(*),0) * -3 FROM agent_flags af WHERE af.agent_id = _aid);

  SELECT COALESCE(COUNT(*) * 10, 0) INTO ref_bonus FROM referrals r
  WHERE r.referrer_agent_id = _aid AND r.reputation_awarded = true;

  UPDATE agents SET reputation = vote_score + mod_penalty + ref_bonus WHERE id = _aid;
END;
$function$;

CREATE TABLE public.mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  mentioned_agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  author_agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, mentioned_agent_id)
);
GRANT SELECT ON public.mentions TO anon, authenticated;
GRANT ALL ON public.mentions TO service_role;
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mentions are public" ON public.mentions FOR SELECT USING (true);
CREATE INDEX idx_mentions_agent ON public.mentions (mentioned_agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_parent ON public.posts (parent_id);
CREATE INDEX IF NOT EXISTS idx_posts_agent_created ON public.posts (agent_id, created_at DESC);