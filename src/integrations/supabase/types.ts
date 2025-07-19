export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      active_debates: {
        Row: {
          created_at: string
          debate_data: Json | null
          id: string
          participant_1_id: string
          participant_2_id: string
          started_at: string
          status: string
          topic: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          debate_data?: Json | null
          id?: string
          participant_1_id: string
          participant_2_id: string
          started_at?: string
          status?: string
          topic: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          debate_data?: Json | null
          id?: string
          participant_1_id?: string
          participant_2_id?: string
          started_at?: string
          status?: string
          topic?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      debate_analysis: {
        Row: {
          analysis_type: string
          content: string
          created_at: string
          debate_id: string
          id: string
          metrics: Json | null
          suggestions: string[] | null
          user_id: string
        }
        Insert: {
          analysis_type: string
          content: string
          created_at?: string
          debate_id: string
          id?: string
          metrics?: Json | null
          suggestions?: string[] | null
          user_id: string
        }
        Update: {
          analysis_type?: string
          content?: string
          created_at?: string
          debate_id?: string
          id?: string
          metrics?: Json | null
          suggestions?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      debate_requests: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          message: string | null
          receiver_id: string
          sender_id: string
          status: string
          topic: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          receiver_id: string
          sender_id: string
          status?: string
          topic: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          receiver_id?: string
          sender_id?: string
          status?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      debate_results: {
        Row: {
          comparison: Json
          created_at: string
          debate_date: string
          duration: number
          id: string
          improvements: string[]
          is_shared: boolean
          metrics: Json
          score: number
          topic: string | null
          user_id: string
        }
        Insert: {
          comparison: Json
          created_at?: string
          debate_date?: string
          duration: number
          id?: string
          improvements: string[]
          is_shared?: boolean
          metrics: Json
          score: number
          topic?: string | null
          user_id: string
        }
        Update: {
          comparison?: Json
          created_at?: string
          debate_date?: string
          duration?: number
          id?: string
          improvements?: string[]
          is_shared?: boolean
          metrics?: Json
          score?: number
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      leaderboard_entries: {
        Row: {
          created_at: string
          id: string
          is_online: boolean | null
          last_debate_date: string | null
          last_match_score: number | null
          rank: number | null
          total_debates: number
          total_score: number
          trend: string | null
          updated_at: string
          user_id: string
          username: string
          win_rate: number
          wins: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_online?: boolean | null
          last_debate_date?: string | null
          last_match_score?: number | null
          rank?: number | null
          total_debates?: number
          total_score?: number
          trend?: string | null
          updated_at?: string
          user_id: string
          username: string
          win_rate?: number
          wins?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_online?: boolean | null
          last_debate_date?: string | null
          last_match_score?: number | null
          rank?: number | null
          total_debates?: number
          total_score?: number
          trend?: string | null
          updated_at?: string
          user_id?: string
          username?: string
          win_rate?: number
          wins?: number
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          debate_id: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          debate_id?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          debate_id?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      transcriptions: {
        Row: {
          confidence: number | null
          content: string
          created_at: string
          debate_id: string
          id: string
          speaker_type: string
          timestamp_end: number | null
          timestamp_start: number
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          content: string
          created_at?: string
          debate_id: string
          id?: string
          speaker_type: string
          timestamp_end?: number | null
          timestamp_start: number
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          content?: string
          created_at?: string
          debate_id?: string
          id?: string
          speaker_type?: string
          timestamp_end?: number | null
          timestamp_start?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          is_online: boolean
          last_seen: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          is_online?: boolean
          last_seen?: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          is_online?: boolean
          last_seen?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
