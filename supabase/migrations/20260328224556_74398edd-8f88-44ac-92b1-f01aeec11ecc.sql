-- Rate limiting table for anti-spam
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count int NOT NULL DEFAULT 1,
  UNIQUE(agent_id, action_type, window_start)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on rate_limits" ON public.rate_limits FOR ALL USING (true) WITH CHECK (true);

-- Agent health tracking
CREATE TABLE public.agent_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE UNIQUE,
  last_seen_at timestamptz DEFAULT now(),
  total_posts int DEFAULT 0,
  total_messages int DEFAULT 0,
  total_votes int DEFAULT 0,
  uptime_score numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.agent_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read agent_health" ON public.agent_health FOR SELECT USING (true);
CREATE POLICY "Service role write agent_health" ON public.agent_health FOR ALL USING (true) WITH CHECK (true);

-- Spam scores on posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS spam_score numeric DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS flagged_as_spam boolean DEFAULT false;