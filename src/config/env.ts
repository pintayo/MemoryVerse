/**
 * Environment Configuration
 * Centralized access to environment variables
 */

import Constants from 'expo-constants';

const env = Constants.expoConfig?.extra || {};

export const config = {
  // Supabase
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },

  // AI Context Generation
  ai: {
    provider: (process.env.EXPO_PUBLIC_AI_PROVIDER || env.EXPO_PUBLIC_AI_PROVIDER || 'anthropic') as 'openai' | 'anthropic',

    openai: {
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || env.EXPO_PUBLIC_OPENAI_API_KEY || '',
      model: process.env.EXPO_PUBLIC_OPENAI_MODEL || env.EXPO_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini',
    },

    anthropic: {
      apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
      model: process.env.EXPO_PUBLIC_ANTHROPIC_MODEL || env.EXPO_PUBLIC_ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
    },

    // Rate limiting
    rateLimitRPM: parseInt(process.env.EXPO_PUBLIC_AI_RATE_LIMIT_RPM || env.EXPO_PUBLIC_AI_RATE_LIMIT_RPM || '50', 10),
    batchSize: parseInt(process.env.EXPO_PUBLIC_AI_BATCH_SIZE || env.EXPO_PUBLIC_AI_BATCH_SIZE || '10', 10),
    retryAttempts: parseInt(process.env.EXPO_PUBLIC_AI_RETRY_ATTEMPTS || env.EXPO_PUBLIC_AI_RETRY_ATTEMPTS || '3', 10),
    retryDelayMs: parseInt(process.env.EXPO_PUBLIC_AI_RETRY_DELAY_MS || env.EXPO_PUBLIC_AI_RETRY_DELAY_MS || '1000', 10),
  },
};

// Validation helper
export function validateConfig(): { isValid: boolean; missingKeys: string[] } {
  const missingKeys: string[] = [];

  if (!config.supabase.url) missingKeys.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!config.supabase.anonKey) missingKeys.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');

  // Check AI provider configuration
  if (config.ai.provider === 'openai' && !config.ai.openai.apiKey) {
    missingKeys.push('EXPO_PUBLIC_OPENAI_API_KEY');
  }
  if (config.ai.provider === 'anthropic' && !config.ai.anthropic.apiKey) {
    missingKeys.push('EXPO_PUBLIC_ANTHROPIC_API_KEY');
  }

  return {
    isValid: missingKeys.length === 0,
    missingKeys,
  };
}
