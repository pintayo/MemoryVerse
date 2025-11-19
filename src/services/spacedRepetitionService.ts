/**
 * Spaced Repetition Service
 * Implements SM-2 algorithm (SuperMemo 2) for optimal review scheduling
 */

import { supabase } from '../lib/supabase';
import { Verse } from '../types/database';
import { logger } from '../utils/logger';

export interface ReviewVerse extends Verse {
  progress_id: string;
  status: 'learning' | 'reviewing' | 'mastered';
  accuracy_score: number;
  attempts: number;
  last_practiced_at: string;
  next_review_at: string | null;
  days_until_review: number;
}

export interface ReviewStats {
  dueToday: number;
  dueThisWeek: number;
  learning: number;
  reviewing: number;
  mastered: number;
}

/**
 * SM-2 Algorithm Parameters
 * Based on research by Piotr Wozniak
 */
const SM2_INTERVALS = {
  // Initial intervals in days
  FIRST_REVIEW: 1,
  SECOND_REVIEW: 6,

  // Quality thresholds (0-1 accuracy score)
  EASY: 0.9,
  GOOD: 0.7,
  HARD: 0.5,
  FAIL: 0.3,

  // Ease factor adjustments
  MIN_EASE: 1.3,
  DEFAULT_EASE: 2.5,
  MAX_EASE: 3.0,
};

class SpacedRepetitionService {
  /**
   * Get all verses due for review
   */
  async getReviewVerses(userId: string): Promise<ReviewVerse[]> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('user_verse_progress')
        .select(`
          id,
          status,
          accuracy_score,
          attempts,
          last_practiced_at,
          next_review_at,
          verses (*)
        `)
        .eq('user_id', userId)
        .lte('next_review_at', now)
        .order('next_review_at', { ascending: true });

      if (error) throw error;

      // Map to ReviewVerse format
      const reviewVerses: ReviewVerse[] = (data || []).map((progress: any) => {
        const verse = progress.verses;
        const daysUntil = this.calculateDaysUntilReview(progress.next_review_at);

        return {
          ...verse,
          progress_id: progress.id,
          status: progress.status,
          accuracy_score: progress.accuracy_score,
          attempts: progress.attempts,
          last_practiced_at: progress.last_practiced_at,
          next_review_at: progress.next_review_at,
          days_until_review: daysUntil,
        };
      });

