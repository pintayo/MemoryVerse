/**
 * App Review Service
 *
 * Smart app store review prompt system
 * - Tracks user engagement metrics
 * - Only prompts at positive moments
 * - Respects rate limits
 * - Uses native StoreReview API
 */

import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';
import { analyticsService } from './analyticsService';

const STORAGE_KEYS = {
  LAST_PROMPT_DATE: 'review_last_prompt_date',
  PROMPT_COUNT: 'review_prompt_count',
  USER_RESPONDED: 'review_user_responded',
  SESSIONS_COUNT: 'review_sessions_count',
  ACHIEVEMENTS_UNLOCKED: 'review_achievements_unlocked',
};

// Configuration
const REVIEW_CONFIG = {
  MIN_SESSIONS: 3, // Minimum app sessions before prompting
  MIN_DAYS_BETWEEN_PROMPTS: 90, // Wait 90 days between prompts
  MIN_VERSES_MEMORIZED: 5, // User should have memorized at least 5 verses
  MIN_STREAK: 3, // User should have at least 3-day streak
  MAX_PROMPT_COUNT: 3, // Maximum times to prompt user
};

interface ReviewPromptCriteria {
  sessionsCount: number;
  versesMemorized: number;
  currentStreak: number;
  achievementsUnlocked: number;
  lastPromptDate?: string;
  promptCount: number;
  userResponded: boolean;
}

class AppReviewService {
  /**
   * Check if we should show app review prompt
   */
  async shouldShowReviewPrompt(criteria: ReviewPromptCriteria): Promise<boolean> {
    try {
      // Check if store review is available
      const isAvailable = await StoreReview.isAvailableAsync();
      if (!isAvailable) {
        logger.info('[AppReview] Store review not available on this device');
        return false;
      }

      // Don't prompt if user already responded
      if (criteria.userResponded) {
        logger.info('[AppReview] User already responded to review');
        return false;
      }

      // Don't prompt if we've reached max prompt count
      if (criteria.promptCount >= REVIEW_CONFIG.MAX_PROMPT_COUNT) {
        logger.info('[AppReview] Max prompt count reached');
        return false;
      }

      // Check time since last prompt
      if (criteria.lastPromptDate) {
        const lastPrompt = new Date(criteria.lastPromptDate);
        const daysSinceLastPrompt = Math.floor(
          (Date.now() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastPrompt < REVIEW_CONFIG.MIN_DAYS_BETWEEN_PROMPTS) {
          logger.info(`[AppReview] Only ${daysSinceLastPrompt} days since last prompt`);
          return false;
        }
      }

      // Check engagement metrics
      const meetsSessionsRequirement = criteria.sessionsCount >= REVIEW_CONFIG.MIN_SESSIONS;
      const meetsVersesRequirement = criteria.versesMemorized >= REVIEW_CONFIG.MIN_VERSES_MEMORIZED;
      const meetsStreakRequirement = criteria.currentStreak >= REVIEW_CONFIG.MIN_STREAK;

      const shouldPrompt = meetsSessionsRequirement && meetsVersesRequirement && meetsStreakRequirement;

      logger.info('[AppReview] Criteria check:', {
        meetsSessionsRequirement,
        meetsVersesRequirement,
        meetsStreakRequirement,
        shouldPrompt,
      });

      return shouldPrompt;
    } catch (error) {
      logger.error('[AppReview] Error checking review prompt criteria:', error);
      return false;
    }
  }

  /**
   * Request app review from user
   */
  async requestReview(): Promise<void> {
    try {
      // Increment prompt count
      const promptCount = await this.getPromptCount();
      await this.setPromptCount(promptCount + 1);

      // Update last prompt date
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_PROMPT_DATE, new Date().toISOString());

      // Track analytics
      await analyticsService.logAppReviewPromptShown();

      // Show native review prompt
      await StoreReview.requestReview();

      logger.info('[AppReview] Review requested successfully');
    } catch (error) {
      logger.error('[AppReview] Error requesting review:', error);
    }
  }

