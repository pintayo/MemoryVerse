/**
 * Prayer Input Validator Service
 *
 * Validates and sanitizes user input before sending to AI for prayer generation.
 * Prevents abuse, inappropriate content, and prompt injection attacks.
 *
 * PRIORITY: #1 - MUST IMPLEMENT BEFORE PRODUCTION
 */

import { logger } from '../utils/logger';

// Configuration
const CONFIG = {
  MIN_LENGTH: 10,           // Minimum characters
  MAX_LENGTH: 1000,         // Maximum characters
  MAX_REQUESTS_PER_DAY: 20, // Safety limit per user
  BLOCKED_WORDS: [
    // Only block extreme offensive content and illegal activity
    // Normal swear words (fuck, shit, damn) are OK - people are sharing their real struggles
    'nazi', 'hitler', 'terrorist', 'bomb', 'kill myself', 'suicide',
    'rape', 'molest', 'abuse children',
    // Add more as needed - keep this list updated
  ],
  SUSPICIOUS_PATTERNS: [
    // Prompt injection attempts
    /ignore previous instructions/i,
    /disregard all/i,
    /system prompt/i,
    /you are now/i,
    /act as if/i,
    /pretend to be/i,
    /roleplay/i,

    // Attempts to bypass filters
    /\[INST\]/i,
    /<\|im_start\|>/i,
    /###/,
    /<prompt>/i,

    // Non-prayer content
    /write code/i,
    /create a script/i,
    /sql injection/i,
    /hack/i,
  ],
};

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedInput?: string;
  violationType?: 'length' | 'blocked_word' | 'suspicious_pattern' | 'rate_limit' | 'empty';
}

/**
 * Validates prayer input before sending to AI
 */
export async function validatePrayerInput(
  input: string,
  userId: string,
  requestCountToday: number
): Promise<ValidationResult> {
  // 1. Check if empty or whitespace only
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Please share something about your day.',
      violationType: 'empty',
    };
  }

  // 2. Check length
  if (trimmed.length < CONFIG.MIN_LENGTH) {
    return {
      isValid: false,
      error: `Please share a bit more (at least ${CONFIG.MIN_LENGTH} characters).`,
      violationType: 'length',
    };
  }

  if (trimmed.length > CONFIG.MAX_LENGTH) {
    return {
      isValid: false,
      error: `Your input is too long. Please keep it under ${CONFIG.MAX_LENGTH} characters.`,
      violationType: 'length',
    };
  }

  // 3. Rate limiting check
  if (requestCountToday >= CONFIG.MAX_REQUESTS_PER_DAY) {
    logger.warn('[PrayerValidator] Rate limit exceeded', { userId, count: requestCountToday });
    return {
      isValid: false,
      error: 'You\'ve reached the daily limit for prayer generation. Please try again tomorrow.',
      violationType: 'rate_limit',
    };
  }

  // 4. Check for blocked words
  const lowerInput = trimmed.toLowerCase();
  for (const word of CONFIG.BLOCKED_WORDS) {
    if (lowerInput.includes(word)) {
      logger.warn('[PrayerValidator] Blocked word detected', { userId, word });
      return {
        isValid: false,
        error: 'Your input contains inappropriate content. Please share something appropriate for prayer.',
        violationType: 'blocked_word',
      };
    }
  }

  // 5. Check for suspicious patterns (prompt injection, etc.)
  for (const pattern of CONFIG.SUSPICIOUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      logger.warn('[PrayerValidator] Suspicious pattern detected', { userId, pattern: pattern.toString() });
      return {
        isValid: false,
        error: 'Your input seems unusual. Please share naturally about your day.',
        violationType: 'suspicious_pattern',
      };
    }
  }

  // 6. Basic sanitization (remove special unicode, control characters)
  const sanitized = sanitizeInput(trimmed);

  // 7. Content validation - ensure it's prayer-appropriate
  const contentCheck = validatePrayerContent(sanitized);
  if (!contentCheck.isValid) {
    return contentCheck;
  }

  // All checks passed!
  return {
    isValid: true,
    sanitizedInput: sanitized,
  };
}

