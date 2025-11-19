/**
 * Achievements Service
 *
 * Manages user achievements with progress tracking and unlocking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const ACHIEVEMENTS_KEY = 'user_achievements';

export type AchievementCategory = 'learning' | 'streak' | 'reading' | 'practice' | 'level';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string; // emoji or icon name
  requirement: number;
  currentProgress?: number;
  unlocked: boolean;
  unlockedAt?: number;
  xpReward: number;
}

export interface AchievementProgress {
  [achievementId: string]: {
    progress: number;
    unlocked: boolean;
    unlockedAt?: number;
  };
}

// Define all achievements
const ALL_ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'currentProgress'>[] = [
  // Learning Achievements
  {
    id: 'first_verse',
    title: 'First Steps',
    description: 'Learn your first Bible verse',
    category: 'learning',
    icon: '🌱',
    requirement: 1,
    xpReward: 50,
  },
  {
    id: 'verses_10',
    title: 'Growing Faith',
    description: 'Learn 10 Bible verses',
    category: 'learning',
    icon: '🌿',
    requirement: 10,
    xpReward: 100,
  },
  {
    id: 'verses_25',
    title: 'Scripture Scholar',
    description: 'Learn 25 Bible verses',
    category: 'learning',
    icon: '📜',
    requirement: 25,
    xpReward: 250,
  },
  {
    id: 'verses_50',
    title: 'Word Master',
    description: 'Learn 50 Bible verses',
    category: 'learning',
    icon: '📖',
    requirement: 50,
    xpReward: 500,
  },
  {
    id: 'verses_100',
    title: 'Memory Champion',
    description: 'Learn 100 Bible verses',
    category: 'learning',
    icon: '🏆',
    requirement: 100,
    xpReward: 1000,
  },

  // Streak Achievements
  {
    id: 'streak_3',
    title: 'Building Habits',
    description: 'Maintain a 3-day practice streak',
    category: 'streak',
    icon: '🔥',
    requirement: 3,
    xpReward: 75,
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day practice streak',
    category: 'streak',
    icon: '🔥',
    requirement: 7,
    xpReward: 150,
  },
  {
    id: 'streak_30',
    title: 'Month Master',
    description: 'Maintain a 30-day practice streak',
    category: 'streak',
    icon: '🔥',
    requirement: 30,
    xpReward: 500,
  },
  {
    id: 'streak_100',
    title: 'Century of Faith',
    description: 'Maintain a 100-day practice streak',
    category: 'streak',
    icon: '🔥',
    requirement: 100,
    xpReward: 2000,
  },

  // Level Achievements
  {
    id: 'level_5',
    title: 'Rising Star',
    description: 'Reach level 5',
    category: 'level',
    icon: '⭐',
    requirement: 5,
    xpReward: 100,
  },
  {
    id: 'level_10',
    title: 'Dedicated Learner',
    description: 'Reach level 10',
    category: 'level',
    icon: '⭐',
    requirement: 10,
    xpReward: 250,
  },
  {
    id: 'level_20',
    title: 'Expert Scholar',
    description: 'Reach level 20',
    category: 'level',
    icon: '⭐',
    requirement: 20,
    xpReward: 500,
  },
  {
    id: 'level_50',
    title: 'Living Legend',
    description: 'Reach level 50',
    category: 'level',
    icon: '⭐',
    requirement: 50,
    xpReward: 2000,
  },

  // Practice Achievements
  {
    id: 'practice_10',
    title: 'Practice Makes Perfect',
    description: 'Complete 10 practice sessions',
    category: 'practice',
    icon: '💪',
    requirement: 10,
    xpReward: 100,
  },
  {
    id: 'practice_50',
    title: 'Training Master',
    description: 'Complete 50 practice sessions',
    category: 'practice',
    icon: '💪',
    requirement: 50,
    xpReward: 300,
  },
  {
    id: 'practice_100',
    title: 'Practice Legend',
    description: 'Complete 100 practice sessions',
    category: 'practice',
    icon: '💪',
    requirement: 100,
    xpReward: 750,
  },

  // Reading Achievements
  {
    id: 'read_5_chapters',
    title: 'Bible Explorer',
    description: 'Read 5 Bible chapters',
    category: 'reading',
    icon: '📚',
    requirement: 5,
    xpReward: 100,
  },
  {
    id: 'read_25_chapters',
    title: 'Devoted Reader',
    description: 'Read 25 Bible chapters',
    category: 'reading',
    icon: '📚',
    requirement: 25,
    xpReward: 300,
  },
  {
    id: 'read_100_chapters',
    title: 'Scripture Student',
    description: 'Read 100 Bible chapters',
    category: 'reading',
    icon: '📚',
    requirement: 100,
    xpReward: 1000,
  },
];

export const achievementsService = {
  /**
   * Get all achievements with current progress
   */
  async getAchievements(stats: {
    versesLearned: number;
    currentStreak: number;
    currentLevel: number;
    practiceSessionsCompleted: number;
    chaptersRead: number;
  }): Promise<Achievement[]> {
    const progress = await this.getAchievementProgress();

    return ALL_ACHIEVEMENTS.map((achievement) => {
      const savedProgress = progress[achievement.id];
      let currentProgress = 0;

      // Calculate current progress based on category
      switch (achievement.category) {
        case 'learning':
          currentProgress = stats.versesLearned;
          break;
        case 'streak':
          currentProgress = stats.currentStreak;
          break;
        case 'level':
          currentProgress = stats.currentLevel;
          break;
        case 'practice':
          currentProgress = stats.practiceSessionsCompleted;
          break;
        case 'reading':
          currentProgress = stats.chaptersRead;
          break;
      }

      const unlocked = savedProgress?.unlocked || currentProgress >= achievement.requirement;

      return {
        ...achievement,
        currentProgress,
        unlocked,
        unlockedAt: savedProgress?.unlockedAt,
      };
    });
  },

  /**
   * Check for newly unlocked achievements
   */
  async checkForNewAchievements(stats: {
    versesLearned: number;
    currentStreak: number;
    currentLevel: number;
    practiceSessionsCompleted: number;
    chaptersRead: number;
  }): Promise<Achievement[]> {
    const achievements = await this.getAchievements(stats);
    const progress = await this.getAchievementProgress();
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of achievements) {
      const wasUnlocked = progress[achievement.id]?.unlocked || false;
      const isNowUnlocked = achievement.currentProgress! >= achievement.requirement;

      if (!wasUnlocked && isNowUnlocked) {
        // This is a newly unlocked achievement!
        await this.unlockAchievement(achievement.id);
        newlyUnlocked.push(achievement);
        logger.log('[Achievements] Unlocked:', achievement.title);
      }
    }

    return newlyUnlocked;
  },

  /**
   * Unlock an achievement
   */
  async unlockAchievement(achievementId: string): Promise<void> {
    try {
      const progress = await this.getAchievementProgress();
      progress[achievementId] = {
        progress: progress[achievementId]?.progress || 0,
        unlocked: true,
        unlockedAt: Date.now(),
      };
      await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(progress));
      logger.log('[Achievements] Achievement unlocked:', achievementId);
    } catch (error) {
      logger.error('[Achievements] Error unlocking achievement:', error);
    }
  },

  /**
   * Get achievement progress data
   */
  async getAchievementProgress(): Promise<AchievementProgress> {
    try {
      const data = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      if (!data) return {};
      return JSON.parse(data);
    } catch (error) {
      logger.error('[Achievements] Error getting achievement progress:', error);
      return {};
    }
  },

  /**
   * Get unlocked achievements count
   */
  async getUnlockedCount(): Promise<number> {
    const progress = await this.getAchievementProgress();
    return Object.values(progress).filter((p) => p.unlocked).length;
  },

  /**
   * Get achievements by category
   */
  async getAchievementsByCategory(
    category: AchievementCategory,
    stats: {
      versesLearned: number;
      currentStreak: number;
      currentLevel: number;
      practiceSessionsCompleted: number;
      chaptersRead: number;
    }
  ): Promise<Achievement[]> {
    const achievements = await this.getAchievements(stats);
    return achievements.filter((a) => a.category === category);
  },

  /**
   * Get recent achievements (last 5 unlocked)
   */
  async getRecentAchievements(stats: {
    versesLearned: number;
    currentStreak: number;
    currentLevel: number;
    practiceSessionsCompleted: number;
    chaptersRead: number;
  }): Promise<Achievement[]> {
    const achievements = await this.getAchievements(stats);
    const unlocked = achievements
      .filter((a) => a.unlocked && a.unlockedAt)
      .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0));
    return unlocked.slice(0, 5);
  },

  /**
   * Clear all achievement progress (for testing)
   */
  async clearProgress(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ACHIEVEMENTS_KEY);
      logger.log('[Achievements] Progress cleared');
    } catch (error) {
      logger.error('[Achievements] Error clearing progress:', error);
    }
  },
};
