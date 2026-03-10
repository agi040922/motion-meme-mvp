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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_usage_logs: {
        Row: {
          api_endpoint: string | null
          brand_id: string | null
          content_id: string | null
          created_at: string | null
          credits_used: number
          estimated_cost_usd: number | null
          id: string
          input_tokens: number | null
          model_id: string
          model_tier: string
          output_tokens: number | null
          total_tokens: number | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          api_endpoint?: string | null
          brand_id?: string | null
          content_id?: string | null
          created_at?: string | null
          credits_used: number
          estimated_cost_usd?: number | null
          id?: string
          input_tokens?: number | null
          model_id: string
          model_tier: string
          output_tokens?: number | null
          total_tokens?: number | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          api_endpoint?: string | null
          brand_id?: string | null
          content_id?: string | null
          created_at?: string | null
          credits_used?: number
          estimated_cost_usd?: number | null
          id?: string
          input_tokens?: number | null
          model_id?: string
          model_tier?: string
          output_tokens?: number | null
          total_tokens?: number | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "credit_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string | null
          id: string
          note: string | null
          user_id: string
          viral_post_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          note?: string | null
          user_id: string
          viral_post_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          note?: string | null
          user_id?: string
          viral_post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_viral_post_id_fkey"
            columns: ["viral_post_id"]
            isOneToOne: false
            referencedRelation: "viral_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_repositories: {
        Row: {
          brand_id: string
          connected_at: string | null
          description: string | null
          features: string[] | null
          forks: number | null
          id: string
          is_primary: boolean | null
          language: string | null
          last_synced_at: string | null
          platform: string
          readme_content: string | null
          readme_summary: string | null
          repo_name: string
          repo_owner: string
          repo_url: string
          stars: number | null
          tech_stack: string[] | null
          topics: string[] | null
          updated_at: string | null
        }
        Insert: {
          brand_id: string
          connected_at?: string | null
          description?: string | null
          features?: string[] | null
          forks?: number | null
          id?: string
          is_primary?: boolean | null
          language?: string | null
          last_synced_at?: string | null
          platform?: string
          readme_content?: string | null
          readme_summary?: string | null
          repo_name: string
          repo_owner: string
          repo_url: string
          stars?: number | null
          tech_stack?: string[] | null
          topics?: string[] | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string
          connected_at?: string | null
          description?: string | null
          features?: string[] | null
          forks?: number | null
          id?: string
          is_primary?: boolean | null
          language?: string | null
          last_synced_at?: string | null
          platform?: string
          readme_content?: string | null
          readme_summary?: string | null
          repo_name?: string
          repo_owner?: string
          repo_url?: string
          stars?: number | null
          tech_stack?: string[] | null
          topics?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_repositories_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          analyzed_at: string | null
          created_at: string | null
          id: string
          key_messages: string[] | null
          keywords: string[] | null
          logo_url: string | null
          name: string
          target_audience: string | null
          tone: Json | null
          updated_at: string | null
          user_id: string
          value_proposition: string | null
          website_url: string | null
        }
        Insert: {
          analyzed_at?: string | null
          created_at?: string | null
          id?: string
          key_messages?: string[] | null
          keywords?: string[] | null
          logo_url?: string | null
          name: string
          target_audience?: string | null
          tone?: Json | null
          updated_at?: string | null
          user_id: string
          value_proposition?: string | null
          website_url?: string | null
        }
        Update: {
          analyzed_at?: string | null
          created_at?: string | null
          id?: string
          key_messages?: string[] | null
          keywords?: string[] | null
          logo_url?: string | null
          name?: string
          target_audience?: string | null
          tone?: Json | null
          updated_at?: string | null
          user_id?: string
          value_proposition?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      channel_recommendations: {
        Row: {
          brand_id: string
          created_at: string | null
          id: string
          platform: string
          reasoning: string | null
          score: number | null
          suggested_communities: string[] | null
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          id?: string
          platform: string
          reasoning?: string | null
          score?: number | null
          suggested_communities?: string[] | null
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          id?: string
          platform?: string
          reasoning?: string | null
          score?: number | null
          suggested_communities?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_recommendations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_accounts: {
        Row: {
          access_token: string | null
          brand_id: string | null
          connected_at: string | null
          id: string
          is_active: boolean | null
          platform: string
          platform_user_id: string | null
          platform_username: string | null
          refresh_token: string | null
          scopes: string[] | null
          token_expires_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          brand_id?: string | null
          connected_at?: string | null
          id?: string
          is_active?: boolean | null
          platform: string
          platform_user_id?: string | null
          platform_username?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          brand_id?: string | null
          connected_at?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          platform_user_id?: string | null
          platform_username?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connected_accounts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      content_insights: {
        Row: {
          brand_id: string
          created_at: string | null
          id: string
          insight_data: Json
          insight_type: string
          valid_until: string
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          id?: string
          insight_data: Json
          insight_type: string
          valid_until: string
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          id?: string
          insight_data?: Json
          insight_type?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_insights_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      contents: {
        Row: {
          body: string
          brand_id: string
          content_type: string | null
          created_at: string | null
          draft_id: string | null
          external_post_url: string | null
          id: string
          last_metrics_fetch: string | null
          media_urls: string[] | null
          model_used: string | null
          platform: string
          platform_post_id: string | null
          platform_post_url: string | null
          posted_at: string | null
          prompt_used: string | null
          reference_content_id: string | null
          scheduled_at: string | null
          source_data: Json | null
          source_type: string | null
          source_viral_post_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          writing_techniques: Json | null
        }
        Insert: {
          body: string
          brand_id: string
          content_type?: string | null
          created_at?: string | null
          draft_id?: string | null
          external_post_url?: string | null
          id?: string
          last_metrics_fetch?: string | null
          media_urls?: string[] | null
          model_used?: string | null
          platform: string
          platform_post_id?: string | null
          platform_post_url?: string | null
          posted_at?: string | null
          prompt_used?: string | null
          reference_content_id?: string | null
          scheduled_at?: string | null
          source_data?: Json | null
          source_type?: string | null
          source_viral_post_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          writing_techniques?: Json | null
        }
        Update: {
          body?: string
          brand_id?: string
          content_type?: string | null
          created_at?: string | null
          draft_id?: string | null
          external_post_url?: string | null
          id?: string
          last_metrics_fetch?: string | null
          media_urls?: string[] | null
          model_used?: string | null
          platform?: string
          platform_post_id?: string | null
          platform_post_url?: string | null
          posted_at?: string | null
          prompt_used?: string | null
          reference_content_id?: string | null
          scheduled_at?: string | null
          source_data?: Json | null
          source_type?: string | null
          source_viral_post_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          writing_techniques?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contents_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_reference_content_id_fkey"
            columns: ["reference_content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_source_viral_post_id_fkey"
            columns: ["source_viral_post_id"]
            isOneToOne: false
            referencedRelation: "viral_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      drafts: {
        Row: {
          body: string
          brand_id: string
          created_at: string | null
          id: string
          is_converted: boolean | null
          notes: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          body: string
          brand_id: string
          created_at?: string | null
          id?: string
          is_converted?: boolean | null
          notes?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          body?: string
          brand_id?: string
          created_at?: string | null
          id?: string
          is_converted?: boolean | null
          notes?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drafts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string | null
          display_name: string
          features: Json | null
          id: string
          is_active: boolean | null
          max_brands: number | null
          monthly_credits: number
          monthly_price: number
          name: string
        }
        Insert: {
          created_at?: string | null
          display_name: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_brands?: number | null
          monthly_credits?: number
          monthly_price?: number
          name: string
        }
        Update: {
          created_at?: string | null
          display_name?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_brands?: number | null
          monthly_credits?: number
          monthly_price?: number
          name?: string
        }
        Relationships: []
      }
      post_metrics: {
        Row: {
          comments: number | null
          content_id: string
          fetched_at: string | null
          id: string
          likes: number | null
          shares: number | null
          views: number | null
        }
        Insert: {
          comments?: number | null
          content_id: string
          fetched_at?: string | null
          id?: string
          likes?: number | null
          shares?: number | null
          views?: number | null
        }
        Update: {
          comments?: number | null
          content_id?: string
          fetched_at?: string | null
          id?: string
          likes?: number | null
          shares?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_metrics_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      post_metrics_history: {
        Row: {
          clicks: number | null
          comments: number | null
          content_id: string
          fetched_at: string | null
          id: string
          likes: number | null
          quotes: number | null
          replies: number | null
          reposts: number | null
          reviews_count: number | null
          reviews_rating: number | null
          score: number | null
          shares: number | null
          upvote_ratio: number | null
          views: number | null
        }
        Insert: {
          clicks?: number | null
          comments?: number | null
          content_id: string
          fetched_at?: string | null
          id?: string
          likes?: number | null
          quotes?: number | null
          replies?: number | null
          reposts?: number | null
          reviews_count?: number | null
          reviews_rating?: number | null
          score?: number | null
          shares?: number | null
          upvote_ratio?: number | null
          views?: number | null
        }
        Update: {
          clicks?: number | null
          comments?: number | null
          content_id?: string
          fetched_at?: string | null
          id?: string
          likes?: number | null
          quotes?: number | null
          replies?: number | null
          reposts?: number | null
          reviews_count?: number | null
          reviews_rating?: number | null
          score?: number | null
          shares?: number | null
          upvote_ratio?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_metrics_history_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          bonus_credits: number | null
          created_at: string | null
          id: string
          plan_id: string | null
          purchased_credits: number | null
          subscription_credits: number | null
          subscription_ends_at: string | null
          subscription_started_at: string | null
          subscription_status: string | null
          total_credits_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bonus_credits?: number | null
          created_at?: string | null
          id?: string
          plan_id?: string | null
          purchased_credits?: number | null
          subscription_credits?: number | null
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          total_credits_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bonus_credits?: number | null
          created_at?: string | null
          id?: string
          plan_id?: string | null
          purchased_credits?: number | null
          subscription_credits?: number | null
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          total_credits_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credits_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          auto_post_enabled: boolean | null
          created_at: string | null
          has_completed_onboarding: boolean | null
          id: string
          notification_email: boolean | null
          onboarding_completed_at: string | null
          onboarding_skipped: boolean | null
          preferred_model: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_post_enabled?: boolean | null
          created_at?: string | null
          has_completed_onboarding?: boolean | null
          id?: string
          notification_email?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_skipped?: boolean | null
          preferred_model?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_post_enabled?: boolean | null
          created_at?: string | null
          has_completed_onboarding?: boolean | null
          id?: string
          notification_email?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_skipped?: boolean | null
          preferred_model?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      viral_posts: {
        Row: {
          author_avatar_url: string | null
          author_handle: string | null
          author_name: string | null
          body: string
          category: string | null
          comments: number | null
          comments_data: Json | null
          created_at: string | null
          fetched_at: string | null
          id: string
          is_active: boolean | null
          likes: number | null
          media_urls: string[] | null
          original_url: string | null
          platform: string
          posted_at: string | null
          shares: number | null
          source: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author_avatar_url?: string | null
          author_handle?: string | null
          author_name?: string | null
          body: string
          category?: string | null
          comments?: number | null
          comments_data?: Json | null
          created_at?: string | null
          fetched_at?: string | null
          id?: string
          is_active?: boolean | null
          likes?: number | null
          media_urls?: string[] | null
          original_url?: string | null
          platform: string
          posted_at?: string | null
          shares?: number | null
          source?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author_avatar_url?: string | null
          author_handle?: string | null
          author_name?: string | null
          body?: string
          category?: string | null
          comments?: number | null
          comments_data?: Json | null
          created_at?: string | null
          fetched_at?: string | null
          id?: string
          is_active?: boolean | null
          likes?: number | null
          media_urls?: string[] | null
          original_url?: string | null
          platform?: string
          posted_at?: string | null
          shares?: number | null
          source?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_brand_performance_summary: {
        Args: { p_brand_id: string; p_days?: number }
        Returns: {
          avg_engagement_rate: number
          total_comments: number
          total_likes: number
          total_posts: number
          total_views: number
        }[]
      }
      get_drafts_with_stats: {
        Args: { p_brand_id: string }
        Returns: {
          body: string
          conversion_count: number
          created_at: string
          id: string
          is_converted: boolean
          notes: string
          title: string
          updated_at: string
        }[]
      }
      get_latest_metrics: {
        Args: { p_content_id: string }
        Returns: {
          clicks: number
          comments: number
          fetched_at: string
          likes: number
          shares: number
          views: number
        }[]
      }
      get_top_performers: {
        Args: { p_brand_id: string; p_days?: number; p_limit?: number }
        Returns: {
          body: string
          comments: number
          content_id: string
          engagement_score: number
          likes: number
          platform: string
          title: string
          views: number
        }[]
      }
      get_total_credits: { Args: { p_user_id: string }; Returns: number }
      parse_github_url: {
        Args: { url: string }
        Returns: {
          owner: string
          repo: string
        }[]
      }
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