/**
 * Sanitizes input by removing potentially problematic characters
 */
function sanitizeInput(input: string): string {
  return input
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Trim
    .trim();
}

/**
 * Validates that content is appropriate for prayer generation
 */
function validatePrayerContent(input: string): ValidationResult {
  const lowerInput = input.toLowerCase();

  // Check if it looks like a prayer request (positive signals)
  const prayerKeywords = [
    'today', 'day', 'pray', 'help', 'thank', 'grateful', 'blessed',
    'struggling', 'worried', 'anxious', 'happy', 'sad', 'tired',
    'family', 'friend', 'work', 'school', 'health', 'relationship',
    'god', 'jesus', 'lord', 'father', 'spirit',
  ];

  const hasPositiveSignal = prayerKeywords.some(keyword => lowerInput.includes(keyword));

  // Check for clear non-prayer content
  const nonPrayerSignals = [
    'write a function',
    'create a program',
    'solve this problem',
    'calculate',
    'translate to',
    'summarize this',
  ];

  const hasNegativeSignal = nonPrayerSignals.some(signal => lowerInput.includes(signal));

  if (hasNegativeSignal) {
    logger.warn('[PrayerValidator] Non-prayer content detected');
    return {
      isValid: false,
      error: 'This feature is for sharing about your day and receiving prayer. Please share something personal.',
      violationType: 'suspicious_pattern',
    };
  }

  // If it's very short and has no positive signals, it might be random text
  if (input.length < 50 && !hasPositiveSignal) {
    logger.info('[PrayerValidator] Short input with no prayer context');
    return {
      isValid: false,
      error: 'Please share more about your day so we can create a meaningful prayer.',
      violationType: 'length',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Tracks abuse attempts for monitoring
 */
export async function logAbuseAttempt(
  userId: string,
  input: string,
  violationType: string
): Promise<void> {
  try {
    logger.warn('[PrayerValidator] Abuse attempt logged', {
      userId,
      violationType,
      inputLength: input.length,
      timestamp: new Date().toISOString(),
    });

    // TODO: In production, store this in database for monitoring
    // Could create an 'abuse_logs' table to track patterns
    // await supabase.from('abuse_logs').insert({
    //   user_id: userId,
    //   feature: 'prayer_generation',
    //   violation_type: violationType,
    //   input_length: input.length,
    //   created_at: new Date().toISOString(),
    // });
  } catch (error) {
    logger.error('[PrayerValidator] Error logging abuse attempt', error);
  }
}

/**
 * Gets the number of prayer requests made today by user
 * Used for rate limiting
 *
 * NOTE: This function is deprecated. Rate limiting is now handled by usageLimitsService.
 * Returning 0 always since the real usage tracking is done via usageLimitsService RPC functions.
 */
export async function getTodayRequestCount(userId: string): Promise<number> {
  // Rate limiting is now handled by usageLimitsService using RPC functions
  // This function is kept for backward compatibility but always returns 0
  // The actual usage checks happen in usageLimitsService.checkAndIncrementUsage()
  logger.log('[PrayerValidator] getTodayRequestCount called (deprecated, returning 0)');
  return 0;
}

/**
 * Helper to check if input looks like spam
 */
function isSpam(input: string): boolean {
  // Check for repeated characters (e.g., "aaaaaaaaaaa")
  if (/(.)\1{10,}/.test(input)) {
    return true;
  }

  // Check for excessive capitalization
  const capsRatio = (input.match(/[A-Z]/g) || []).length / input.length;
  if (capsRatio > 0.7 && input.length > 50) {
    return true;
  }

  // Check for excessive punctuation
  const punctRatio = (input.match(/[!?.]{3,}/g) || []).length / input.length;
  if (punctRatio > 0.3) {
    return true;
  }

  return false;
}

logger.log('[prayerInputValidator] Module loaded');
