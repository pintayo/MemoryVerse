/**
 * AI Context Generator Service
 * Generates spiritual context and explanations for Bible verses using AI
 * Supports OpenAI, Anthropic (Claude), and Perplexity APIs
 */

import { config } from '../config/env';
import { supabase } from '../lib/supabase';

// Types
export interface Verse {
  id?: string;
  book: string;
  chapter: number;
  verse_number: number;
  text: string;
  translation: string;
  category?: string | null;
  context?: string | null;
  context_generated_by_ai?: boolean;
  context_generated_at?: string;
}

export interface ContextGenerationResult {
  success: boolean;
  context?: string;
  error?: string;
  retries?: number;
}

export interface BatchGenerationResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: Array<{ verseId: string; error: string }>;
}

// Rate limiter state
class RateLimiter {
  private requests: number[] = [];
  private readonly windowMs = 60000; // 1 minute
  private readonly maxRequests: number;

  constructor(maxRequestsPerMinute: number) {
    this.maxRequests = maxRequestsPerMinute;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();

    // Remove requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    // If at limit, wait
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest) + 100; // Add 100ms buffer

      if (waitTime > 0) {
        console.log(`[RateLimiter] Waiting ${waitTime}ms to respect rate limit...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      // Recheck after waiting
      return this.waitIfNeeded();
    }

    // Record this request
    this.requests.push(now);
  }
}

const rateLimiter = new RateLimiter(config.ai.rateLimitRPM);

/**
 * Generate context prompt for AI
 */
function generatePrompt(verse: Verse): string {
  const reference = `${verse.book} ${verse.chapter}:${verse.verse_number}`;
  const categoryInfo = verse.category ? ` (Category: ${verse.category})` : '';

  return `You are a biblical scholar providing spiritual context for Scripture memorization.

Verse: "${verse.text}"
Reference: ${reference}${categoryInfo}
Translation: ${verse.translation}

Provide a concise, encouraging 1-3 sentence explanation that:
1. Clarifies the spiritual meaning and significance
2. Helps with memorization by providing context
3. Encourages practical application
4. Uses warm, accessible language suitable for all ages

Keep it under 150 words. Focus on the core message and why this verse matters.`;
}

/**
 * Call OpenAI API to generate context
 */
async function generateContextWithOpenAI(verse: Verse): Promise<string> {
  const apiKey = config.ai.openai.apiKey;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.ai.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are a biblical scholar who provides concise, encouraging spiritual context for Bible verses to aid memorization.',
        },
        {
          role: 'user',
          content: generatePrompt(verse),
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const context = data.choices?.[0]?.message?.content?.trim();

  if (!context) {
    throw new Error('No context generated from OpenAI');
  }

  return context;
}

/**
 * Call Anthropic (Claude) API to generate context
 */
async function generateContextWithAnthropic(verse: Verse): Promise<string> {
  const apiKey = config.ai.anthropic.apiKey;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.ai.anthropic.model,
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: generatePrompt(verse),
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const context = data.content?.[0]?.text?.trim();

  if (!context) {
    throw new Error('No context generated from Anthropic');
  }

  return context;
}

/**
 * Call Perplexity API to generate context
 */
async function generateContextWithPerplexity(verse: Verse): Promise<string> {
  const apiKey = config.ai.perplexity.apiKey;
  if (!apiKey) {
    throw new Error('Perplexity API key not configured');
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.ai.perplexity.model,
      messages: [
        {
          role: 'system',
          content: 'You are a biblical scholar who provides concise, encouraging spiritual context for Bible verses to aid memorization.',
        },
        {
          role: 'user',
          content: generatePrompt(verse),
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Perplexity API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const context = data.choices?.[0]?.message?.content?.trim();

  if (!context) {
    throw new Error('No context generated from Perplexity');
  }

  return context;
}

/**
 * Generate context for a single verse with retry logic
 */
export async function generateContext(
  verse: Verse,
  retries: number = config.ai.retryAttempts
): Promise<ContextGenerationResult> {
  let lastError: Error | null = null;
  let attemptCount = 0;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      attemptCount++;

      // Wait for rate limiter
      await rateLimiter.waitIfNeeded();

      // Call appropriate AI provider
      let context: string;
      if (config.ai.provider === 'openai') {
        context = await generateContextWithOpenAI(verse);
      } else if (config.ai.provider === 'perplexity') {
        context = await generateContextWithPerplexity(verse);
      } else {
        context = await generateContextWithAnthropic(verse);
      }

      console.log(`[ContextGenerator] Successfully generated context for ${verse.book} ${verse.chapter}:${verse.verse_number}`);

      return {
        success: true,
        context,
        retries: attemptCount - 1,
      };

    } catch (error) {
      lastError = error as Error;
      console.error(`[ContextGenerator] Attempt ${attempt + 1} failed:`, error);

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const delay = config.ai.retryDelayMs * Math.pow(2, attempt);
        console.log(`[ContextGenerator] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Unknown error',
    retries: attemptCount - 1,
  };
}

/**
 * Save generated context to database
 */
export async function saveContextToDatabase(
  verseId: string,
  context: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('verses')
      .update({
        context,
        context_generated_by_ai: true,
        context_generated_at: new Date().toISOString(),
      })
      .eq('id', verseId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('[ContextGenerator] Database save error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

/**
 * Get context for a verse (from cache or generate on-demand)
 */
export async function getOrGenerateContext(verseId: string): Promise<{
  context: string | null;
  isGenerated: boolean;
  error?: string;
}> {
  try {
    // Fetch verse from database
    const { data: verse, error: fetchError } = await supabase
      .from('verses')
      .select('*')
      .eq('id', verseId)
      .single();

    if (fetchError || !verse) {
      throw new Error('Verse not found');
    }

    // If context exists, return it
    if (verse.context && verse.context.trim() !== '') {
      return {
        context: verse.context,
        isGenerated: false, // Already cached
      };
    }

    // Generate new context
    console.log(`[ContextGenerator] Generating context for verse ${verseId}...`);
    const result = await generateContext(verse);

    if (!result.success || !result.context) {
      return {
        context: null,
        isGenerated: false,
        error: result.error || 'Failed to generate context',
      };
    }

    // Save to database
    const saveResult = await saveContextToDatabase(verseId, result.context);

    if (!saveResult.success) {
      console.error('[ContextGenerator] Failed to save context:', saveResult.error);
      // Still return the generated context even if save failed
    }

    return {
      context: result.context,
      isGenerated: true,
    };

  } catch (error) {
    console.error('[ContextGenerator] Error in getOrGenerateContext:', error);
    return {
      context: null,
      isGenerated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch generate contexts for multiple verses
 * Processes in batches to respect rate limits
 */
export async function batchGenerateContexts(
  limit: number = 100,
  onProgress?: (current: number, total: number) => void
): Promise<BatchGenerationResult> {
  try {
    // Fetch verses without context
    const { data: verses, error: fetchError } = await supabase
      .from('verses')
      .select('*')
      .or('context.is.null,context.eq.')
      .limit(limit);

    if (fetchError) {
      throw fetchError;
    }

    if (!verses || verses.length === 0) {
      console.log('[ContextGenerator] No verses found without context');
      return {
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        errors: [],
      };
    }

    console.log(`[ContextGenerator] Processing ${verses.length} verses in batches of ${config.ai.batchSize}...`);

    let successful = 0;
    let failed = 0;
    const errors: Array<{ verseId: string; error: string }> = [];

    // Process in batches
    for (let i = 0; i < verses.length; i += config.ai.batchSize) {
      const batch = verses.slice(i, i + config.ai.batchSize);

      console.log(`[ContextGenerator] Processing batch ${Math.floor(i / config.ai.batchSize) + 1} (${batch.length} verses)...`);

      // Process batch sequentially to respect rate limits
      for (const verse of batch) {
        const current = i + batch.indexOf(verse) + 1;

        if (onProgress) {
          onProgress(current, verses.length);
        }

        const result = await generateContext(verse);

        if (result.success && result.context) {
          const saveResult = await saveContextToDatabase(verse.id!, result.context);

          if (saveResult.success) {
            successful++;
          } else {
            failed++;
            errors.push({
              verseId: verse.id!,
              error: saveResult.error || 'Failed to save',
            });
          }
        } else {
          failed++;
          errors.push({
            verseId: verse.id!,
            error: result.error || 'Generation failed',
          });
        }
      }

      // Small delay between batches
      if (i + config.ai.batchSize < verses.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`[ContextGenerator] Batch complete: ${successful} successful, ${failed} failed`);

    return {
      totalProcessed: verses.length,
      successful,
      failed,
      errors,
    };

  } catch (error) {
    console.error('[ContextGenerator] Batch generation error:', error);
    throw error;
  }
}

/**
 * Get statistics about context generation
 */
export async function getContextStats(): Promise<{
  total: number;
  withContext: number;
  withoutContext: number;
  aiGenerated: number;
}> {
  try {
    // Total verses
    const { count: total } = await supabase
      .from('verses')
      .select('*', { count: 'exact', head: true });

    // With context
    const { count: withContext } = await supabase
      .from('verses')
      .select('*', { count: 'exact', head: true })
      .not('context', 'is', null)
      .neq('context', '');

    // AI generated
    const { count: aiGenerated } = await supabase
      .from('verses')
      .select('*', { count: 'exact', head: true })
      .eq('context_generated_by_ai', true);

    return {
      total: total || 0,
      withContext: withContext || 0,
      withoutContext: (total || 0) - (withContext || 0),
      aiGenerated: aiGenerated || 0,
    };
  } catch (error) {
    console.error('[ContextGenerator] Error fetching stats:', error);
    return {
      total: 0,
      withContext: 0,
      withoutContext: 0,
      aiGenerated: 0,
    };
  }
}
