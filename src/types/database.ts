/**
 * Database Types for MemoryVerse
 * These types match the Supabase schema
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          // Gamification
          total_xp: number;
          level: number;
          current_streak: number;
          longest_streak: number;
          // Preferences
          preferred_translation: string;
          daily_goal: number;
          reminder_enabled: boolean;
          reminder_time: string | null;
          // Premium
          is_premium: boolean;
          premium_expires_at: string | null;
          subscription_tier: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          total_xp?: number;
          level?: number;
          current_streak?: number;
          longest_streak?: number;
          preferred_translation?: string;
          daily_goal?: number;
          reminder_enabled?: boolean;
          reminder_time?: string | null;
          is_premium?: boolean;
          premium_expires_at?: string | null;
          subscription_tier?: string | null;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
          total_xp?: number;
          level?: number;
          current_streak?: number;
          longest_streak?: number;
          preferred_translation?: string;
          daily_goal?: number;
          reminder_enabled?: boolean;
          reminder_time?: string | null;
          is_premium?: boolean;
          premium_expires_at?: string | null;
          subscription_tier?: string | null;
        };
      };
      verses: {
        Row: {
          id: string;
          book: string;
          chapter: number;
          verse_number: number;
          text: string;
          translation: string;
          category: string | null;
          difficulty: number;
          context: string | null;
          context_generated_by_ai: boolean;
          context_generated_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          book: string;
          chapter: number;
          verse_number: number;
          text: string;
          translation: string;
          category?: string | null;
          difficulty?: number;
          context?: string | null;
          context_generated_by_ai?: boolean;
          context_generated_at?: string | null;
          created_at?: string;
        };
        Update: {
          book?: string;
          chapter?: number;
          verse_number?: number;
          text?: string;
          translation?: string;
          category?: string | null;
          difficulty?: number;
          context?: string | null;
          context_generated_by_ai?: boolean;
          context_generated_at?: string | null;
        };
      };
      user_verse_progress: {
        Row: {
          id: string;
          user_id: string;
          verse_id: string;
          status: 'learning' | 'reviewing' | 'mastered';
          accuracy_score: number;
          attempts: number;
          last_practiced_at: string;
          next_review_at: string | null;
          mastered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          verse_id: string;
          status?: 'learning' | 'reviewing' | 'mastered';
          accuracy_score?: number;
          attempts?: number;
          last_practiced_at?: string;
          next_review_at?: string | null;
          mastered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'learning' | 'reviewing' | 'mastered';
          accuracy_score?: number;
          attempts?: number;
          last_practiced_at?: string;
          next_review_at?: string | null;
          mastered_at?: string | null;
          updated_at?: string;
        };
      };
      practice_sessions: {
        Row: {
          id: string;
          user_id: string;
          verse_id: string;
          session_type: 'read' | 'recall' | 'recite' | 'fill-in-blanks' | 'multiple-choice' | 'write-entire-verse';
          user_answer: string | null;
          is_correct: boolean;
          accuracy_percentage: number;
          time_spent_seconds: number;
          hints_used: number;
          xp_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          verse_id: string;
          session_type: 'read' | 'recall' | 'recite' | 'fill-in-blanks' | 'multiple-choice' | 'write-entire-verse';
          user_answer?: string | null;
          is_correct: boolean;
          accuracy_percentage: number;
          time_spent_seconds?: number;
          hints_used?: number;
          xp_earned?: number;
          created_at?: string;
        };
        Update: {
          user_answer?: string | null;
          is_correct?: boolean;
          accuracy_percentage?: number;
          time_spent_seconds?: number;
          hints_used?: number;
          xp_earned?: number;
        };
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          badge_type: string;
          badge_name: string;
          description: string;
          earned_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_type: string;
          badge_name: string;
          description: string;
          earned_at?: string;
          created_at?: string;
        };
        Update: {
          badge_type?: string;
          badge_name?: string;
          description?: string;
        };
      };
      daily_streaks: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          verses_practiced: number;
          xp_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          verses_practiced?: number;
          xp_earned?: number;
          created_at?: string;
        };
        Update: {
          verses_practiced?: number;
          xp_earned?: number;
        };
      };
      verse_notes: {
        Row: {
          id: string;
          user_id: string;
          verse_id: string;
          note_text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          verse_id: string;
          note_text: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          note_text?: string;
          updated_at?: string;
        };
      };
      // ============================================
      // PREMIUM FEATURES (v1.2)
      // ============================================
      verse_collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          icon: string;
          color: string;
          is_public: boolean;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          icon?: string;
          color?: string;
          is_public?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          icon?: string;
          color?: string;
          is_public?: boolean;
          is_featured?: boolean;
          updated_at?: string;
        };
      };
      verse_collection_items: {
        Row: {
          id: string;
          collection_id: string;
          verse_id: string;
          sort_order: number;
          notes: string | null;
          added_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          verse_id: string;
          sort_order?: number;
          notes?: string | null;
          added_at?: string;
        };
        Update: {
          sort_order?: number;
          notes?: string | null;
        };
      };
      verse_collection_shares: {
        Row: {
          id: string;
          collection_id: string;
          shared_by_user_id: string;
          shared_with_user_id: string | null;
          share_link_code: string | null;
          access_level: 'view' | 'edit';
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          collection_id: string;
          shared_by_user_id: string;
          shared_with_user_id?: string | null;
          share_link_code?: string | null;
          access_level?: 'view' | 'edit';
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          access_level?: 'view' | 'edit';
          expires_at?: string | null;
        };
      };
      prayer_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          updated_at?: string;
        };
      };
      prayer_messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          sentiment: 'positive' | 'neutral' | 'negative' | 'grateful' | 'hopeful' | 'worried' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          sentiment?: 'positive' | 'neutral' | 'negative' | 'grateful' | 'hopeful' | 'worried' | null;
          created_at?: string;
        };
        Update: {
          sentiment?: 'positive' | 'neutral' | 'negative' | 'grateful' | 'hopeful' | 'worried' | null;
        };
      };
      prayer_insights: {
        Row: {
          id: string;
          user_id: string;
          insight_type: 'weekly_summary' | 'monthly_summary' | 'theme' | 'growth_area' | 'answered_prayer';
          title: string;
          content: string;
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          insight_type: 'weekly_summary' | 'monthly_summary' | 'theme' | 'growth_area' | 'answered_prayer';
          title: string;
          content: string;
          metadata?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          metadata?: Record<string, any>;
        };
      };
      bible_translations: {
        Row: {
          id: string;
          code: string;
          name: string;
          full_name: string;
          language: string;
          year: number | null;
          publisher: string | null;
          description: string | null;
          is_premium: boolean;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          full_name: string;
          language?: string;
          year?: number | null;
          publisher?: string | null;
          description?: string | null;
          is_premium?: boolean;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          full_name?: string;
          language?: string;
          year?: number | null;
          publisher?: string | null;
          description?: string | null;
          is_premium?: boolean;
          is_active?: boolean;
          sort_order?: number;
        };
      };
      verses_translations: {
        Row: {
          id: string;
          verse_id: string;
          translation_id: string;
          text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          verse_id: string;
          translation_id: string;
          text: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          text?: string;
          updated_at?: string;
        };
      };
      analytics_snapshots: {
        Row: {
          id: string;
          user_id: string;
          snapshot_date: string;
          total_verses_memorized: number;
          verses_practiced_today: number;
          accuracy_rate: number;
          average_session_duration: number;
          total_practice_time: number;
          streak_count: number;
          xp_earned_today: number;
          level: number;
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          snapshot_date: string;
          total_verses_memorized?: number;
          verses_practiced_today?: number;
          accuracy_rate?: number;
          average_session_duration?: number;
          total_practice_time?: number;
          streak_count?: number;
          xp_earned_today?: number;
          level?: number;
          metadata?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          total_verses_memorized?: number;
          verses_practiced_today?: number;
          accuracy_rate?: number;
          average_session_duration?: number;
          total_practice_time?: number;
          streak_count?: number;
          xp_earned_today?: number;
          level?: number;
          metadata?: Record<string, any>;
        };
      };
      learning_velocity: {
        Row: {
          id: string;
          user_id: string;
          week_start_date: string;
          verses_learned: number;
          practice_sessions: number;
          average_accuracy: number;
          total_practice_time: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start_date: string;
          verses_learned?: number;
          practice_sessions?: number;
          average_accuracy?: number;
          total_practice_time?: number;
          created_at?: string;
        };
        Update: {
          verses_learned?: number;
          practice_sessions?: number;
          average_accuracy?: number;
          total_practice_time?: number;
        };
      };
      export_logs: {
        Row: {
          id: string;
          user_id: string;
          export_type: 'pdf' | 'csv' | 'json';
          export_scope: 'progress' | 'analytics' | 'notes' | 'full';
          file_size_kb: number | null;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          export_type: 'pdf' | 'csv' | 'json';
          export_scope: 'progress' | 'analytics' | 'notes' | 'full';
          file_size_kb?: number | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          file_size_kb?: number | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          completed_at?: string | null;
        };
      };
    };
    Views: {
      leaderboard: {
        Row: {
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          total_xp: number;
          level: number;
          current_streak: number;
          verses_mastered: number;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Verse = Database['public']['Tables']['verses']['Row'];
export type UserVerseProgress = Database['public']['Tables']['user_verse_progress']['Row'];
export type PracticeSession = Database['public']['Tables']['practice_sessions']['Row'];
export type Achievement = Database['public']['Tables']['achievements']['Row'];
export type DailyStreak = Database['public']['Tables']['daily_streaks']['Row'];
export type VerseNote = Database['public']['Tables']['verse_notes']['Row'];
export type LeaderboardEntry = Database['public']['Views']['leaderboard']['Row'];

// Premium feature types
export type VerseCollection = Database['public']['Tables']['verse_collections']['Row'];
export type VerseCollectionItem = Database['public']['Tables']['verse_collection_items']['Row'];
export type VerseCollectionShare = Database['public']['Tables']['verse_collection_shares']['Row'];
export type PrayerConversation = Database['public']['Tables']['prayer_conversations']['Row'];
export type PrayerMessage = Database['public']['Tables']['prayer_messages']['Row'];
export type PrayerInsight = Database['public']['Tables']['prayer_insights']['Row'];
export type BibleTranslation = Database['public']['Tables']['bible_translations']['Row'];
export type VerseTranslation = Database['public']['Tables']['verses_translations']['Row'];
export type AnalyticsSnapshot = Database['public']['Tables']['analytics_snapshots']['Row'];
export type LearningVelocity = Database['public']['Tables']['learning_velocity']['Row'];
export type ExportLog = Database['public']['Tables']['export_logs']['Row'];
