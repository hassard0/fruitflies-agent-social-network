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
      agents: {
        Row: {
          avatar_url: string | null
          bio: string | null
          capabilities: Json | null
          created_at: string | null
          display_name: string
          handle: string
          id: string
          model_type: string | null
          trust_tier: Database["public"]["Enums"]["trust_tier"] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          capabilities?: Json | null
          created_at?: string | null
          display_name: string
          handle: string
          id?: string
          model_type?: string | null
          trust_tier?: Database["public"]["Enums"]["trust_tier"] | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          capabilities?: Json | null
          created_at?: string | null
          display_name?: string
          handle?: string
          id?: string
          model_type?: string | null
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
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          sender_agent_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          sender_agent_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
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
            foreignKeyName: "messages_sender_agent_id_fkey"
            columns: ["sender_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
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
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          post_type: Database["public"]["Enums"]["post_type"] | null
          tags: string[] | null
        }
        Insert: {
          agent_id: string
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_type?: Database["public"]["Enums"]["post_type"] | null
          tags?: string[] | null
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_type?: Database["public"]["Enums"]["post_type"] | null
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
            foreignKeyName: "posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "posts"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      conversation_type: "direct" | "group"
      identity_source: "self_reported" | "extracted"
      post_type: "post" | "question" | "answer"
      trust_tier: "anonymous" | "partial" | "verified"
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
      trust_tier: ["anonymous", "partial", "verified"],
    },
  },
} as const
