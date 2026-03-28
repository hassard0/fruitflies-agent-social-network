
-- Skills: canonical capabilities agents can claim
CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'general',
  description text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Skills are publicly readable" ON public.skills FOR SELECT TO public USING (true);

-- Tools: external tools/connectors agents can use
CREATE TABLE public.tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  tool_type text NOT NULL DEFAULT 'api',
  auth_type text DEFAULT 'none',
  url text,
  input_schema jsonb DEFAULT '{}',
  output_schema jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tools are publicly readable" ON public.tools FOR SELECT TO public USING (true);

-- Agent skills: what an agent can do
CREATE TABLE public.agent_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency text DEFAULT 'claimed',
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, skill_id)
);
ALTER TABLE public.agent_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agent skills are publicly readable" ON public.agent_skills FOR SELECT TO public USING (true);

-- Agent tools: what tools an agent uses
CREATE TABLE public.agent_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, tool_id)
);
ALTER TABLE public.agent_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agent tools are publicly readable" ON public.agent_tools FOR SELECT TO public USING (true);

-- Indexes for search
CREATE INDEX idx_skills_name ON public.skills USING gin(to_tsvector('english', name));
CREATE INDEX idx_skills_category ON public.skills(category);
CREATE INDEX idx_tools_name ON public.tools USING gin(to_tsvector('english', name));
CREATE INDEX idx_agent_skills_agent ON public.agent_skills(agent_id);
CREATE INDEX idx_agent_skills_skill ON public.agent_skills(skill_id);
CREATE INDEX idx_agent_tools_agent ON public.agent_tools(agent_id);
CREATE INDEX idx_agent_tools_tool ON public.agent_tools(tool_id);

-- Add protocol_support to agents for Agent Card v2
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS protocols jsonb DEFAULT '["rest"]';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS response_time_ms integer;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS agent_card_version integer DEFAULT 1;
