/**
 * Advanced Analytics Service (Premium Feature - v1.2)
 *
 * Provides comprehensive analytics with:
 * - Daily snapshots tracking
 * - Learning velocity analysis
 * - Predictive insights
 * - Performance trends
 * - Detailed charts and graphs data
 *
 * Feature Flag: advancedAnalyticsDashboard
 * Premium: Yes (All tiers)
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import type {
  AnalyticsSnapshot,
  LearningVelocity,
} from '../types/database';

// =============================================
// TYPES & INTERFACES
// =============================================

export interface AnalyticsSummary {
  totalPracticeTime: number; // seconds
  averageAccuracy: number; // percentage
  versesMemorized: number;
  practiceSessions: number;
  bestDay: string | null;
  improvementRate: number; // percentage
}

export interface LearningTrend {
  date: string;
  accuracy: number;
  versesLearned: number;
  practiceTime: number;
  xpEarned: number;
}

export interface PerformanceMetrics {
  weeklyAverage: {
    accuracy: number;
    versesPerWeek: number;
    sessionsPerWeek: number;
    minutesPerWeek: number;
  };
  monthlyTrends: LearningTrend[];
  predictions: {
    nextWeekVerses: number;
    nextMonthVerses: number;
    projectedLevel: number;
    estimatedMasteryDate: string | null;
  };
}

export interface DetailedInsights {
  strongestDays: string[]; // e.g., ["Monday", "Wednesday"]
  weakestDays: string[];
  bestTimeOfDay: string; // e.g., "Morning", "Evening"
  retentionRate: number; // percentage
  mostPracticedBooks: Array<{ book: string; count: number }>;
  difficultyProgression: {
    easy: number;
    medium: number;
    hard: number;
  };
}

// =============================================
// SNAPSHOT MANAGEMENT
// =============================================

/**
 * Generate daily analytics snapshot for a user
 * Called automatically at end of day or on-demand
 */
export async function generateDailySnapshot(userId: string): Promise<boolean> {
  try {
    logger.log('[AdvancedAnalytics] Generating daily snapshot for user:', userId);

    // Call the database function
    const { error } = await supabase.rpc('generate_daily_analytics_snapshot', {
      p_user_id: userId,
    });

    if (error) {
      logger.error('[AdvancedAnalytics] Error generating snapshot:', error);
      return false;
    }

    logger.log('[AdvancedAnalytics] Daily snapshot generated successfully');
    return true;
  } catch (error) {
    logger.error('[AdvancedAnalytics] Exception generating snapshot:', error);
    return false;
  }
}

/**
 * Get analytics snapshots for a date range
 */
