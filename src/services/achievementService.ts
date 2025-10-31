logger.log('[achievementService] Module loading...');

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
logger.log('[achievementService] supabase imported');

import { Achievement, DailyStreak } from '../types/database';
logger.log('[achievementService] types imported');

import { profileService } from './profileService';
logger.log('[achievementService] profileService imported');

logger.log('[achievementService] About to define achievementService object...');

/**
 * Achievement & Streak Service
 * Handles badges, achievements, and daily streaks
 */
export const achievementService = {
  /**
   * Get user's achievements
   */
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const result = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (!result) {
      logger.warn('[achievementService] getUserAchievements returned undefined');
      return [];
    }

    const { data, error } = result;
    if (error) throw error;
    return data || [];
  },

  /**
   * Award an achievement badge
   */
  async awardAchievement(
    userId: string,
    badgeType: string,
    badgeName: string,
    description: string
  ): Promise<Achievement> {
    // Check if user already has this badge
    const existingResult = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('badge_type', badgeType)
      .single();

    if (!existingResult) {
      logger.warn('[achievementService] awardAchievement check returned undefined');
    } else {
      const { data: existing } = existingResult;
      if (existing) {
        return existing;
      }
    }

    // Award new badge
    const result = await supabase
      .from('achievements')
      .insert({
        user_id: userId,
        badge_type: badgeType,
        badge_name: badgeName,
        description,
      })
      .select()
      .single();

    if (!result) {
      logger.warn('[achievementService] awardAchievement insert returned undefined');
      throw new Error('Failed to award achievement');
    }

    const { data, error } = result;
    if (error) throw error;
    return data;
  },

  /**
   * Check and award achievements based on user progress
   */
  async checkAndAwardAchievements(userId: string) {
    const profile = await profileService.getProfile(userId);
    if (!profile) return;

    const achievements = await this.getUserAchievements(userId);
    const earnedBadgeTypes = new Set(achievements.map(a => a.badge_type));

    // First verse
    if (!earnedBadgeTypes.has('first-verse')) {
      const countResult = await supabase
        .from('user_verse_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (!countResult) {
        logger.warn('[achievementService] checkAndAwardAchievements first-verse count returned undefined');
      } else {
        const { count } = countResult;
        if (count && count >= 1) {
          await this.awardAchievement(
            userId,
            'first-verse',
            'First Steps',
            'Memorize your first verse'
          );
        }
      }
    }

    // Week streak
    if (!earnedBadgeTypes.has('week-streak') && profile.current_streak >= 7) {
      await this.awardAchievement(
        userId,
        'week-streak',
        'Faithful Week',
        '7-day streak'
      );
    }

    // Month streak
    if (!earnedBadgeTypes.has('month-streak') && profile.current_streak >= 30) {
      await this.awardAchievement(
        userId,
        'month-streak',
        'Devoted Month',
        '30-day streak'
      );
    }

    // Perfect recital (10 verses with 100% accuracy)
    if (!earnedBadgeTypes.has('perfect-recital')) {
      const countResult = await supabase
        .from('practice_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('accuracy_percentage', 100);

      if (!countResult) {
        logger.warn('[achievementService] checkAndAwardAchievements perfect-recital count returned undefined');
      } else {
        const { count } = countResult;
        if (count && count >= 10) {
          await this.awardAchievement(
            userId,
            'perfect-recital',
            'Word Perfect',
            'Perfect recital of 10 verses'
          );
        }
      }
    }

    // Century club (100 verses mastered)
    if (!earnedBadgeTypes.has('century')) {
      const countResult = await supabase
        .from('user_verse_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'mastered');

      if (!countResult) {
        logger.warn('[achievementService] checkAndAwardAchievements century count returned undefined');
      } else {
        const { count } = countResult;
        if (count && count >= 100) {
          await this.awardAchievement(
            userId,
            'century',
            'Century Club',
            'Memorize 100 verses'
          );
        }
      }
    }
  },

  /**
   * Record today's practice
   */
  async recordDailyPractice(
    userId: string,
    versesPracticed: number,
    xpEarned: number
  ): Promise<DailyStreak> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const result = await supabase
      .from('daily_streaks')
      .upsert({
        user_id: userId,
        date: today,
        verses_practiced: versesPracticed,
        xp_earned: xpEarned,
      })
      .select()
      .single();

    if (!result) {
      logger.warn('[achievementService] recordDailyPractice returned undefined');
      throw new Error('Failed to record daily practice');
    }

    const { data, error } = result;
    if (error) throw error;

    // Update user streak
    await this.updateStreak(userId);

    return data;
  },

  /**
   * Update user's current streak
   */
  async updateStreak(userId: string) {
    // Get last 90 days of practice
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await supabase
      .from('daily_streaks')
      .select('date')
      .eq('user_id', userId)
      .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (!result) {
      logger.warn('[achievementService] updateStreak returned undefined');
      return;
    }

    const { data, error } = result;
    if (error) throw error;

    if (!data || data.length === 0) {
      await profileService.updateStreak(userId, 0);
      return;
    }

    // Calculate current streak
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if user practiced today or yesterday
    if (data[0].date !== today && data[0].date !== yesterdayStr) {
      await profileService.updateStreak(userId, 0);
      return;
    }

    // Count consecutive days
    let currentDate = new Date(data[0].date);
    for (const record of data) {
      const recordDate = new Date(record.date);
      const diffDays = Math.round(
        (currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays <= 1) {
        streak++;
        currentDate = recordDate;
      } else {
        break;
      }
    }

    await profileService.updateStreak(userId, streak);
  },

  /**
   * Get user's daily streak history
   */
  async getStreakHistory(userId: string, days: number = 30): Promise<DailyStreak[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await supabase
      .from('daily_streaks')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (!result) {
      logger.warn('[achievementService] getStreakHistory returned undefined');
      return [];
    }

    const { data, error } = result;
    if (error) throw error;
    return data || [];
  },
};

logger.log('[achievementService] achievementService object defined successfully');
logger.log('[achievementService] Module loaded!');
