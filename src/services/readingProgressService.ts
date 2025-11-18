/**
 * Reading Progress Service
 *
 * Manages Bible reading bookmarks and chapter completion tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const BOOKMARK_KEY = 'bible_reading_bookmark';
const READING_PROGRESS_KEY = 'bible_reading_progress';

export interface ReadingBookmark {
  book: string;
  chapter: number;
  timestamp: number;
}

export interface ReadingProgress {
  [bookChapterKey: string]: {
    completed: boolean;
    timestamp: number;
  };
}

export const readingProgressService = {
  /**
   * Save a bookmark for current reading position
   */
  async saveBookmark(book: string, chapter: number): Promise<void> {
    try {
      const bookmark: ReadingBookmark = {
        book,
        chapter,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmark));
      logger.log('[ReadingProgress] Bookmark saved:', book, chapter);
    } catch (error) {
      logger.error('[ReadingProgress] Error saving bookmark:', error);
    }
  },

  /**
   * Get the current reading bookmark
   */
  async getBookmark(): Promise<ReadingBookmark | null> {
    try {
      const data = await AsyncStorage.getItem(BOOKMARK_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      logger.error('[ReadingProgress] Error getting bookmark:', error);
      return null;
    }
  },

  /**
   * Clear the current bookmark
   */
  async clearBookmark(): Promise<void> {
    try {
      await AsyncStorage.removeItem(BOOKMARK_KEY);
      logger.log('[ReadingProgress] Bookmark cleared');
    } catch (error) {
      logger.error('[ReadingProgress] Error clearing bookmark:', error);
    }
  },

  /**
   * Mark a chapter as read
   */
  async markChapterRead(book: string, chapter: number): Promise<void> {
    try {
      const progress = await this.getReadingProgress();
      const key = `${book}_${chapter}`;

      progress[key] = {
        completed: true,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(progress));
      logger.log('[ReadingProgress] Chapter marked as read:', book, chapter);
    } catch (error) {
      logger.error('[ReadingProgress] Error marking chapter read:', error);
    }
  },

  /**
   * Check if a chapter has been read
   */
  async isChapterRead(book: string, chapter: number): Promise<boolean> {
    try {
      const progress = await this.getReadingProgress();
      const key = `${book}_${chapter}`;
      return progress[key]?.completed || false;
    } catch (error) {
      logger.error('[ReadingProgress] Error checking chapter read status:', error);
      return false;
    }
  },

  /**
   * Get all reading progress
   */
  async getReadingProgress(): Promise<ReadingProgress> {
    try {
      const data = await AsyncStorage.getItem(READING_PROGRESS_KEY);
      if (!data) return {};
      return JSON.parse(data);
    } catch (error) {
      logger.error('[ReadingProgress] Error getting reading progress:', error);
      return {};
    }
  },

  /**
   * Get chapters read for a specific book
   */
  async getBookProgress(book: string): Promise<number[]> {
    try {
      const progress = await this.getReadingProgress();
      const chaptersRead: number[] = [];

      Object.keys(progress).forEach((key) => {
        if (key.startsWith(`${book}_`) && progress[key].completed) {
          const chapter = parseInt(key.split('_')[1], 10);
          if (!isNaN(chapter)) {
            chaptersRead.push(chapter);
          }
        }
      });

      return chaptersRead.sort((a, b) => a - b);
    } catch (error) {
      logger.error('[ReadingProgress] Error getting book progress:', error);
      return [];
    }
  },

  /**
   * Get reading statistics
   */
  async getReadingStats(): Promise<{
    totalChaptersRead: number;
    booksStarted: number;
  }> {
    try {
      const progress = await this.getReadingProgress();
      const totalChaptersRead = Object.keys(progress).length;

      const booksSet = new Set<string>();
      Object.keys(progress).forEach((key) => {
        const book = key.split('_')[0];
        booksSet.add(book);
      });

      return {
        totalChaptersRead,
        booksStarted: booksSet.size,
      };
    } catch (error) {
      logger.error('[ReadingProgress] Error getting reading stats:', error);
      return { totalChaptersRead: 0, booksStarted: 0 };
    }
  },

  /**
   * Clear all reading progress (useful for testing)
   */
  async clearAllProgress(): Promise<void> {
    try {
      await AsyncStorage.removeItem(READING_PROGRESS_KEY);
      logger.log('[ReadingProgress] All progress cleared');
    } catch (error) {
      logger.error('[ReadingProgress] Error clearing progress:', error);
    }
  },
};
