/**
 * Streak Service
 * Handles streak calculation, tracking, and freeze functionality
 */

import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const STREAK_FREEZE_KEY = 'streak_freeze_available';
const LAST_PRACTICE_DATE_KEY = 'last_practice_date';

export interface DayActivity {
  date: string; // YYYY-MM-DD format
  count: number; // Number of practices that day
  completed: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  practiceHistory: DayActivity[];
  freezeAvailable: boolean;
  nextMilestone: number;
  milestonesReached: number[];
}

const MILESTONES = [7, 30, 100, 365];

class StreakService {
  /**
   * Get user's streak data with practice history
   */
  async getStreakData(userId: string, days: number = 90): Promise<StreakData> {
    try {
      // Get practice history for the last N days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: sessions, error } = await supabase
        .from('practice_sessions')
        .select('created_at, completed_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group sessions by date
      const activityMap = new Map<string, number>();

      (sessions || []).forEach((session) => {
        const date = new Date(session.created_at).toISOString().split('T')[0];
        activityMap.set(date, (activityMap.get(date) || 0) + 1);
      });

      // Build activity array for calendar
      const practiceHistory: DayActivity[] = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = activityMap.get(dateStr) || 0;

        practiceHistory.push({
          date: dateStr,
          count,
          completed: count > 0,
        });
      }

      // Calculate current streak
      const currentStreak = this.calculateCurrentStreak(practiceHistory);

      // Calculate longest streak
      const longestStreak = this.calculateLongestStreak(practiceHistory);

      // Check freeze availability (premium feature)
      const freezeAvailable = await this.checkFreezeAvailability(userId);

      // Calculate milestones
      const milestonesReached = MILESTONES.filter((m) => longestStreak >= m);
      const nextMilestone = MILESTONES.find((m) => currentStreak < m) || MILESTONES[MILESTONES.length - 1];

      return {
        currentStreak,
        longestStreak,
        practiceHistory: practiceHistory.reverse(), // Oldest to newest
        freezeAvailable,
        nextMilestone,
        milestonesReached,
      };
    } catch (error) {
      logger.error('[StreakService] Error getting streak data:', error);
      return {
        currentStreak: 0,
        longestStreak: 0,
        practiceHistory: [],
        freezeAvailable: false,
        nextMilestone: MILESTONES[0],
        milestonesReached: [],
      };
    }
  }

  /**
   * Calculate current streak from today going backwards
   */
  private calculateCurrentStreak(history: DayActivity[]): number {
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];

    // Start from today and go backwards
    for (let i = 0; i < history.length; i++) {
      const day = history[i];

      // Skip future dates
      if (day.date > today) continue;

      if (day.completed) {
        streak++;
      } else {
        // Allow one day grace period (streak freeze or today not completed yet)
        const dayDate = new Date(day.date);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));

        // If it's today or yesterday, don't break streak yet
        if (diffDays <= 1) continue;

        break;
      }
    }

    return streak;
  }

  /**
   * Calculate longest streak in history
   */
  private calculateLongestStreak(history: DayActivity[]): number {
    let maxStreak = 0;
    let currentStreak = 0;

    history.forEach((day) => {
      if (day.completed) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    return maxStreak;
  }

  /**
   * Check if user has streak freeze available (premium feature)
   */
  async checkFreezeAvailability(userId: string): Promise<boolean> {
    try {
      // Check if user is premium
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_premium, premium_expires_at')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (!profile?.is_premium) return false;

      // Check if freeze is already used this week
      const lastUsed = await AsyncStorage.getItem(`${STREAK_FREEZE_KEY}_${userId}`);
      if (lastUsed) {
        const lastUsedDate = new Date(lastUsed);
        const daysSince = Math.floor((Date.now() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSince >= 7; // Can use once per week
      }

      return true;
    } catch (error) {
      logger.error('[StreakService] Error checking freeze availability:', error);
      return false;
    }
  }

  /**
   * Use streak freeze to protect streak
   */
  async useStreakFreeze(userId: string): Promise<boolean> {
    try {
      const available = await this.checkFreezeAvailability(userId);
      if (!available) {
        logger.warn('[StreakService] Streak freeze not available');
        return false;
      }

      // Mark freeze as used
      await AsyncStorage.setItem(`${STREAK_FREEZE_KEY}_${userId}`, new Date().toISOString());

      logger.log('[StreakService] Streak freeze used successfully');
      return true;
    } catch (error) {
      logger.error('[StreakService] Error using streak freeze:', error);
      return false;
    }
  }

  /**
   * Record daily practice activity
   */
  async recordPractice(userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(`${LAST_PRACTICE_DATE_KEY}_${userId}`, today);
      logger.log('[StreakService] Practice recorded for today');
    } catch (error) {
      logger.error('[StreakService] Error recording practice:', error);
    }
  }

  /**
   * Get streak warning message
   */
  getStreakWarning(currentStreak: number, lastPracticeDate: string | null): string | null {
    if (currentStreak === 0) return null;

    const today = new Date().toISOString().split('T')[0];

    if (lastPracticeDate === today) {
      // Already practiced today
      return null;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastPracticeDate === yesterdayStr) {
      // Practiced yesterday but not today
      return `Don't break your ${currentStreak}-day streak! Practice today to keep it going.`;
    }

    // Streak is already broken or at risk
    if (currentStreak >= 7) {
      return `Your ${currentStreak}-day streak is at risk! Practice now to save it.`;
    }

    return `Keep your ${currentStreak}-day streak alive! Practice now.`;
  }

  /**
   * Get milestone message
   */
  getMilestoneMessage(currentStreak: number): string | null {
    if (MILESTONES.includes(currentStreak)) {
      return `🎉 Amazing! You've reached a ${currentStreak}-day streak milestone!`;
    }
    return null;
  }
}

export const streakService = new StreakService();

logger.log('[streakService] Module loaded');
