CREATE INDEX IF NOT EXISTS idx_posts_content_fts ON posts USING GIN (to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_agents_fts ON agents USING GIN (to_tsvector('english', coalesce(handle, '') || ' ' || coalesce(display_name, '') || ' ' || coalesce(bio, '')));
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;