export async function getAnalyticsSnapshots(
  userId: string,
  startDate: string,
  endDate: string
): Promise<AnalyticsSnapshot[]> {
  try {
    const { data, error } = await supabase
      .from('analytics_snapshots')
      .select('*')
      .eq('user_id', userId)
      .gte('snapshot_date', startDate)
      .lte('snapshot_date', endDate)
      .order('snapshot_date', { ascending: true });

    if (error) {
      logger.error('[AdvancedAnalytics] Error fetching snapshots:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('[AdvancedAnalytics] Exception fetching snapshots:', error);
    return [];
  }
}

// =============================================
// ANALYTICS SUMMARY
// =============================================

/**
 * Get comprehensive analytics summary for a period
 */
export async function getAnalyticsSummary(
  userId: string,
  days: number = 30
): Promise<AnalyticsSummary | null> {
  try {
    logger.log('[AdvancedAnalytics] Fetching summary for last', days, 'days');

    const { data, error } = await supabase.rpc('get_advanced_analytics_summary', {
      p_user_id: userId,
      p_days: days,
    });

    if (error) {
      logger.error('[AdvancedAnalytics] Error fetching summary:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const summary = data[0];
    return {
      totalPracticeTime: summary.total_practice_time || 0,
      averageAccuracy: summary.average_accuracy || 0,
      versesMemorized: summary.verses_memorized || 0,
      practiceSessions: summary.practice_sessions || 0,
      bestDay: summary.best_day || null,
      improvementRate: summary.improvement_rate || 0,
    };
  } catch (error) {
    logger.error('[AdvancedAnalytics] Exception fetching summary:', error);
    return null;
  }
}

// =============================================
// LEARNING TRENDS
// =============================================

/**
 * Get learning trends over time
 */
export async function getLearningTrends(
  userId: string,
  days: number = 30
): Promise<LearningTrend[]> {
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const snapshots = await getAnalyticsSnapshots(userId, startDate, endDate);

    return snapshots.map((snapshot) => ({
      date: snapshot.snapshot_date,
      accuracy: snapshot.accuracy_rate,
      versesLearned: snapshot.verses_practiced_today,
      practiceTime: snapshot.total_practice_time,
      xpEarned: snapshot.xp_earned_today,
    }));
  } catch (error) {
    logger.error('[AdvancedAnalytics] Exception getting trends:', error);
    return [];
  }
}

// =============================================
// LEARNING VELOCITY
// =============================================

/**
 * Track weekly learning velocity
 */
export async function trackWeeklyVelocity(userId: string): Promise<boolean> {
  try {
    // Get start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday start
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    const weekStartDate = weekStart.toISOString().split('T')[0];

    // Get this week's practice data
    const { data: sessions, error: sessionsError } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('completed_at', weekStartDate);

    if (sessionsError) {
      logger.error('[AdvancedAnalytics] Error fetching sessions:', sessionsError);
      return false;
    }

    if (!sessions || sessions.length === 0) {
      return true; // No data this week yet
    }

    // Calculate metrics
    const versesLearned = new Set(sessions.map((s) => s.verse_id)).size;
    const practiceSessions = sessions.length;
    const averageAccuracy =
      sessions.reduce((sum, s) => sum + (s.accuracy_percentage || 0), 0) /
      sessions.length;
    const totalPracticeTime = sessions.reduce((sum, s) => {
      const start = new Date(s.started_at);
      const end = new Date(s.completed_at);
      return sum + (end.getTime() - start.getTime()) / 1000;
    }, 0);

    // Insert or update velocity record
    const { error: insertError } = await supabase
      .from('learning_velocity')
      .upsert(
        {
          user_id: userId,
          week_start_date: weekStartDate,
          verses_learned: versesLearned,
          practice_sessions: practiceSessions,
          average_accuracy: averageAccuracy,
          total_practice_time: Math.round(totalPracticeTime),
        },
        {
          onConflict: 'user_id,week_start_date',
        }
      );

    if (insertError) {
      logger.error('[AdvancedAnalytics] Error updating velocity:', insertError);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('[AdvancedAnalytics] Exception tracking velocity:', error);
    return false;
  }
}

/**
 * Get learning velocity data
 */
export async function getLearningVelocity(
  userId: string,
  weeks: number = 12
): Promise<LearningVelocity[]> {
  try {
    const { data, error } = await supabase
      .from('learning_velocity')
      .select('*')
      .eq('user_id', userId)
      .order('week_start_date', { ascending: false })
      .limit(weeks);

    if (error) {
      logger.error('[AdvancedAnalytics] Error fetching velocity:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('[AdvancedAnalytics] Exception fetching velocity:', error);
    return [];
  }
}

// =============================================
// PERFORMANCE METRICS & PREDICTIONS
// =============================================

/**
 * Get detailed performance metrics with predictions
 */
export async function getPerformanceMetrics(
  userId: string
): Promise<PerformanceMetrics | null> {
  try {
    // Get velocity data
    const velocity = await getLearningVelocity(userId, 12);

    if (velocity.length === 0) {
      return null;
    }

    // Calculate weekly averages
    const totalWeeks = velocity.length;
    const weeklyAverage = {
      accuracy:
        velocity.reduce((sum, v) => sum + v.average_accuracy, 0) / totalWeeks,
      versesPerWeek:
        velocity.reduce((sum, v) => sum + v.verses_learned, 0) / totalWeeks,
      sessionsPerWeek:
        velocity.reduce((sum, v) => sum + v.practice_sessions, 0) / totalWeeks,
      minutesPerWeek:
        velocity.reduce((sum, v) => sum + v.total_practice_time, 0) /
        totalWeeks /
        60,
    };

    // Get monthly trends (last 30 days)
    const monthlyTrends = await getLearningTrends(userId, 30);

    // Calculate predictions using linear regression
    const recentVelocity = velocity.slice(0, 4); // Last 4 weeks
    const avgRecentVerses =
      recentVelocity.reduce((sum, v) => sum + v.verses_learned, 0) /
      recentVelocity.length;

    // Simple predictions
    const nextWeekVerses = Math.round(avgRecentVerses);
    const nextMonthVerses = Math.round(avgRecentVerses * 4);

    // Get current level from latest snapshot
    const today = new Date().toISOString().split('T')[0];
    const snapshots = await getAnalyticsSnapshots(userId, today, today);
    const currentLevel = snapshots[0]?.level || 1;

    // Estimate level progression (rough estimate: 1000 XP per level, 50 XP per verse)
    const projectedXP = nextMonthVerses * 50;
    const projectedLevel = currentLevel + Math.floor(projectedXP / 1000);

    // Estimate mastery date (when user might master all verses they're learning)
    // Assuming 20% of verses are already mastered and user wants to master 100 verses
    const targetVerses = 100;
    const currentMastered = snapshots[0]?.total_verses_memorized || 0;
    const remaining = Math.max(0, targetVerses - currentMastered);
    const weeksToMastery = avgRecentVerses > 0 ? remaining / avgRecentVerses : null;
    const estimatedMasteryDate =
      weeksToMastery !== null
        ? new Date(Date.now() + weeksToMastery * 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0]
        : null;

    return {
      weeklyAverage,
      monthlyTrends,
      predictions: {
        nextWeekVerses,
        nextMonthVerses,
        projectedLevel,
        estimatedMasteryDate,
      },
    };
  } catch (error) {
    logger.error('[AdvancedAnalytics] Exception getting performance metrics:', error);
    return null;
  }
}

// =============================================
// DETAILED INSIGHTS
// =============================================

/**
 * Get detailed learning insights
 */
export async function getDetailedInsights(
  userId: string
): Promise<DetailedInsights | null> {
  try {
    // Get last 90 days of data
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const snapshots = await getAnalyticsSnapshots(userId, startDate, endDate);

    if (snapshots.length === 0) {
      return null;
    }

    // Group by day of week
    const dayPerformance: { [key: number]: { count: number; totalAccuracy: number } } = {};
    snapshots.forEach((snapshot) => {
      const day = new Date(snapshot.snapshot_date).getDay();
      if (!dayPerformance[day]) {
        dayPerformance[day] = { count: 0, totalAccuracy: 0 };
      }
      dayPerformance[day].count++;
      dayPerformance[day].totalAccuracy += snapshot.accuracy_rate;
    });

    // Calculate average accuracy per day
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayAverages = Object.entries(dayPerformance).map(([day, perf]) => ({
      day: parseInt(day),
      name: dayNames[parseInt(day)],
      avgAccuracy: perf.totalAccuracy / perf.count,
    }));

    dayAverages.sort((a, b) => b.avgAccuracy - a.avgAccuracy);

    const strongestDays = dayAverages.slice(0, 2).map((d) => d.name);
    const weakestDays = dayAverages.slice(-2).map((d) => d.name);

    // Get practice sessions to analyze time of day
    const { data: sessions } = await supabase
      .from('practice_sessions')
      .select('started_at')
      .eq('user_id', userId)
      .gte('completed_at', startDate);

    const timeOfDayCounts = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    sessions?.forEach((session) => {
      const hour = new Date(session.started_at).getHours();
      if (hour >= 5 && hour < 12) timeOfDayCounts.Morning++;
      else if (hour >= 12 && hour < 17) timeOfDayCounts.Afternoon++;
      else if (hour >= 17 && hour < 21) timeOfDayCounts.Evening++;
      else timeOfDayCounts.Night++;
    });

    const bestTimeOfDay = Object.entries(timeOfDayCounts).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];

    // Calculate retention rate (verses still being practiced vs mastered)
    const { data: progress } = await supabase
      .from('user_verse_progress')
      .select('status')
      .eq('user_id', userId);

    const totalVerses = progress?.length || 0;
    const masteredVerses = progress?.filter((p) => p.status === 'mastered').length || 0;
    const retentionRate = totalVerses > 0 ? (masteredVerses / totalVerses) * 100 : 0;

    // Get most practiced books
    const { data: verseProgress } = await supabase
      .from('user_verse_progress')
      .select('verse_id')
      .eq('user_id', userId);

    const verseIds = verseProgress?.map((p) => p.verse_id) || [];
    const { data: verses } = await supabase
      .from('verses')
      .select('book')
      .in('id', verseIds);

    const bookCounts: { [key: string]: number } = {};
    verses?.forEach((v) => {
      bookCounts[v.book] = (bookCounts[v.book] || 0) + 1;
    });

    const mostPracticedBooks = Object.entries(bookCounts)
      .map(([book, count]) => ({ book, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get difficulty progression
    const { data: versesWithDifficulty } = await supabase
      .from('verses')
      .select('difficulty')
      .in('id', verseIds);

    const difficultyProgression = {
      easy: versesWithDifficulty?.filter((v) => v.difficulty <= 2).length || 0,
      medium: versesWithDifficulty?.filter((v) => v.difficulty === 3).length || 0,
      hard: versesWithDifficulty?.filter((v) => v.difficulty >= 4).length || 0,
    };

    return {
      strongestDays,
      weakestDays,
      bestTimeOfDay,
      retentionRate,
      mostPracticedBooks,
      difficultyProgression,
    };
  } catch (error) {
    logger.error('[AdvancedAnalytics] Exception getting detailed insights:', error);
    return null;
  }
}

// =============================================
// EXPORTS
// =============================================

export default {
  generateDailySnapshot,
  getAnalyticsSnapshots,
  getAnalyticsSummary,
  getLearningTrends,
  trackWeeklyVelocity,
  getLearningVelocity,
  getPerformanceMetrics,
  getDetailedInsights,
};
