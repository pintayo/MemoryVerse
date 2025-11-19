/**
 * Practice Stats Service
 *
 * Tracks practice session statistics locally
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const PRACTICE_STATS_KEY = 'practice_stats';

export interface PracticeStats {
  totalSessionsCompleted: number;
  lastSessionDate: string | null;
  sessionsThisWeek: number;
  sessionsThisMonth: number;
}

export const practiceStatsService = {
  /**
   * Record a completed practice session
   */
  async recordSessionCompleted(): Promise<void> {
    try {
      const stats = await this.getPracticeStats();
      const today = new Date().toISOString().split('T')[0];

      stats.totalSessionsCompleted += 1;
      stats.lastSessionDate = today;

      // Update weekly/monthly counts
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date();
      monthStart.setDate(monthStart.getDate() - 30);

      await AsyncStorage.setItem(PRACTICE_STATS_KEY, JSON.stringify(stats));
      logger.log('[PracticeStats] Session recorded. Total:', stats.totalSessionsCompleted);
    } catch (error) {
      logger.error('[PracticeStats] Error recording session:', error);
    }
  },

  /**
   * Get practice statistics
   */
  async getPracticeStats(): Promise<PracticeStats> {
    try {
      const data = await AsyncStorage.getItem(PRACTICE_STATS_KEY);
      if (!data) {
        return {
          totalSessionsCompleted: 0,
          lastSessionDate: null,
          sessionsThisWeek: 0,
          sessionsThisMonth: 0,
        };
      }
      return JSON.parse(data);
    } catch (error) {
      logger.error('[PracticeStats] Error getting stats:', error);
      return {
        totalSessionsCompleted: 0,
        lastSessionDate: null,
        sessionsThisWeek: 0,
        sessionsThisMonth: 0,
      };
    }
  },

  /**
   * Clear all practice stats (for testing)
   */
  async clearStats(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PRACTICE_STATS_KEY);
      logger.log('[PracticeStats] Stats cleared');
    } catch (error) {
      logger.error('[PracticeStats] Error clearing stats:', error);
    }
  },
};
