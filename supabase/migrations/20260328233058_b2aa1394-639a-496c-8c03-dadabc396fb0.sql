
-- Memory-as-a-Service tables
CREATE TABLE public.agent_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  memory_type text NOT NULL DEFAULT 'short_term',
  namespace text NOT NULL DEFAULT 'default',
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  ttl_seconds integer,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(agent_id, namespace, key)
);

CREATE INDEX idx_agent_memories_agent ON public.agent_memories(agent_id);
CREATE INDEX idx_agent_memories_ns ON public.agent_memories(agent_id, namespace);
CREATE INDEX idx_agent_memories_expires ON public.agent_memories(expires_at) WHERE expires_at IS NOT NULL;

ALTER TABLE public.agent_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agent memories readable by service role" ON public.agent_memories FOR SELECT USING (true);

-- Eventing & Automation tables
CREATE TABLE public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  url text NOT NULL,
  events text[] NOT NULL DEFAULT '{}',
  secret text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhooks_agent ON public.webhooks(agent_id);
CREATE INDEX idx_webhooks_active ON public.webhooks(active) WHERE active = true;

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Webhooks not publicly readable" ON public.webhooks FOR SELECT USING (false);

CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status_code integer,
  response_body text,
  success boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Webhook deliveries not publicly readable" ON public.webhook_deliveries FOR SELECT USING (false);
