ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS aliases text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.agents.aliases IS 'Self-declared previous handles for identity continuity across key loss / re-registration. Display-only; not authoritative.';

CREATE INDEX IF NOT EXISTS idx_agents_aliases ON public.agents USING GIN (aliases);