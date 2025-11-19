/**
 * Daily Tasks Service
 * Tracks completion of daily spiritual goals
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

const DAILY_TASKS_KEY = 'daily_tasks_completion';

export type DailyTaskId = 'verse' | 'practice' | 'understand' | 'chapter' | 'review';

interface DailyTasksCompletion {
  date: string; // YYYY-MM-DD format
  tasks: {
    [key in DailyTaskId]?: boolean;
  };
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Load today's task completion status
 */
export async function loadTodaysTasks(): Promise<Record<DailyTaskId, boolean>> {
  try {
    const stored = await AsyncStorage.getItem(DAILY_TASKS_KEY);
    const today = getTodayDate();

    if (!stored) {
      return {
        verse: false,
        practice: false,
        understand: false,
        chapter: false,
        review: false,
      };
    }

    const data: DailyTasksCompletion = JSON.parse(stored);

    // If stored data is from a different day, reset
    if (data.date !== today) {
      logger.log('[DailyTasks] New day detected, resetting tasks');
      return {
        verse: false,
        practice: false,
        understand: false,
        chapter: false,
        review: false,
      };
    }

    return {
      verse: data.tasks.verse || false,
      practice: data.tasks.practice || false,
      understand: data.tasks.understand || false,
      chapter: data.tasks.chapter || false,
      review: data.tasks.review || false,
    };
  } catch (error) {
    logger.error('[DailyTasks] Error loading tasks:', error);
    return {
      verse: false,
      practice: false,
      understand: false,
      chapter: false,
      review: false,
    };
  }
}

/**
 * Mark a task as completed for today
 * Also records to database for logged-in users to update streak
 */
export async function completeTask(taskId: DailyTaskId, userId?: string): Promise<void> {
  try {
    const today = getTodayDate();
    const currentTasks = await loadTodaysTasks();

    const updated: DailyTasksCompletion = {
      date: today,
      tasks: {
        ...currentTasks,
        [taskId]: true,
      },
    };

    await AsyncStorage.setItem(DAILY_TASKS_KEY, JSON.stringify(updated));
    logger.log(`[DailyTasks] Completed task: ${taskId}`);

    // If user is logged in, also record to database for streak tracking
    if (userId) {
      await recordDailyActivity(userId, taskId);
    }
  } catch (error) {
    logger.error('[DailyTasks] Error completing task:', error);
  }
}

/**
 * Record daily activity to database and update streak (for logged-in users)
 */
export async function recordDailyActivity(userId: string, activityType: DailyTaskId): Promise<void> {
  try {
    // Call the database function to record activity
    const { error: recordError } = await supabase.rpc('record_daily_activity', {
      p_user_id: userId,
      p_activity_type: activityType,
    });

    if (recordError) {
      logger.error('[DailyTasks] Error recording activity:', recordError);
      return;
    }

    // Update the profile streak
    const { error: streakError } = await supabase.rpc('update_profile_streak', {
      p_user_id: userId,
    });

    if (streakError) {
      logger.error('[DailyTasks] Error updating streak:', streakError);
      return;
    }

    logger.log(`[DailyTasks] Recorded activity and updated streak: ${activityType}`);
  } catch (error) {
    logger.error('[DailyTasks] Error in recordDailyActivity:', error);
  }
}

/**
 * Check if all tasks are completed for today
 */
export async function areAllTasksCompleted(): Promise<boolean> {
  const tasks = await loadTodaysTasks();
  return Object.values(tasks).every(completed => completed);
}

/**
 * Get completion count for today
 */
export async function getCompletionCount(): Promise<number> {
  const tasks = await loadTodaysTasks();
  return Object.values(tasks).filter(completed => completed).length;
}

/**
 * Reset all tasks (mainly for testing)
 */
export async function resetTasks(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DAILY_TASKS_KEY);
    logger.log('[DailyTasks] Tasks reset');
  } catch (error) {
    logger.error('[DailyTasks] Error resetting tasks:', error);
  }
}
