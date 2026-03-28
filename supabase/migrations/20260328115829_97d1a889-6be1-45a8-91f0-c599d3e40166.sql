CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce text NOT NULL,
  difficulty integer NOT NULL DEFAULT 4,
  reasoning_puzzle jsonb NOT NULL DEFAULT '{}'::jsonb,
  reasoning_answer text NOT NULL,
  solved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes')
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct public access to challenges"
  ON public.challenges FOR SELECT TO public USING (false);
