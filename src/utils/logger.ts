/**
 * Production-Ready Logger
 * Only logs in development mode, silent in production
 * Sends errors to Sentry in production
 */

import { ENABLE_NATIVE_MODULES } from '../config/nativeModules';

const isDevelopment = __DEV__;

// Try to load Sentry (only in production builds, not Expo Go)
let Sentry: any = null;
let sentryInitialized = false;

if (ENABLE_NATIVE_MODULES) {
  try {
    Sentry = require('@sentry/react-native');
    sentryInitialized = !!Sentry;
  } catch (e) {
    sentryInitialized = false;
  }
}

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
    } else if (sentryInitialized) {
      // Send warnings to Sentry in production
      Sentry.captureMessage(args.join(' '), 'warning');
    }
  },

  /**
   * Log error messages (always logged, even in production)
   * In production, these are sent to Sentry
   */
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    } else {
      console.error('[PRODUCTION ERROR]', ...args);

      if (sentryInitialized) {
        // Extract error object if present
        const errorObj = args.find(arg => arg instanceof Error);
        if (errorObj) {
          Sentry.captureException(errorObj, {
            extra: {
              context: args.filter(arg => !(arg instanceof Error)).join(' '),
            },
          });
        } else {
          // If no error object, send as message
          Sentry.captureMessage(args.join(' '), 'error');
        }
      }
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
