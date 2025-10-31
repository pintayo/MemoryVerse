import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';

/**
 * Profile Service
 * Handles user profile operations
 */
export const profileService = {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const result = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!result) {
        console.warn('[profileService] getProfile returned undefined for user:', userId);
        return null;
      }

      const { data, error } = result;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[profileService] Error getting profile:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Profile>) {
    const result = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (!result) {
      console.warn('[profileService] updateProfile returned undefined for user:', userId);
      return null;
    }

    const { data, error } = result;
    if (error) throw error;
    return data;
  },

  /**
   * Add XP to user profile
   */
  async addXP(userId: string, xp: number) {
    // Get current profile
    const profile = await this.getProfile(userId);
    if (!profile) throw new Error('Profile not found');

    const newTotalXP = profile.total_xp + xp;
    const newLevel = this.calculateLevel(newTotalXP);

    return this.updateProfile(userId, {
      total_xp: newTotalXP,
      level: newLevel,
    });
  },

  /**
   * Update streak
   */
  async updateStreak(userId: string, streakCount: number) {
    const profile = await this.getProfile(userId);
    if (!profile) throw new Error('Profile not found');

    const updates: Partial<Profile> = {
      current_streak: streakCount,
    };

    // Update longest streak if current is higher
    if (streakCount > profile.longest_streak) {
      updates.longest_streak = streakCount;
    }

    return this.updateProfile(userId, updates);
  },

  /**
   * Calculate user level based on XP
   * Level formula: Level = floor(sqrt(XP / 100)) + 1
   */
  calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  },

  /**
   * Calculate XP needed for next level
   */
  calculateXPForNextLevel(currentLevel: number): number {
    const nextLevel = currentLevel + 1;
    return (nextLevel - 1) * (nextLevel - 1) * 100;
  },

  /**
   * Get leaderboard (top users)
   */
  async getLeaderboard(limit: number = 10, timeframe: 'week' | 'allTime' = 'allTime') {
    let query = supabase
      .from('leaderboard')
      .select('*')
      .order('total_xp', { ascending: false })
      .limit(limit);

    const result = await query;

    if (!result) {
      console.warn('[profileService] getLeaderboard returned undefined');
      return [];
    }

    const { data, error } = result;
    if (error) throw error;
    return data;
  },

  /**
   * Get user rank on leaderboard
   */
  async getUserRank(userId: string): Promise<number> {
    const result = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', userId)
      .single();

    if (!result) {
      console.warn('[profileService] getUserRank returned undefined for user:', userId);
      return 0;
    }

    const { data, error } = result;
    if (error) throw error;

    const userXP = data?.total_xp || 0;

    // Count how many users have more XP
    const countResult = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gt('total_xp', userXP);

    if (!countResult) {
      console.warn('[profileService] getUserRank count query returned undefined');
      return 1;
    }

    const { count, error: countError } = countResult;
    if (countError) throw countError;

    return (count || 0) + 1;
  },
};
