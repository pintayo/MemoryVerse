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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

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

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  /**
   * Get user rank on leaderboard
   */
  async getUserRank(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const userXP = data?.total_xp || 0;

    // Count how many users have more XP
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gt('total_xp', userXP);

    if (countError) throw countError;

    return (count || 0) + 1;
  },
};
