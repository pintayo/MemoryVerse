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
