/**
 * Push Notification Service
 * Manages local push notifications for daily Bible verse practice reminders
 * Uses expo-notifications for cross-platform support
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

export interface NotificationSettings {
  enabled: boolean;
  dailyReminderTime: string; // Format: "HH:MM" (24-hour)
  frequency: 'daily' | 'weekdays' | 'custom';
  customDays?: number[]; // 0-6 for Sunday-Saturday
  motivationalQuotes: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  dailyReminderTime: '09:00', // 9 AM by default
  frequency: 'daily',
  motivationalQuotes: true,
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  /**
   * Request permission to send notifications
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.warn('[NotificationService] Push notification permission denied');
        return false;
      }

      logger.log('[NotificationService] Push notification permission granted');

      // For Android, configure notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('daily-reminders', {
          name: 'Daily Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D4A574', // theme.colors.secondary.lightGold
          sound: 'default',
        });
      }

      return true;
    } catch (error) {
      logger.error('[NotificationService] Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Schedule a daily reminder notification
   */
  async scheduleDailyReminder(settings: NotificationSettings): Promise<string | null> {
    try {
      // Parse time
      const [hours, minutes] = settings.dailyReminderTime.split(':').map(Number);

      // Get motivational message
      const message = settings.motivationalQuotes
        ? this.getMotivationalMessage()
        : 'Time to practice your verses!';

      // Calculate trigger based on frequency
      let trigger;
      if (settings.frequency === 'daily') {
        trigger = {
          hour: hours,
          minute: minutes,
          repeats: true,
        };
      } else if (settings.frequency === 'weekdays') {
        // Schedule for Monday-Friday (1-5)
        trigger = {
          hour: hours,
          minute: minutes,
          weekday: 2, // This will need to be scheduled 5 times (Mon-Fri)
          repeats: true,
        };
      } else if (settings.frequency === 'custom' && settings.customDays) {
        // Schedule for custom days
        trigger = {
          hour: hours,
          minute: minutes,
          weekday: settings.customDays[0] + 1, // expo-notifications uses 1-7 for Sun-Sat
          repeats: true,
        };
      } else {
        trigger = {
          hour: hours,
          minute: minutes,
          repeats: true,
        };
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📖 Daily Verse Practice',
          body: message,
          sound: 'default',
          data: { screen: 'Home' },
        },
        trigger,
      });

      logger.log('[NotificationService] Daily reminder scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      logger.error('[NotificationService] Error scheduling daily reminder:', error);
      return null;
    }
  }

  /**
   * Schedule multiple notifications for weekdays or custom days
   */
  async scheduleMultipleDailyReminders(settings: NotificationSettings): Promise<string[]> {
    const ids: string[] = [];

    try {
      const [hours, minutes] = settings.dailyReminderTime.split(':').map(Number);
      const message = settings.motivationalQuotes
        ? this.getMotivationalMessage()
        : 'Time to practice your verses!';

      let daysToSchedule: number[] = [];

      if (settings.frequency === 'weekdays') {
        daysToSchedule = [2, 3, 4, 5, 6]; // Mon-Fri (expo-notifications uses 1-7 for Sun-Sat)
      } else if (settings.frequency === 'custom' && settings.customDays) {
        daysToSchedule = settings.customDays.map(d => d + 1); // Convert 0-6 to 1-7
      }

      for (const weekday of daysToSchedule) {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '📖 Daily Verse Practice',
            body: message,
            sound: 'default',
            data: { screen: 'Home' },
          },
          trigger: {
            hour: hours,
            minute: minutes,
            weekday,
            repeats: true,
          },
        });
        ids.push(notificationId);
      }

      logger.log(`[NotificationService] Scheduled ${ids.length} notifications`);
      return ids;
    } catch (error) {
      logger.error('[NotificationService] Error scheduling multiple reminders:', error);
      return ids;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      logger.log('[NotificationService] All notifications cancelled');
    } catch (error) {
      logger.error('[NotificationService] Error cancelling notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      logger.log(`[NotificationService] ${notifications.length} scheduled notifications`);
      return notifications;
    } catch (error) {
      logger.error('[NotificationService] Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Save notification settings to storage
   */
  async saveSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
      logger.log('[NotificationService] Settings saved');
    } catch (error) {
      logger.error('[NotificationService] Error saving settings:', error);
    }
  }

  /**
   * Load notification settings from storage
   */
  async loadSettings(): Promise<NotificationSettings> {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      logger.error('[NotificationService] Error loading settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Update notification schedule
   */
  async updateSchedule(settings: NotificationSettings): Promise<boolean> {
    try {
      // Cancel existing notifications
      await this.cancelAllNotifications();

      // If disabled, just save settings and return
      if (!settings.enabled) {
        await this.saveSettings(settings);
        logger.log('[NotificationService] Notifications disabled');
        return true;
      }

      // Check permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        logger.warn('[NotificationService] Cannot schedule - no permission');
        return false;
      }

      // Schedule new notifications
      if (settings.frequency === 'daily') {
        const id = await this.scheduleDailyReminder(settings);
        if (!id) return false;
      } else {
        const ids = await this.scheduleMultipleDailyReminders(settings);
        if (ids.length === 0) return false;
      }

      // Save settings
      await this.saveSettings(settings);
      logger.log('[NotificationService] Schedule updated successfully');
      return true;
    } catch (error) {
      logger.error('[NotificationService] Error updating schedule:', error);
      return false;
    }
  }

  /**
   * Send an immediate test notification
   */
  async sendTestNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📖 Daily Verse Practice',
          body: this.getMotivationalMessage(),
          sound: 'default',
          data: { screen: 'Home' },
        },
        trigger: {
          seconds: 1,
        },
      });
      logger.log('[NotificationService] Test notification sent');
    } catch (error) {
      logger.error('[NotificationService] Error sending test notification:', error);
    }
  }

  /**
   * Get a random motivational message
   */
  private getMotivationalMessage(): string {
    const messages = [
      'Time to strengthen your faith! Practice your verses today. 🙏',
      'Your daily dose of Scripture awaits! Let\'s memorize together. ✨',
      'Keep your streak alive! Time for verse practice. 🔥',
      'God\'s Word is alive and active. Let\'s study today! 📖',
      'Building your spiritual foundation, one verse at a time. 💪',
      'Don\'t break your streak! Your verses are waiting. ⭐',
      'Hide God\'s Word in your heart. Practice time! ❤️',
      'The best time to practice was yesterday. The next best time is now! 🌟',
      'Your future self will thank you. Let\'s practice! 🎯',
      'Stay consistent! Time for your daily verse practice. 🌿',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Handle notification tap (navigate to appropriate screen)
   */
  async handleNotificationResponse(
    response: Notifications.NotificationResponse,
    navigation: any
  ): Promise<void> {
    try {
      const screen = response.notification.request.content.data?.screen;
      if (screen && navigation) {
        navigation.navigate(screen);
      }
    } catch (error) {
      logger.error('[NotificationService] Error handling notification response:', error);
    }
  }

  /**
   * Check if notifications are enabled in settings
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      logger.error('[NotificationService] Error checking notification status:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

logger.log('[notificationService] Module loaded');
