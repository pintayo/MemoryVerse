/**
 * Prayer Output Validator Service
 *
 * Validates AI-generated prayers to ensure they are:
 * - Biblical and appropriate
 * - Free from explicit content
 * - Theologically sound
 * - Helpful and encouraging
 */

import { logger } from '../utils/logger';

export interface OutputValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedOutput?: string;
}

// Words/phrases that should NEVER appear in a prayer
const FORBIDDEN_OUTPUT_WORDS = [
  // Explicit content
  'fuck', 'shit', 'damn it', 'hell yeah', 'goddamn', 'ass', 'bitch', 'bastard',
  // Violent content
  'kill', 'murder', 'destroy', 'hurt someone', 'violence', 'weapon',
  // Illegal activity
  'drugs', 'cocaine', 'heroin', 'steal', 'rob', 'illegal',
  // Inappropriate religious content
  'curse', 'hex', 'spell', 'demon worship', 'satan praise',
];

// Red flags that suggest non-biblical content
const SUSPICIOUS_OUTPUT_PATTERNS = [
  /go to hell/i,
  /god hates/i,
  /you deserve/i,
  /you are worthless/i,
  /give up/i,
  /there is no hope/i,
];

// Positive signals that indicate proper biblical prayer
const BIBLICAL_PRAYER_SIGNALS = [
  'lord', 'god', 'father', 'jesus', 'holy spirit', 'christ',
  'pray', 'prayer', 'amen', 'blessed', 'grace', 'mercy',
  'love', 'peace', 'hope', 'faith', 'strength', 'comfort',
  'forgive', 'guide', 'help', 'thank', 'praise', 'worship',
];

/**
 * Validates AI-generated prayer output
 */
export async function validatePrayerOutput(
  prayerText: string
): Promise<OutputValidationResult> {
  const trimmed = prayerText.trim();

  // 1. Check if empty
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Generated prayer is empty',
    };
  }

  // 2. Check for forbidden words
  const lowerText = trimmed.toLowerCase();
  for (const word of FORBIDDEN_OUTPUT_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      logger.warn('[PrayerOutputValidator] Forbidden word detected in output:', word);
      return {
        isValid: false,
        error: 'Generated prayer contains inappropriate content. Using fallback.',
      };
    }
  }

  // 3. Check for suspicious patterns
  for (const pattern of SUSPICIOUS_OUTPUT_PATTERNS) {
    if (pattern.test(trimmed)) {
      logger.warn('[PrayerOutputValidator] Suspicious pattern in output:', pattern.toString());
      return {
        isValid: false,
        error: 'Generated prayer contains concerning content. Using fallback.',
      };
    }
  }

  // 4. Verify it looks like a prayer (has biblical language)
  const hasPositiveSignals = BIBLICAL_PRAYER_SIGNALS.some(signal =>
    lowerText.includes(signal)
  );

  if (!hasPositiveSignals) {
    logger.warn('[PrayerOutputValidator] Output lacks biblical prayer language');
    return {
      isValid: false,
      error: 'Generated text does not appear to be a prayer. Using fallback.',
    };
  }

  // 5. Check length (prayers should be meaningful but not too long)
  if (trimmed.length < 50) {
    logger.warn('[PrayerOutputValidator] Prayer too short');
    return {
      isValid: false,
      error: 'Generated prayer is too short. Using fallback.',
    };
  }

  if (trimmed.length > 2000) {
    logger.warn('[PrayerOutputValidator] Prayer too long');
    return {
      isValid: false,
      error: 'Generated prayer is too long. Using fallback.',
    };
  }

  // All checks passed!
  return {
    isValid: true,
    sanitizedOutput: trimmed,
  };
}

/**
 * Helper to check if prayer has appropriate tone
 */
export function hasAppropriateChristianTone(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Check for positive Christian themes
  const positiveThemes = [
    'love', 'grace', 'mercy', 'forgiveness', 'hope', 'peace',
    'strength', 'comfort', 'guidance', 'blessing', 'faith',
  ];

  const positiveCount = positiveThemes.filter(theme =>
    lowerText.includes(theme)
  ).length;

  // Prayer should have at least 2 positive themes
  return positiveCount >= 2;
}

/**
 * Log inappropriate AI output for monitoring
 */
export async function logInappropriateOutput(
  userInput: string,
  aiOutput: string,
  reason: string
): Promise<void> {
  try {
    logger.error('[PrayerOutputValidator] Inappropriate AI output detected', {
      reason,
      inputLength: userInput.length,
      outputLength: aiOutput.length,
      timestamp: new Date().toISOString(),
    });

    // TODO: Store in database for monitoring
    // This helps identify if AI is generating problematic content
  } catch (error) {
    logger.error('[PrayerOutputValidator] Error logging inappropriate output', error);
  }
}

logger.log('[prayerOutputValidator] Module loaded');
