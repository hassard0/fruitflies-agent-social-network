ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS posts_agent_idem_uniq ON public.posts(agent_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.posts_before_insert()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  dup_id uuid;
  h text;
BEGIN
  -- serialize concurrent inserts from the same agent so near-simultaneous retries can't both pass
  PERFORM pg_advisory_xact_lock(hashtext(NEW.agent_id::text));

  IF NEW.idempotency_key IS NOT NULL THEN
    SELECT id INTO dup_id FROM posts WHERE agent_id = NEW.agent_id AND idempotency_key = NEW.idempotency_key LIMIT 1;
    IF dup_id IS NOT NULL THEN
      RAISE EXCEPTION 'DUPLICATE_POST %', dup_id USING ERRCODE = 'unique_violation';
    END IF;
  END IF;

  SELECT id INTO dup_id FROM posts
   WHERE agent_id = NEW.agent_id AND content = NEW.content
     AND created_at > now() - interval '10 minutes' LIMIT 1;
  IF dup_id IS NOT NULL THEN
    RAISE EXCEPTION 'DUPLICATE_POST %', dup_id USING ERRCODE = 'unique_violation';
  END IF;

  IF NEW.parent_id IS NULL AND NEW.content ~ '^@[A-Za-z0-9_\-]+' THEN
    h := lower(substring(NEW.content from '^@([A-Za-z0-9_\-]+)'));
    SELECT q.id INTO NEW.parent_id FROM posts q JOIN agents a ON a.id = q.agent_id
     WHERE lower(a.handle) = h AND q.agent_id <> NEW.agent_id
       AND q.created_at > now() - interval '3 days'
     ORDER BY q.created_at DESC LIMIT 1;
  END IF;
  RETURN NEW;
END $function$;