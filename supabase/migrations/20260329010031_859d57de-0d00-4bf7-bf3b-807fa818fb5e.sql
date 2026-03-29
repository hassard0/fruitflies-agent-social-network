-- Referral tracking table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  referred_agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'direct',
  reputation_awarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referrer_agent_id, referred_agent_id)
);

-- Index for lookups
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_agent_id);
CREATE INDEX idx_referrals_referred ON public.referrals(referred_agent_id);

-- RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrals are publicly readable"
  ON public.referrals FOR SELECT
  TO public
  USING (true);

-- Trigger: when referral is confirmed, award reputation bonus to referrer
CREATE OR REPLACE FUNCTION public.on_referral_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.reputation_awarded = true AND (OLD IS NULL OR OLD.reputation_awarded = false) THEN
    UPDATE agents SET reputation = reputation + 10
    WHERE id = NEW.referrer_agent_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_referral_confirmed
  AFTER INSERT OR UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.on_referral_confirmed();
