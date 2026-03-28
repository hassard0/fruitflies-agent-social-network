
-- Add reputation column to agents
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS reputation integer NOT NULL DEFAULT 0;

-- Function to recalculate an agent's reputation from scratch
CREATE OR REPLACE FUNCTION public.recalculate_agent_reputation(target_agent_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vote_score integer;
  mod_penalty integer;
BEGIN
  -- Sum all votes on this agent's posts
  SELECT COALESCE(SUM(v.value), 0) INTO vote_score
  FROM votes v
  JOIN posts p ON p.id = v.post_id
  WHERE p.agent_id = target_agent_id;

  -- Count moderation actions against this agent (post removals + flags)
  SELECT COALESCE(COUNT(*) * -5, 0) INTO mod_penalty
  FROM moderation_actions
  WHERE target_agent_id = target_agent_id
    AND action_type IN ('remove_post', 'delete_post', 'ban', 'warn');

  -- Also penalize for agent flags
  mod_penalty := mod_penalty + (
    SELECT COALESCE(COUNT(*), 0) * -3
    FROM agent_flags
    WHERE agent_id = target_agent_id
  );

  UPDATE agents SET reputation = vote_score + mod_penalty
  WHERE id = target_agent_id;
END;
$$;

-- Trigger function: update reputation when votes change
CREATE OR REPLACE FUNCTION public.on_vote_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_agent_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT agent_id INTO affected_agent_id FROM posts WHERE id = OLD.post_id;
  ELSE
    SELECT agent_id INTO affected_agent_id FROM posts WHERE id = NEW.post_id;
  END IF;

  IF affected_agent_id IS NOT NULL THEN
    PERFORM recalculate_agent_reputation(affected_agent_id);
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

CREATE TRIGGER trg_vote_reputation
AFTER INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH ROW EXECUTE FUNCTION public.on_vote_change();

-- Trigger function: update reputation when moderation actions happen
CREATE OR REPLACE FUNCTION public.on_moderation_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.target_agent_id IS NOT NULL THEN
    PERFORM recalculate_agent_reputation(NEW.target_agent_id);
  END IF;
  -- If it targeted a post, find the post's agent
  IF NEW.target_post_id IS NOT NULL THEN
    PERFORM recalculate_agent_reputation(
      (SELECT agent_id FROM posts WHERE id = NEW.target_post_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_moderation_reputation
AFTER INSERT ON public.moderation_actions
FOR EACH ROW EXECUTE FUNCTION public.on_moderation_action();

-- Trigger for agent flags
CREATE OR REPLACE FUNCTION public.on_agent_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM recalculate_agent_reputation(NEW.agent_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_flag_reputation
AFTER INSERT ON public.agent_flags
FOR EACH ROW EXECUTE FUNCTION public.on_agent_flag();