  /**
   * Mark that user responded to review prompt
   */
  async markUserResponded(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_RESPONDED, 'true');
      logger.info('[AppReview] User marked as responded');
    } catch (error) {
      logger.error('[AppReview] Error marking user responded:', error);
    }
  }

  /**
   * Increment session count
   */
  async incrementSessionCount(): Promise<void> {
    try {
      const count = await this.getSessionCount();
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS_COUNT, String(count + 1));
    } catch (error) {
      logger.error('[AppReview] Error incrementing session count:', error);
    }
  }

  /**
   * Get session count
   */
  async getSessionCount(): Promise<number> {
    try {
      const count = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS_COUNT);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      logger.error('[AppReview] Error getting session count:', error);
      return 0;
    }
  }

  /**
   * Get prompt count
   */
  async getPromptCount(): Promise<number> {
    try {
      const count = await AsyncStorage.getItem(STORAGE_KEYS.PROMPT_COUNT);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      logger.error('[AppReview] Error getting prompt count:', error);
      return 0;
    }
  }

  /**
   * Set prompt count
   */
  async setPromptCount(count: number): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROMPT_COUNT, String(count));
    } catch (error) {
      logger.error('[AppReview] Error setting prompt count:', error);
    }
  }

  /**
   * Check if user has responded
   */
  async hasUserResponded(): Promise<boolean> {
    try {
      const responded = await AsyncStorage.getItem(STORAGE_KEYS.USER_RESPONDED);
      return responded === 'true';
    } catch (error) {
      logger.error('[AppReview] Error checking user responded:', error);
      return false;
    }
  }

  /**
   * Get last prompt date
   */
  async getLastPromptDate(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LAST_PROMPT_DATE);
    } catch (error) {
      logger.error('[AppReview] Error getting last prompt date:', error);
      return null;
    }
  }

  /**
   * Check if should prompt after positive event
   * Call this after achievements, completing verses, maintaining streaks
   */
  async checkAndPromptAfterPositiveEvent(
    versesMemorized: number,
    currentStreak: number,
    achievementsUnlocked: number
  ): Promise<void> {
    try {
      const sessionsCount = await this.getSessionCount();
      const promptCount = await this.getPromptCount();
      const userResponded = await this.hasUserResponded();
      const lastPromptDate = await this.getLastPromptDate();

      const shouldPrompt = await this.shouldShowReviewPrompt({
        sessionsCount,
        versesMemorized,
        currentStreak,
        achievementsUnlocked,
        lastPromptDate: lastPromptDate || undefined,
        promptCount,
        userResponded,
      });

      if (shouldPrompt) {
        logger.info('[AppReview] Showing review prompt after positive event');
        await this.requestReview();
      }
    } catch (error) {
      logger.error('[AppReview] Error checking prompt after positive event:', error);
    }
  }

  /**
   * Reset review prompt data (for testing)
   */
  async resetReviewData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.LAST_PROMPT_DATE,
        STORAGE_KEYS.PROMPT_COUNT,
        STORAGE_KEYS.USER_RESPONDED,
        STORAGE_KEYS.SESSIONS_COUNT,
      ]);
      logger.info('[AppReview] Review data reset');
    } catch (error) {
      logger.error('[AppReview] Error resetting review data:', error);
    }
  }

  /**
   * Get review stats for debugging
   */
  async getReviewStats(): Promise<{
    sessionsCount: number;
    promptCount: number;
    userResponded: boolean;
    lastPromptDate: string | null;
  }> {
    return {
      sessionsCount: await this.getSessionCount(),
      promptCount: await this.getPromptCount(),
      userResponded: await this.hasUserResponded(),
      lastPromptDate: await this.getLastPromptDate(),
    };
  }
}

export const appReviewService = new AppReviewService();
export default appReviewService;
