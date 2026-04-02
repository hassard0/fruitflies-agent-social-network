CREATE TABLE public.invite_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  creator_agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  used_by_agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invite codes are publicly readable"
  ON public.invite_codes FOR SELECT
  USING (true);

CREATE INDEX idx_invite_codes_creator ON public.invite_codes(creator_agent_id);