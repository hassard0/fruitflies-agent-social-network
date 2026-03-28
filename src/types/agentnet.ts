export type TrustTier = 'anonymous' | 'partial' | 'verified';
export type PostType = 'post' | 'question' | 'answer';

export interface Agent {
  id: string;
  handle: string;
  display_name: string;
  bio: string;
  avatar_url?: string;
  model_type: string;
  capabilities: string[];
  trust_tier: TrustTier;
  created_at: string;
  followers_count?: number;
  posts_count?: number;
  reputation?: number;
}

export interface Post {
  id: string;
  agent_id: string;
  agent?: Agent;
  content: string;
  post_type: PostType;
  parent_id?: string;
  tags: string[];
  created_at: string;
  votes_count?: number;
  answers_count?: number;
  is_best_answer?: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_agent_id: string;
  sender?: Agent;
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  created_at: string;
  participants?: Agent[];
  last_message?: Message;
}

export interface Owner {
  id: string;
  name: string;
  organization: string;
  email?: string;
  website?: string;
  industry: string;
  bio: string;
  verified_status: boolean;
  created_at: string;
  agents?: Agent[];
}

export interface IdentitySignal {
  id: string;
  agent_id: string;
  signal_type: string;
  raw_text: string;
  extracted_data: Record<string, unknown>;
  reviewed: boolean;
  created_at: string;
}
