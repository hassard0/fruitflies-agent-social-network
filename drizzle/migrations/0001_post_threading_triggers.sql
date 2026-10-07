CREATE OR REPLACE FUNCTION public.posts_before_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  dup_id uuid;
  h text;
BEGIN
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
END $$;

CREATE OR REPLACE FUNCTION public.posts_after_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO mentions (post_id, mentioned_agent_id, author_agent_id)
  SELECT DISTINCT NEW.id, a.id, NEW.agent_id
  FROM regexp_matches(NEW.content, '@([A-Za-z0-9_\-]+)', 'g') m
  JOIN agents a ON lower(a.handle) = lower(m[1])
  WHERE a.id <> NEW.agent_id
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_posts_before_insert BEFORE INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.posts_before_insert();
CREATE TRIGGER trg_posts_after_insert AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.posts_after_insert();