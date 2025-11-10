/**
 * Error Handler Utility
 *
 * Comprehensive error handling with:
 * - User-friendly error messages
 * - Error logging to Sentry and Analytics
 * - Retry functionality
 * - Network error detection
 * - Offline mode handling
 */

import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as Sentry from '@sentry/react-native';
import { logger } from './logger';
import { analyticsService } from '../services/analyticsService';

export interface ErrorHandlerOptions {
  showAlert?: boolean; // Show alert to user (default: true)
  logToSentry?: boolean; // Log to Sentry (default: true)
  logToAnalytics?: boolean; // Log to Analytics (default: true)
  screen?: string; // Screen where error occurred
  retryable?: boolean; // Can user retry? (default: false)
  onRetry?: () => void | Promise<void>; // Retry callback
  customMessage?: string; // Custom user-facing message
}

export enum ErrorType {
  NETWORK = 'network',
  API = 'api',
  AUTH = 'auth',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown',
  TIMEOUT = 'timeout',
  OFFLINE = 'offline',
}

export interface AppError extends Error {
  type: ErrorType;
  statusCode?: number;
  endpoint?: string;
  originalError?: Error;
}

class ErrorHandler {
  /**
   * Check if device is online
   */
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  /**
   * Classify error type
   */
  classifyError(error: any): ErrorType {
    // Check if offline
    if (error.message?.includes('Network request failed')) {
      return ErrorType.NETWORK;
    }

    // Check for timeout
    if (error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
      return ErrorType.TIMEOUT;
    }

    // Check for API errors
    if (error.response || error.statusCode) {
      const statusCode = error.response?.status || error.statusCode;
      if (statusCode === 401 || statusCode === 403) {
        return ErrorType.AUTH;
      }
      return ErrorType.API;
    }

    // Check for validation errors
    if (error.name === 'ValidationError' || error.message?.includes('validation')) {
      return ErrorType.VALIDATION;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: any, type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'Unable to connect to the server. Please check your internet connection and try again.';

      case ErrorType.OFFLINE:
        return 'You are currently offline. Please connect to the internet to continue.';

      case ErrorType.TIMEOUT:
        return 'The request took too long. Please try again.';

      case ErrorType.AUTH:
        return 'Your session has expired. Please sign in again.';

      case ErrorType.VALIDATION:
        return error.message || 'Please check your input and try again.';

      case ErrorType.API:
        const statusCode = error.response?.status || error.statusCode;
        if (statusCode === 404) {
          return 'The requested resource was not found.';
        }
        if (statusCode === 500) {
          return 'A server error occurred. Please try again later.';
        }
        return error.response?.data?.message || error.message || 'An error occurred. Please try again.';

      case ErrorType.UNKNOWN:
      default:
        return error.message || 'Something went wrong. Please try again.';
    }
  }

  /**
   * Handle error with full logging and user feedback
   */
  async handleError(error: any, options: ErrorHandlerOptions = {}): Promise<void> {
    const {
      showAlert = true,
      logToSentry = true,
      logToAnalytics = true,
      screen,
      retryable = false,
      onRetry,
      customMessage,
    } = options;

    // Check if online
    const isOnline = await this.isOnline();
    const errorType = isOnline ? this.classifyError(error) : ErrorType.OFFLINE;

    // Get user-friendly message
    const userMessage = customMessage || this.getUserFriendlyMessage(error, errorType);

    // Log to console
    logger.error(`[ErrorHandler] ${errorType} error${screen ? ` on ${screen}` : ''}:`, error);

    // Log to Sentry
    if (logToSentry && errorType !== ErrorType.OFFLINE) {
      try {
        Sentry.captureException(error, {
          tags: {
            error_type: errorType,
            screen: screen || 'unknown',
          },
          extra: {
            statusCode: error.response?.status || error.statusCode,
            endpoint: error.config?.url || error.endpoint,
          },
        });
      } catch (sentryError) {
        logger.error('[ErrorHandler] Failed to log to Sentry:', sentryError);
      }
    }

    // Log to Analytics
    if (logToAnalytics) {
      try {
        if (errorType === ErrorType.API) {
          await analyticsService.logAPIError(
            error.config?.url || error.endpoint || 'unknown',
            error.response?.status || error.statusCode || 0,
            error.message
          );
        } else {
          await analyticsService.logError(
            error.message || 'Unknown error',
            error.stack,
            screen
          );
        }
      } catch (analyticsError) {
        logger.error('[ErrorHandler] Failed to log to Analytics:', analyticsError);
      }
    }

    // Show alert to user
    if (showAlert) {
      const buttons = [];

      // Add retry button if retryable
      if (retryable && onRetry) {
        buttons.push({
          text: 'Retry',
          onPress: async () => {
            try {
              await onRetry();
            } catch (retryError) {
              // Handle retry error
              this.handleError(retryError, { ...options, retryable: false });
            }
          },
        });
      }

      // Add OK button
      buttons.push({
        text: retryable ? 'Cancel' : 'OK',
        style: 'cancel' as const,
      });

      Alert.alert(
        this.getAlertTitle(errorType),
        userMessage,
        buttons
      );
    }
  }

  /**
   * Get alert title based on error type
   */
  getAlertTitle(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'Connection Error';
      case ErrorType.OFFLINE:
        return 'No Internet Connection';
      case ErrorType.TIMEOUT:
        return 'Request Timeout';
      case ErrorType.AUTH:
        return 'Authentication Error';
      case ErrorType.VALIDATION:
        return 'Validation Error';
      case ErrorType.API:
        return 'Server Error';
      default:
        return 'Error';
    }
  }

  /**
   * Wrap an async function with error handling
   */
  async wrapAsync<T>(
    fn: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      await this.handleError(error, options);
      return null;
    }
  }

  /**
   * Show a simple error alert
   */
  showError(message: string, title: string = 'Error'): void {
    Alert.alert(title, message, [{ text: 'OK' }]);
  }

  /**
   * Show a success message
   */
  showSuccess(message: string, title: string = 'Success'): void {
    Alert.alert(title, message, [{ text: 'OK' }]);
  }

  /**
   * Show a confirmation dialog
   */
  showConfirmation(
    message: string,
    onConfirm: () => void,
    title: string = 'Confirm',
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ): void {
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, style: 'cancel' },
        { text: confirmText, onPress: onConfirm },
      ]
    );
  }

  /**
   * Create a safe API call wrapper
   */
  async safeApiCall<T>(
    apiCall: () => Promise<T>,
    screen?: string,
    customErrorMessage?: string
  ): Promise<T | null> {
    // Check if online first
    const isOnline = await this.isOnline();
    if (!isOnline) {
      await this.handleError(
        new Error('No internet connection'),
        {
          screen,
          customMessage: customErrorMessage,
          retryable: true,
          onRetry: () => this.safeApiCall(apiCall, screen, customErrorMessage),
        }
      );
      return null;
    }

    return this.wrapAsync(apiCall, {
      screen,
      customMessage: customErrorMessage,
      retryable: true,
      onRetry: () => this.safeApiCall(apiCall, screen, customErrorMessage),
    });
  }
}

export const errorHandler = new ErrorHandler();
export default errorHandler;
