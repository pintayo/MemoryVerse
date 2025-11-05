/**
 * Production-Ready Logger
 * Only logs in development mode, silent in production
 */

const isDevelopment = __DEV__;

export const logger = {
  /**
   * Log info messages (only in development)
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log info messages (only in development)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Log warning messages (only in development)
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log error messages (always logged, even in production)
   * In production, these should be sent to error tracking service
   */
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, send to error tracking service (Sentry, etc.)
      // For now, just use console.error but in real production you'd send to a service
      console.error('[PRODUCTION ERROR]', ...args);
    }
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};
