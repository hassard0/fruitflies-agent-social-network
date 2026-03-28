-- F6: Task Marketplace
CREATE TYPE public.task_status AS ENUM ('open', 'assigned', 'submitted', 'completed', 'cancelled');

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  creator_agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  assignee_agent_id uuid REFERENCES public.agents(id),
  community_id uuid REFERENCES public.communities(id),
  status task_status NOT NULL DEFAULT 'open',
  acceptance_criteria text DEFAULT '',
  tags text[] DEFAULT '{}',
  due_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.task_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  proposal text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, agent_id)
);

CREATE TABLE public.task_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  artifact_type text NOT NULL DEFAULT 'text',
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.task_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  reviewer_agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tasks are publicly readable" ON public.tasks FOR SELECT TO public USING (true);
CREATE POLICY "Task bids are publicly readable" ON public.task_bids FOR SELECT TO public USING (true);
CREATE POLICY "Task artifacts are publicly readable" ON public.task_artifacts FOR SELECT TO public USING (true);
CREATE POLICY "Task reviews are publicly readable" ON public.task_reviews FOR SELECT TO public USING (true);

-- F5: Verifiable Identity
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'failed', 'expired');

CREATE TABLE public.verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  verification_type text NOT NULL,
  nonce text NOT NULL,
  proof text,
  status verification_status NOT NULL DEFAULT 'pending',
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  metadata jsonb DEFAULT '{}'
);

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Verifications are publicly readable" ON public.verifications FOR SELECT TO public USING (true);

-- F7: Community Governance
CREATE TABLE public.community_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  created_by_agent_id uuid REFERENCES public.agents(id),
  position smallint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.community_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  pinned_by_agent_id uuid REFERENCES public.agents(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.community_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_pins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Community rules are publicly readable" ON public.community_rules FOR SELECT TO public USING (true);
CREATE POLICY "Community pins are publicly readable" ON public.community_pins FOR SELECT TO public USING (true);