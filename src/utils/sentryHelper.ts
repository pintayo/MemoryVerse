/**
 * Sentry Helper Utilities
 * Enhanced error tracking with user context, breadcrumbs, and tags
 */

import { ENABLE_NATIVE_MODULES } from '../config/nativeModules';
import { logger } from './logger';

// Try to load Sentry (only in production builds, not Expo Go)
let Sentry: any = null;

if (ENABLE_NATIVE_MODULES) {
  try {
    Sentry = require('@sentry/react-native');
  } catch (error) {
    // Sentry not available
  }
}

/**
 * Set user context in Sentry
 * Call this after user logs in
 */
export const setSentryUser = (userId: string, email?: string, username?: string) => {
  if (!Sentry) return;
  try {
    Sentry.setUser({
      id: userId,
      email: email,
      username: username,
    });
    logger.log('[Sentry] User context set:', userId);
  } catch (error) {
    logger.warn('[Sentry] Failed to set user context:', error);
  }
};

/**
 * Clear user context in Sentry
 * Call this after user logs out
 */
export const clearSentryUser = () => {
  if (!Sentry) return;
  try {
    Sentry.setUser(null);
    logger.log('[Sentry] User context cleared');
  } catch (error) {
    logger.warn('[Sentry] Failed to clear user context:', error);
  }
};

/**
 * Add breadcrumb for navigation
 */
export const addNavigationBreadcrumb = (screenName: string, params?: any) => {
  if (!Sentry) return;
  try {
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Navigated to ${screenName}`,
      level: 'info',
      data: params,
    });
  } catch (error) {
    logger.warn('[Sentry] Failed to add navigation breadcrumb:', error);
  }
};

/**
 * Add breadcrumb for user actions
 */
export const addActionBreadcrumb = (action: string, data?: any) => {
  if (!Sentry) return;
  try {
    Sentry.addBreadcrumb({
      category: 'user-action',
      message: action,
      level: 'info',
      data,
    });
  } catch (error) {
    logger.warn('[Sentry] Failed to add action breadcrumb:', error);
  }
};

/**
 * Add breadcrumb for API calls
 */
export const addAPIBreadcrumb = (
  method: string,
  url: string,
  status?: number,
  data?: any
) => {
  if (!Sentry) return;
  try {
    Sentry.addBreadcrumb({
      category: 'http',
      type: 'http',
      message: `${method} ${url}`,
      level: status && status >= 400 ? 'error' : 'info',
      data: {
        method,
        url,
        status_code: status,
        ...data,
      },
    });
  } catch (error) {
    logger.warn('[Sentry] Failed to add API breadcrumb:', error);
  }
};

/**
 * Add breadcrumb for database operations
 */
export const addDatabaseBreadcrumb = (
  operation: string,
  table: string,
  success: boolean,
  data?: any
) => {
  if (!Sentry) return;
  try {
    Sentry.addBreadcrumb({
      category: 'database',
      message: `${operation} ${table}`,
      level: success ? 'info' : 'error',
      data: {
        operation,
        table,
        success,
        ...data,
      },
    });
  } catch (error) {
    logger.warn('[Sentry] Failed to add database breadcrumb:', error);
  }
};

/**
 * Set custom tags for better error categorization
 */
export const setSentryTag = (key: string, value: string) => {
  if (!Sentry) return;
  try {
    Sentry.setTag(key, value);
  } catch (error) {
    logger.warn('[Sentry] Failed to set tag:', error);
  }
};

/**
 * Set custom context for an error
 */
export const setSentryContext = (key: string, context: { [key: string]: any }) => {
  if (!Sentry) return;
  try {
    Sentry.setContext(key, context);
  } catch (error) {
    logger.warn('[Sentry] Failed to set context:', error);
  }
};

/**
 * Capture exception with enhanced context
 */
export const captureException = (
  error: Error,
  context?: {
    tags?: { [key: string]: string };
    extra?: { [key: string]: any };
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  }
) => {
  if (!Sentry) return;
  try {
    Sentry.withScope((scope) => {
      // Set level
      if (context?.level) {
        scope.setLevel(context.level);
      }

      // Set tags
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      // Set extra context
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      // Capture the exception
      Sentry.captureException(error);
    });

    logger.log('[Sentry] Exception captured with context');
  } catch (err) {
    logger.warn('[Sentry] Failed to capture exception:', err);
  }
};

/**
 * Capture message with enhanced context
 */
export const captureMessage = (
  message: string,
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug',
  context?: {
    tags?: { [key: string]: string };
    extra?: { [key: string]: any };
  }
) => {
  if (!Sentry) return;
  try {
    Sentry.withScope((scope) => {
      // Set level
      if (level) {
        scope.setLevel(level);
      }

      // Set tags
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      // Set extra context
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      // Capture the message
      Sentry.captureMessage(message, level);
    });

    logger.log('[Sentry] Message captured with context');
  } catch (err) {
    logger.warn('[Sentry] Failed to capture message:', err);
  }
};

/**
 * Track performance
 */
export const startTransaction = (name: string, operation: string) => {
  if (!Sentry) return null;
  try {
    return Sentry.startTransaction({
      name,
      op: operation,
    });
  } catch (error) {
    logger.warn('[Sentry] Failed to start transaction:', error);
    return null;
  }
};

/**
 * Common error handlers with enhanced tracking
 */
export const errorHandlers = {
  /**
   * Handle authentication errors
   */
  handleAuthError: (error: Error, action: string) => {
    captureException(error, {
      tags: {
        error_type: 'authentication',
        action,
      },
      level: 'error',
    });
  },

  /**
   * Handle API errors
   */
  handleAPIError: (error: Error, endpoint: string, method: string) => {
    captureException(error, {
      tags: {
        error_type: 'api',
        endpoint,
        method,
      },
      level: 'error',
    });
  },

  /**
   * Handle database errors
   */
  handleDatabaseError: (error: Error, operation: string, table: string) => {
    captureException(error, {
      tags: {
        error_type: 'database',
        operation,
        table,
      },
      level: 'error',
    });
  },

  /**
   * Handle verse loading errors
   */
  handleVerseError: (error: Error, verseId?: string) => {
    captureException(error, {
      tags: {
        error_type: 'verse',
        feature: 'verse_loading',
      },
      extra: {
        verse_id: verseId,
      },
      level: 'error',
    });
  },

  /**
   * Handle practice session errors
   */
  handlePracticeError: (error: Error, sessionType: string) => {
    captureException(error, {
      tags: {
        error_type: 'practice',
        session_type: sessionType,
      },
      level: 'error',
    });
  },

  /**
   * Handle AI context generation errors
   */
  handleAIError: (error: Error, provider: string, verseId?: string) => {
    captureException(error, {
      tags: {
        error_type: 'ai',
        provider,
      },
      extra: {
        verse_id: verseId,
      },
      level: 'warning', // AI errors are less critical
    });
  },
};

logger.log('[sentryHelper] Module loaded');
