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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ads: {
        Row: {
          code_html: string | null
          enabled: boolean
          id: string
          image_url: string | null
          link_url: string | null
          provider: string
          slot: string
          updated_at: string
        }
        Insert: {
          code_html?: string | null
          enabled?: boolean
          id?: string
          image_url?: string | null
          link_url?: string | null
          provider?: string
          slot: string
          updated_at?: string
        }
        Update: {
          code_html?: string | null
          enabled?: boolean
          id?: string
          image_url?: string | null
          link_url?: string | null
          provider?: string
          slot?: string
          updated_at?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          content_html_ar: string
          content_html_fr: string | null
          created_at: string
          id: string
          level: string | null
          section: string
          subject: string | null
          subtitle_ar: string | null
          subtitle_fr: string | null
          title_ar: string
          title_fr: string | null
          track: string | null
          updated_at: string
        }
        Insert: {
          content_html_ar: string
          content_html_fr?: string | null
          created_at?: string
          id?: string
          level?: string | null
          section: string
          subject?: string | null
          subtitle_ar?: string | null
          subtitle_fr?: string | null
          title_ar: string
          title_fr?: string | null
          track?: string | null
          updated_at?: string
        }
        Update: {
          content_html_ar?: string
          content_html_fr?: string | null
          created_at?: string
          id?: string
          level?: string | null
          section?: string
          subject?: string | null
          subtitle_ar?: string | null
          subtitle_fr?: string | null
          title_ar?: string
          title_fr?: string | null
          track?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          read: boolean
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          read?: boolean
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          read?: boolean
          subject?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          exam_slot: string | null
          id: string
          level: string
          mirror_urls: string[]
          section: string
          sort_order: number
          source_url: string
          subject: string
          subtitle_ar: string | null
          subtitle_fr: string | null
          term: string | null
          title_ar: string
          title_fr: string
          track: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          exam_slot?: string | null
          id?: string
          level: string
          mirror_urls?: string[]
          section: string
          sort_order?: number
          source_url: string
          subject: string
          subtitle_ar?: string | null
          subtitle_fr?: string | null
          term?: string | null
          title_ar: string
          title_fr: string
          track?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          exam_slot?: string | null
          id?: string
          level?: string
          mirror_urls?: string[]
          section?: string
          sort_order?: number
          source_url?: string
          subject?: string
          subtitle_ar?: string | null
          subtitle_fr?: string | null
          term?: string | null
          title_ar?: string
          title_fr?: string
          track?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      pages: {
        Row: {
          content_html_ar: string
          content_html_fr: string
          slug: string
          title_ar: string
          title_fr: string
          updated_at: string
        }
        Insert: {
          content_html_ar?: string
          content_html_fr?: string
          slug: string
          title_ar: string
          title_fr: string
          updated_at?: string
        }
        Update: {
          content_html_ar?: string
          content_html_fr?: string
          slug?: string
          title_ar?: string
          title_fr?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          choices: Json
          correct_index: number
          created_at: string
          explanation_ar: string | null
          id: string
          level: string
          question_ar: string
          sort_order: number
          subject: string
          updated_at: string
        }
        Insert: {
          choices?: Json
          correct_index?: number
          created_at?: string
          explanation_ar?: string | null
          id?: string
          level: string
          question_ar: string
          sort_order?: number
          subject: string
          updated_at?: string
        }
        Update: {
          choices?: Json
          correct_index?: number
          created_at?: string
          explanation_ar?: string | null
          id?: string
          level?: string
          question_ar?: string
          sort_order?: number
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value_json: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value_json?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value_json?: Json
        }
        Relationships: []
      }
      tutor_conversations: {
        Row: {
          created_at: string
          id: string
          level: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tutor_documents: {
        Row: {
          content: string
          created_at: string
          enabled: boolean
          file_name: string | null
          id: string
          level: string
          subject: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          enabled?: boolean
          file_name?: string | null
          id?: string
          level: string
          subject?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          enabled?: boolean
          file_name?: string | null
          id?: string
          level?: string
          subject?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tutor_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          image_count: number
          model: string | null
          role: string
          user_id: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          image_count?: number
          model?: string | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image_count?: number
          model?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "tutor_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_prompts: {
        Row: {
          level: string
          prompt: string
          subject: string
          updated_at: string
        }
        Insert: {
          level: string
          prompt?: string
          subject?: string
          updated_at?: string
        }
        Update: {
          level?: string
          prompt?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
