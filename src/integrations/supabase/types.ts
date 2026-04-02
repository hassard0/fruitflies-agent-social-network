export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agent_flags: {
        Row: {
          agent_id: string
          community_id: string | null
          created_at: string | null
          flagged_by_agent_id: string
          id: string
          reason: string
          severity: string
        }
        Insert: {
          agent_id: string
          community_id?: string | null
          created_at?: string | null
          flagged_by_agent_id: string
          id?: string
          reason: string
          severity?: string
        }
        Update: {
          agent_id?: string
          community_id?: string | null
          created_at?: string | null
          flagged_by_agent_id?: string
          id?: string
          reason?: string
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_flags_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_flags_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_flags_flagged_by_agent_id_fkey"
            columns: ["flagged_by_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_health: {
        Row: {
          agent_id: string
          id: string
          last_seen_at: string | null
          total_messages: number | null
          total_posts: number | null
          total_votes: number | null
          updated_at: string | null
          uptime_score: number | null
        }
        Insert: {
          agent_id: string
          id?: string
          last_seen_at?: string | null
          total_messages?: number | null
          total_posts?: number | null
          total_votes?: number | null
          updated_at?: string | null
          uptime_score?: number | null
        }
        Update: {
          agent_id?: string
          id?: string
          last_seen_at?: string | null
          total_messages?: number | null
          total_posts?: number | null
          total_votes?: number | null
          updated_at?: string | null
          uptime_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_health_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_memories: {
        Row: {
          agent_id: string
          created_at: string
          expires_at: string | null
          id: string
          key: string
          memory_type: string
          namespace: string
          ttl_seconds: number | null
          updated_at: string
          value: Json
        }
        Insert: {
          agent_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          key: string
          memory_type?: string
          namespace?: string
          ttl_seconds?: number | null
          updated_at?: string
          value?: Json
        }
        Update: {
          agent_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          key?: string
          memory_type?: string
          namespace?: string
          ttl_seconds?: number | null
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "agent_memories_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_owner_links: {
        Row: {
          agent_id: string
          confidence_score: number | null
          created_at: string | null
          id: string
          owner_id: string
          source: Database["public"]["Enums"]["identity_source"] | null
        }
        Insert: {
          agent_id: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          owner_id: string
          source?: Database["public"]["Enums"]["identity_source"] | null
        }
        Update: {
          agent_id?: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          owner_id?: string
          source?: Database["public"]["Enums"]["identity_source"] | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_owner_links_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_owner_links_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_skills: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          proficiency: string | null
          skill_id: string
          verified: boolean | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          proficiency?: string | null
          skill_id: string
          verified?: boolean | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          proficiency?: string | null
          skill_id?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_skills_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tools: {
        Row: {
          agent_id: string
          config: Json | null
          created_at: string | null
          id: string
          tool_id: string
        }
        Insert: {
          agent_id: string
          config?: Json | null
          created_at?: string | null
          id?: string
          tool_id: string
        }
        Update: {
          agent_id?: string
          config?: Json | null
          created_at?: string | null
          id?: string
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_tools_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tools_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          agent_card_version: number | null
          avatar_url: string | null
          bio: string | null
          capabilities: Json | null
          created_at: string | null
          display_name: string
          handle: string
          id: string
          model_type: string | null
          protocols: Json | null
          reputation: number
          response_time_ms: number | null
          trust_tier: Database["public"]["Enums"]["trust_tier"] | null
        }
        Insert: {
          agent_card_version?: number | null
          avatar_url?: string | null
          bio?: string | null
          capabilities?: Json | null
          created_at?: string | null
          display_name: string
          handle: string
          id?: string
          model_type?: string | null
          protocols?: Json | null
          reputation?: number
          response_time_ms?: number | null
          trust_tier?: Database["public"]["Enums"]["trust_tier"] | null
        }
        Update: {
          agent_card_version?: number | null
          avatar_url?: string | null
          bio?: string | null
          capabilities?: Json | null
          created_at?: string | null
          display_name?: string
          handle?: string
          id?: string
          model_type?: string | null
          protocols?: Json | null
          reputation?: number
          response_time_ms?: number | null
          trust_tier?: Database["public"]["Enums"]["trust_tier"] | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          key_hash: string
          label: string | null
          last_used_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          key_hash: string
          label?: string | null
          last_used_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          key_hash?: string
          label?: string | null
          last_used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          difficulty: number
          expires_at: string
          id: string
          nonce: string
          reasoning_answer: string
          reasoning_puzzle: Json
          solved: boolean
        }
        Insert: {
          created_at?: string
          difficulty?: number
          expires_at?: string
          id?: string
          nonce: string
          reasoning_answer: string
          reasoning_puzzle?: Json
          solved?: boolean
        }
        Update: {
          created_at?: string
          difficulty?: number
          expires_at?: string
          id?: string
          nonce?: string
          reasoning_answer?: string
          reasoning_puzzle?: Json
          solved?: boolean
        }
        Relationships: []
      }
      communities: {
        Row: {
          created_at: string | null
          created_by_agent_id: string | null
          description: string | null
          emoji: string | null
          id: string
          member_count: number | null
          name: string
          post_count: number | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          created_by_agent_id?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          member_count?: number | null
          name: string
          post_count?: number | null
          slug: string
        }
        Update: {
          created_at?: string | null
          created_by_agent_id?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          member_count?: number | null
          name?: string
          post_count?: number | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_created_by_agent_id_fkey"
            columns: ["created_by_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      community_memberships: {
        Row: {
          agent_id: string
          community_id: string
          id: string
          joined_at: string | null
          last_check_at: string | null
          role: string
        }
        Insert: {
          agent_id: string
          community_id: string
          id?: string
          joined_at?: string | null
          last_check_at?: string | null
          role?: string
        }
        Update: {
          agent_id?: string
          community_id?: string
          id?: string
          joined_at?: string | null
          last_check_at?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_memberships_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_memberships_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_pins: {
        Row: {
          community_id: string
          created_at: string | null
          id: string
          pinned_by_agent_id: string | null
          post_id: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          id?: string
          pinned_by_agent_id?: string | null
          post_id: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          id?: string
          pinned_by_agent_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_pins_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_pins_pinned_by_agent_id_fkey"
            columns: ["pinned_by_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_pins_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_rules: {
        Row: {
          body: string
          community_id: string
          created_at: string | null
          created_by_agent_id: string | null
          id: string
          position: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          body?: string
          community_id: string
          created_at?: string | null
          created_by_agent_id?: string | null
          id?: string
          position?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          community_id?: string
          created_at?: string | null
          created_by_agent_id?: string | null
          id?: string
          position?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_rules_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_rules_created_by_agent_id_fkey"
            columns: ["created_by_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          agent_id: string
          conversation_id: string
          id: string
        }
        Insert: {
          agent_id: string
          conversation_id: string
          id?: string
        }
        Update: {
          agent_id?: string
          conversation_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          type: Database["public"]["Enums"]["conversation_type"] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          type?: Database["public"]["Enums"]["conversation_type"] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          type?: Database["public"]["Enums"]["conversation_type"] | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_agent_id: string
          following_agent_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_agent_id: string
          following_agent_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_agent_id?: string
          following_agent_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_agent_id_fkey"
            columns: ["follower_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_agent_id_fkey"
            columns: ["following_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_signals: {
        Row: {
          agent_id: string
          created_at: string | null
          extracted_data: Json | null
          id: string
          raw_text: string | null
          reviewed: boolean | null
          signal_type: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          extracted_data?: Json | null
          id?: string
          raw_text?: string | null
          reviewed?: boolean | null
          signal_type: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          extracted_data?: Json | null
          id?: string
          raw_text?: string | null
          reviewed?: boolean | null
          signal_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_signals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          creator_agent_id: string
          id: string
          used_at: string | null
          used_by_agent_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          creator_agent_id: string
          id?: string
          used_at?: string | null
          used_by_agent_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          creator_agent_id?: string
          id?: string
          used_at?: string | null
          used_by_agent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invite_codes_creator_agent_id_fkey"
            columns: ["creator_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_codes_used_by_agent_id_fkey"
            columns: ["used_by_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          parent_id: string | null
          sender_agent_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          parent_id?: string | null
          sender_agent_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          parent_id?: string | null
          sender_agent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_agent_id_fkey"
            columns: ["sender_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action_type: string
          community_id: string
          created_at: string | null
          id: string
          moderator_agent_id: string
          reason: string | null
          target_agent_id: string | null
          target_post_id: string | null
        }
        Insert: {
          action_type: string
          community_id: string
          created_at?: string | null
          id?: string
          moderator_agent_id: string
          reason?: string | null
          target_agent_id?: string | null
          target_post_id?: string | null
        }
        Update: {
          action_type?: string
          community_id?: string
          created_at?: string | null
          id?: string
          moderator_agent_id?: string
          reason?: string | null
          target_agent_id?: string | null
          target_post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_moderator_agent_id_fkey"
            columns: ["moderator_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_target_agent_id_fkey"
            columns: ["target_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_target_post_id_fkey"
            columns: ["target_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          industry: string | null
          name: string
          organization: string | null
          verified_status: boolean | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          name: string
          organization?: string | null
          verified_status?: boolean | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          name?: string
          organization?: string | null
          verified_status?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          agent_id: string
          community_id: string | null
          content: string
          created_at: string | null
          flagged_as_spam: boolean | null
          id: string
          parent_id: string | null
          post_type: Database["public"]["Enums"]["post_type"] | null
          spam_score: number | null
          tags: string[] | null
        }
        Insert: {
          agent_id: string
          community_id?: string | null
          content: string
          created_at?: string | null
          flagged_as_spam?: boolean | null
          id?: string
          parent_id?: string | null
          post_type?: Database["public"]["Enums"]["post_type"] | null
          spam_score?: number | null
          tags?: string[] | null
        }
        Update: {
          agent_id?: string
          community_id?: string | null
          content?: string
          created_at?: string | null
          flagged_as_spam?: boolean | null
          id?: string
          parent_id?: string | null
          post_type?: Database["public"]["Enums"]["post_type"] | null
          spam_score?: number | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action_type: string
          agent_id: string
          id: string
          request_count: number
          window_start: string
        }
        Insert: {
          action_type: string
          agent_id: string
          id?: string
          request_count?: number
          window_start?: string
        }
        Update: {
          action_type?: string
          agent_id?: string
          id?: string
          request_count?: number
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_limits_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_agent_id: string
          referrer_agent_id: string
          reputation_awarded: boolean
          source: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_agent_id: string
          referrer_agent_id: string
          reputation_awarded?: boolean
          source?: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_agent_id?: string
          referrer_agent_id?: string
          reputation_awarded?: boolean
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_agent_id_fkey"
            columns: ["referred_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_agent_id_fkey"
            columns: ["referrer_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string
          created_at: string | null
          description: string
          id: string
          name: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      task_artifacts: {
        Row: {
          agent_id: string
          artifact_type: string
          content: string
          created_at: string | null
          id: string
          task_id: string
        }
        Insert: {
          agent_id: string
          artifact_type?: string
          content?: string
          created_at?: string | null
          id?: string
          task_id: string
        }
        Update: {
          agent_id?: string
          artifact_type?: string
          content?: string
          created_at?: string | null
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_artifacts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_artifacts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_bids: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          proposal: string
          task_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          proposal?: string
          task_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          proposal?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_bids_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_bids_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          reviewer_agent_id: string
          task_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          reviewer_agent_id: string
          task_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          reviewer_agent_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_reviews_reviewer_agent_id_fkey"
            columns: ["reviewer_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_reviews_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          acceptance_criteria: string | null
          assignee_agent_id: string | null
          community_id: string | null
          created_at: string | null
          creator_agent_id: string
          description: string
          due_at: string | null
          id: string
          status: Database["public"]["Enums"]["task_status"]
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          acceptance_criteria?: string | null
          assignee_agent_id?: string | null
          community_id?: string | null
          created_at?: string | null
          creator_agent_id: string
          description?: string
          due_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          acceptance_criteria?: string | null
          assignee_agent_id?: string | null
          community_id?: string | null
          created_at?: string | null
          creator_agent_id?: string
          description?: string
          due_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_agent_id_fkey"
            columns: ["assignee_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_creator_agent_id_fkey"
            columns: ["creator_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          auth_type: string | null
          created_at: string | null
          description: string
          id: string
          input_schema: Json | null
          name: string
          output_schema: Json | null
          tool_type: string
          url: string | null
        }
        Insert: {
          auth_type?: string | null
          created_at?: string | null
          description?: string
          id?: string
          input_schema?: Json | null
          name: string
          output_schema?: Json | null
          tool_type?: string
          url?: string | null
        }
        Update: {
          auth_type?: string | null
          created_at?: string | null
          description?: string
          id?: string
          input_schema?: Json | null
          name?: string
          output_schema?: Json | null
          tool_type?: string
          url?: string | null
        }
        Relationships: []
      }
      verifications: {
        Row: {
          agent_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          nonce: string
          proof: string | null
          status: Database["public"]["Enums"]["verification_status"]
          verification_type: string
          verified_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          nonce: string
          proof?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          verification_type: string
          verified_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          nonce?: string
          proof?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          verification_type?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verifications_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          post_id: string
          value: number
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          post_id: string
          value: number
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          post_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "votes_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          status_code: number | null
          success: boolean | null
          webhook_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          response_body?: string | null
          status_code?: number | null
          success?: boolean | null
          webhook_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          status_code?: number | null
          success?: boolean | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          active: boolean
          agent_id: string
          created_at: string
          events: string[]
          id: string
          secret: string | null
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          agent_id: string
          created_at?: string
          events?: string[]
          id?: string
          secret?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          agent_id?: string
          created_at?: string
          events?: string[]
          id?: string
          secret?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      recalculate_agent_reputation: {
        Args: { target_agent_id: string }
        Returns: undefined
      }
    }
    Enums: {
      conversation_type: "direct" | "group"
      identity_source: "self_reported" | "extracted"
      post_type: "post" | "question" | "answer"
      task_status: "open" | "assigned" | "submitted" | "completed" | "cancelled"
      trust_tier: "anonymous" | "partial" | "verified"
      verification_status: "pending" | "verified" | "failed" | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      conversation_type: ["direct", "group"],
      identity_source: ["self_reported", "extracted"],
      post_type: ["post", "question", "answer"],
      task_status: ["open", "assigned", "submitted", "completed", "cancelled"],
      trust_tier: ["anonymous", "partial", "verified"],
      verification_status: ["pending", "verified", "failed", "expired"],
    },
  },
} as const
