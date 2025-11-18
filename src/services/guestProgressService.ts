/**
 * Guest Progress Service
 *
 * Manages prompts for guest users to save their progress
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const SHOW_SAVE_PROGRESS_KEY = 'show_save_progress_prompt';

export const guestProgressService = {
  /**
   * Check if we should show the save progress prompt
   */
  async shouldShowPrompt(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(SHOW_SAVE_PROGRESS_KEY);
      // Show by default if not set, or if explicitly set to 'true'
      return value !== 'false';
    } catch (error) {
      logger.error('[GuestProgress] Error checking prompt preference:', error);
      return true; // Default to showing
    }
  },

  /**
   * Disable the save progress prompt
   */
  async disablePrompt(): Promise<void> {
    try {
      await AsyncStorage.setItem(SHOW_SAVE_PROGRESS_KEY, 'false');
      logger.log('[GuestProgress] Save progress prompt disabled');
    } catch (error) {
      logger.error('[GuestProgress] Error disabling prompt:', error);
    }
  },

  /**
   * Re-enable the save progress prompt (e.g., after logout)
   */
  async enablePrompt(): Promise<void> {
    try {
      await AsyncStorage.setItem(SHOW_SAVE_PROGRESS_KEY, 'true');
      logger.log('[GuestProgress] Save progress prompt enabled');
    } catch (error) {
      logger.error('[GuestProgress] Error enabling prompt:', error);
    }
  },

  /**
   * Clear all preferences (useful for testing)
   */
  async clearPreferences(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SHOW_SAVE_PROGRESS_KEY);
      logger.log('[GuestProgress] Preferences cleared');
    } catch (error) {
      logger.error('[GuestProgress] Error clearing preferences:', error);
    }
  },
};