      logger.log(`[SpacedRepetitionService] Found ${reviewVerses.length} verses due for review`);
      return reviewVerses;
    } catch (error) {
      logger.error('[SpacedRepetitionService] Error getting review verses:', error);
      return [];
    }
  }

  /**
   * Get review statistics
   */
  async getReviewStats(userId: string): Promise<ReviewStats> {
    try {
      const now = new Date();
      const weekFromNow = new Date(now);
      weekFromNow.setDate(weekFromNow.getDate() + 7);

      const { data, error } = await supabase
        .from('user_verse_progress')
        .select('status, next_review_at')
        .eq('user_id', userId);

      if (error) throw error;

      let dueToday = 0;
      let dueThisWeek = 0;
      let learning = 0;
      let reviewing = 0;
      let mastered = 0;

      (data || []).forEach((progress: any) => {
        // Count by status
        if (progress.status === 'learning') learning++;
        else if (progress.status === 'reviewing') reviewing++;
        else if (progress.status === 'mastered') mastered++;

        // Count by due date
        if (progress.next_review_at) {
          const reviewDate = new Date(progress.next_review_at);
          if (reviewDate <= now) {
            dueToday++;
          } else if (reviewDate <= weekFromNow) {
            dueThisWeek++;
          }
        }
      });

      return {
        dueToday,
        dueThisWeek,
        learning,
        reviewing,
        mastered,
      };
    } catch (error) {
      logger.error('[SpacedRepetitionService] Error getting review stats:', error);
      return {
        dueToday: 0,
        dueThisWeek: 0,
        learning: 0,
        reviewing: 0,
        mastered: 0,
      };
    }
  }

  /**
   * Record review result and calculate next review date
   * Uses SM-2 algorithm
   */
  async recordReview(
    progressId: string,
    accuracyScore: number,
    timeSpentSeconds: number
  ): Promise<void> {
    try {
      // Get current progress
      const { data: progress, error: fetchError } = await supabase
        .from('user_verse_progress')
        .select('*')
        .eq('id', progressId)
        .single();

      if (fetchError) throw fetchError;
      if (!progress) throw new Error('Progress not found');

      // Calculate new ease factor and interval
      const reviewResult = this.calculateNextReview(
        progress.attempts,
        accuracyScore,
        progress.accuracy_score,
        progress.status
      );

      // Update progress
      const updates: any = {
        accuracy_score: reviewResult.newAccuracyScore,
        attempts: progress.attempts + 1,
        last_practiced_at: new Date().toISOString(),
        next_review_at: reviewResult.nextReviewDate,
        status: reviewResult.newStatus,
        updated_at: new Date().toISOString(),
      };

      // Mark as mastered if appropriate
      if (reviewResult.newStatus === 'mastered' && !progress.mastered_at) {
        updates.mastered_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('user_verse_progress')
        .update(updates)
        .eq('id', progressId);

      if (updateError) throw updateError;

      logger.log(`[SpacedRepetitionService] Review recorded. Next review: ${reviewResult.nextReviewDate}`);
    } catch (error) {
      logger.error('[SpacedRepetitionService] Error recording review:', error);
      throw error;
    }
  }

  /**
   * Calculate next review date using SM-2 algorithm
   */
  private calculateNextReview(
    attempts: number,
    currentAccuracy: number,
    previousAccuracy: number,
    currentStatus: string
  ): {
    nextReviewDate: string;
    newAccuracyScore: number;
    newStatus: 'learning' | 'reviewing' | 'mastered';
  } {
    // Calculate weighted accuracy (current attempt weighted more)
    const newAccuracyScore = previousAccuracy * 0.7 + currentAccuracy * 0.3;

    let intervalDays = 0;
    let newStatus: 'learning' | 'reviewing' | 'mastered' = currentStatus as any;

    // Determine quality rating
    const quality = this.getQualityRating(currentAccuracy);

    // First review (learning phase)
    if (attempts === 0) {
      if (quality >= 3) {
        intervalDays = SM2_INTERVALS.FIRST_REVIEW;
        newStatus = 'learning';
      } else {
        // Failed first attempt, make available for immediate re-review
        intervalDays = 0;
        newStatus = 'learning';
      }
    }
    // Second review
    else if (attempts === 1) {
      if (quality >= 3) {
        intervalDays = SM2_INTERVALS.SECOND_REVIEW;
        newStatus = 'reviewing';
      } else {
        // Failed, make available for immediate re-review
        intervalDays = 0;
        newStatus = 'learning';
      }
    }
    // Subsequent reviews (SM-2 algorithm)
    else {
      // Calculate ease factor based on quality
      let easeFactor = SM2_INTERVALS.DEFAULT_EASE;

      if (quality >= 4) {
        // Easy - increase interval significantly
        easeFactor = Math.min(SM2_INTERVALS.MAX_EASE, easeFactor + 0.15);
      } else if (quality === 3) {
        // Good - standard progression
        easeFactor = SM2_INTERVALS.DEFAULT_EASE;
      } else if (quality === 2) {
        // Hard - slower progression
        easeFactor = Math.max(SM2_INTERVALS.MIN_EASE, easeFactor - 0.15);
      } else {
        // Failed - make available for immediate re-review
        intervalDays = 0;
        newStatus = 'learning';
        easeFactor = SM2_INTERVALS.MIN_EASE;
      }

      if (quality >= 3) {
        // Calculate next interval: previous_interval * ease_factor
        const previousInterval = this.calculatePreviousInterval(attempts);
        intervalDays = Math.round(previousInterval * easeFactor);

        // Update status based on accuracy and attempts
        if (newAccuracyScore >= SM2_INTERVALS.EASY && attempts >= 5) {
          newStatus = 'mastered';
        } else {
          newStatus = 'reviewing';
        }
      }
    }

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

    return {
      nextReviewDate: nextReviewDate.toISOString(),
      newAccuracyScore,
      newStatus,
    };
  }

  /**
   * Get quality rating (0-5) based on accuracy score
   * 5: Perfect (>90%)
   * 4: Easy (70-90%)
   * 3: Good (50-70%)
   * 2: Hard (30-50%)
   * 1: Fail (<30%)
   */
  private getQualityRating(accuracyScore: number): number {
    if (accuracyScore >= SM2_INTERVALS.EASY) return 5;
    if (accuracyScore >= SM2_INTERVALS.GOOD) return 4;
    if (accuracyScore >= SM2_INTERVALS.HARD) return 3;
    if (accuracyScore >= SM2_INTERVALS.FAIL) return 2;
    return 1;
  }

  /**
   * Calculate previous interval based on attempt number
   * Used for SM-2 progression
   */
  private calculatePreviousInterval(attempts: number): number {
    if (attempts <= 1) return SM2_INTERVALS.FIRST_REVIEW;
    if (attempts === 2) return SM2_INTERVALS.SECOND_REVIEW;

    // Exponential backoff for later reviews
    let interval = SM2_INTERVALS.SECOND_REVIEW;
    for (let i = 3; i <= attempts; i++) {
      interval *= SM2_INTERVALS.DEFAULT_EASE;
    }

    return Math.min(interval, 365); // Cap at 1 year
  }

  /**
   * Calculate days until review
   * Returns negative number if overdue
   */
  private calculateDaysUntilReview(nextReviewAt: string | null): number {
    if (!nextReviewAt) return 0;

    const now = new Date();
    const reviewDate = new Date(nextReviewAt);
    const diffMs = reviewDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays; // Allow negative values for overdue verses
  }

  /**
   * Get verses grouped by review urgency
   */
  async getReviewsByUrgency(userId: string): Promise<{
    overdue: ReviewVerse[];
    dueToday: ReviewVerse[];
    dueSoon: ReviewVerse[];
  }> {
    try {
      const allReviews = await this.getReviewVerses(userId);

      const overdue: ReviewVerse[] = [];
      const dueToday: ReviewVerse[] = [];
      const dueSoon: ReviewVerse[] = [];

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);

      allReviews.forEach((verse) => {
        const reviewDate = new Date(verse.next_review_at || '');

        if (reviewDate < today) {
          overdue.push(verse);
        } else if (reviewDate < tomorrow) {
          dueToday.push(verse);
        } else if (reviewDate < weekFromNow) {
          dueSoon.push(verse);
        }
      });

      return { overdue, dueToday, dueSoon };
    } catch (error) {
      logger.error('[SpacedRepetitionService] Error getting reviews by urgency:', error);
      return { overdue: [], dueToday: [], dueSoon: [] };
    }
  }
}

export const spacedRepetitionService = new SpacedRepetitionService();

logger.log('[spacedRepetitionService] Module loaded');
