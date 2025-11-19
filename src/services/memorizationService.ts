/**
 * Memorization Service
 *
 * Tracks which verses have been memorized (one-time per verse)
 */

import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import { verseService } from './verseService';

const LOCAL_MEMORIZED_KEY = 'memorized_verses';

export interface MemorizedVerse {
  verseId: string;
  memorizedAt: number;
}

export const memorizationService = {
  /**
   * Mark a verse as memorized (can only be done once per verse)
   */
  async markAsMemorized(userId: string | null, verseId: string): Promise<boolean> {
    try {
      if (userId) {
        // For logged-in users, update database
        const currentProgress = await verseService.getUserVerseProgress(userId, verseId);

        // Don't mark again if already mastered
        if (currentProgress?.status === 'mastered') {
          logger.log('[Memorization] Verse already marked as mastered:', verseId);
          return false;
        }

        // Mark as mastered in database
        await verseService.upsertUserVerseProgress(userId, verseId, {
          status: 'mastered',
          mastered_at: new Date().toISOString(),
          accuracy_score: currentProgress?.accuracy_score || 100,
          attempts: currentProgress?.attempts || 1,
        });

        logger.log('[Memorization] Verse marked as mastered in database:', verseId);
        return true;
      } else {
        // For guest users, store locally
        const memorized = await this.getLocalMemorizedVerses();

        // Don't mark again if already memorized
        if (memorized.some(v => v.verseId === verseId)) {
          logger.log('[Memorization] Verse already marked as memorized locally:', verseId);
          return false;
        }

        memorized.push({
          verseId,
          memorizedAt: Date.now(),
        });

        await AsyncStorage.setItem(LOCAL_MEMORIZED_KEY, JSON.stringify(memorized));
        logger.log('[Memorization] Verse marked as memorized locally:', verseId);
        return true;
      }
    } catch (error) {
      logger.error('[Memorization] Error marking verse as memorized:', error);
      return false;
    }
  },

  /**
   * Check if a verse is already memorized
   */
  async isMemorized(userId: string | null, verseId: string): Promise<boolean> {
    try {
      if (userId) {
        // Check database
        const progress = await verseService.getUserVerseProgress(userId, verseId);
        return progress?.status === 'mastered';
      } else {
        // Check local storage
        const memorized = await this.getLocalMemorizedVerses();
        return memorized.some(v => v.verseId === verseId);
      }
    } catch (error) {
      logger.error('[Memorization] Error checking if verse is memorized:', error);
      return false;
    }
  },

  /**
   * Get count of memorized verses
   */
  async getMemorizedCount(userId: string | null): Promise<number> {
    try {
      if (userId) {
        // Count from database
        const result = await supabase
          .from('user_verse_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'mastered');

        if (!result) {
          logger.warn('[Memorization] Database count query returned undefined');
          return 0;
        }

        return result.count || 0;
      } else {
        // Count from local storage
        const memorized = await this.getLocalMemorizedVerses();
        return memorized.length;
      }
    } catch (error) {
      logger.error('[Memorization] Error getting memorized count:', error);
      return 0;
    }
  },

  /**
   * Get all memorized verse IDs
   */
  async getMemorizedVerseIds(userId: string | null): Promise<string[]> {
    try {
      if (userId) {
        const mastered = await verseService.getMasteredVerses(userId);
        return mastered.map(v => v.id);
      } else {
        const memorized = await this.getLocalMemorizedVerses();
        return memorized.map(v => v.verseId);
      }
    } catch (error) {
      logger.error('[Memorization] Error getting memorized verse IDs:', error);
      return [];
    }
  },

  /**
   * Get locally stored memorized verses (for guest users)
   */
  async getLocalMemorizedVerses(): Promise<MemorizedVerse[]> {
    try {
      const data = await AsyncStorage.getItem(LOCAL_MEMORIZED_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      logger.error('[Memorization] Error getting local memorized verses:', error);
      return [];
    }
  },

  /**
   * Clear all local memorization data (for testing or sign-out)
   */
  async clearLocalData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(LOCAL_MEMORIZED_KEY);
      logger.log('[Memorization] Local data cleared');
    } catch (error) {
      logger.error('[Memorization] Error clearing local data:', error);
    }
  },
};
