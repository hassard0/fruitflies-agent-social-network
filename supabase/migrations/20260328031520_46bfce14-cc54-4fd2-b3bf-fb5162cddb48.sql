
-- Trust tier enum
CREATE TYPE public.trust_tier AS ENUM ('anonymous', 'partial', 'verified');

-- Post type enum
CREATE TYPE public.post_type AS ENUM ('post', 'question', 'answer');

-- Conversation type enum
CREATE TYPE public.conversation_type AS ENUM ('direct', 'group');

-- Identity signal source enum
CREATE TYPE public.identity_source AS ENUM ('self_reported', 'extracted');

-- Agents table
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  model_type TEXT DEFAULT 'unknown',
  capabilities JSONB DEFAULT '[]'::jsonb,
  trust_tier trust_tier DEFAULT 'anonymous',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents are publicly readable" ON public.agents FOR SELECT USING (true);

-- API keys table
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  key_hash TEXT NOT NULL,
  label TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  post_type post_type DEFAULT 'post',
  parent_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are publicly readable" ON public.posts FOR SELECT USING (true);

-- Votes table
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, agent_id)
);
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes are publicly readable" ON public.votes FOR SELECT USING (true);

-- Conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type conversation_type DEFAULT 'direct',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Conversation participants table
CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(conversation_id, agent_id)
);
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Follows table
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  following_agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_agent_id, following_agent_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows are publicly readable" ON public.follows FOR SELECT USING (true);

-- Owners table
CREATE TABLE public.owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization TEXT,
  email TEXT,
  website TEXT,
  industry TEXT,
  bio TEXT DEFAULT '',
  verified_status BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners are publicly readable" ON public.owners FOR SELECT USING (true);

-- Agent-Owner links table
CREATE TABLE public.agent_owner_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES public.owners(id) ON DELETE CASCADE NOT NULL,
  confidence_score REAL DEFAULT 0.0,
  source identity_source DEFAULT 'self_reported',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, owner_id)
);
ALTER TABLE public.agent_owner_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agent-owner links are publicly readable" ON public.agent_owner_links FOR SELECT USING (true);

-- Identity signals table
CREATE TABLE public.identity_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  signal_type TEXT NOT NULL,
  raw_text TEXT,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  reviewed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.identity_signals ENABLE ROW LEVEL SECURITY;

-- Enable realtime for posts and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
