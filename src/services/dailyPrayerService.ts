/**
 * Daily Prayer Generation Service
 * Generates personalized prayers based on user's daily experiences using AI
 * Supports OpenAI, Anthropic (Claude), and Perplexity APIs
 */

import { config } from '../config/env';
import { logger } from '../utils/logger';
import { addAPIBreadcrumb, errorHandlers } from '../utils/sentryHelper';

export interface DailyPrayerResult {
  success: boolean;
  prayer?: string;
  error?: string;
}

/**
 * Generate prayer prompt for AI based on user's day
 */
function generatePrompt(dayStory: string): string {
  return `You are a compassionate prayer guide helping someone pray about their day.

User's story about their day:
"${dayStory}"

Generate a heartfelt, personal prayer that:
1. Acknowledges their experiences and emotions
2. Thanks God for the blessings mentioned
3. Seeks God's help with any challenges or struggles
4. Asks for guidance and strength
5. Closes with a meaningful amen

The prayer should:
- Be 3-5 paragraphs long
- Feel personal and authentic, not generic
- Reference specific details from their story
- Be encouraging and hope-filled
- Use warm, conversational language appropriate for prayer

Write the prayer as if you're praying with them, using "I" and "me" rather than "they" or "them".
Do not include any introductory text or labels - just the prayer itself.`;
}

/**
 * Call AI API to generate daily prayer
 */
async function callAI(dayStory: string, attempt: number = 0): Promise<string> {
  const provider = config.ai.provider;
  const prompt = generatePrompt(dayStory);

  logger.log(`[DailyPrayerService] Calling ${provider} API (attempt ${attempt + 1})`);

  try {
    let response: Response;
    let requestBody: any;
    let headers: Record<string, string>;

    switch (provider) {
      case 'anthropic':
        headers = {
          'Content-Type': 'application/json',
          'x-api-key': config.ai.anthropic.apiKey,
          'anthropic-version': '2023-06-01',
        };
        requestBody = {
          model: config.ai.anthropic.model,
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        };
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });
        break;

      case 'openai':
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.ai.openai.apiKey}`,
        };
        requestBody = {
          model: config.ai.openai.model,
          messages: [
            {
              role: 'system',
              content: 'You are a compassionate prayer guide helping people pray about their daily experiences. Generate heartfelt, personal prayers.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 2048,
        };
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });
        break;

      case 'perplexity':
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.ai.perplexity.apiKey}`,
        };
        requestBody = {
          model: config.ai.perplexity.model,
          messages: [
            {
              role: 'system',
              content: 'You are a compassionate prayer guide helping people pray about their daily experiences. Generate heartfelt, personal prayers.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        };
        response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });
        break;

      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }

    addAPIBreadcrumb('POST', `${provider} Daily Prayer API`, response.status, {
      provider,
      attempt: attempt + 1,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[DailyPrayerService] ${provider} API error:`, errorText);
      throw new Error(`${provider} API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    let generatedText: string;

    // Extract response based on provider
    switch (provider) {
      case 'anthropic':
        generatedText = data.content?.[0]?.text || '';
        break;
      case 'openai':
      case 'perplexity':
        generatedText = data.choices?.[0]?.message?.content || '';
        break;
      default:
        throw new Error(`Unknown provider response format: ${provider}`);
    }

    if (!generatedText) {
      throw new Error('No prayer generated');
    }

    logger.log('[DailyPrayerService] Prayer generated successfully');
    return generatedText.trim();
  } catch (error) {
    logger.error(`[DailyPrayerService] Error on attempt ${attempt + 1}:`, error);

    // Retry logic
    if (attempt < config.ai.retryAttempts - 1) {
      const delay = config.ai.retryDelayMs * Math.pow(2, attempt); // Exponential backoff
      logger.log(`[DailyPrayerService] Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callAI(dayStory, attempt + 1);
    }

    throw error;
  }
}

/**
 * Generate AI-powered prayer based on user's daily experience
 */
export async function generateDailyPrayer(dayStory: string): Promise<DailyPrayerResult> {
  try {
    logger.log('[DailyPrayerService] Generating daily prayer');

    // Validate input
    if (!dayStory || dayStory.trim().length < 10) {
      return {
        success: false,
        error: 'Please share more about your day (at least 10 characters)',
      };
    }

    // Generate prayer
    const prayer = await callAI(dayStory.trim());

    return {
      success: true,
      prayer,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[DailyPrayerService] Failed to generate prayer:', error);

    errorHandlers.handleAIError(
      error as Error,
      config.ai.provider,
      'daily-prayer'
    );

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get fallback prayer if AI fails
 */
export function getFallbackDailyPrayer(dayStory: string): string {
  return `Heavenly Father,

Thank You for this day and all its moments - the joys, the challenges, and everything in between. ${dayStory}

I lift these experiences up to You, trusting in Your perfect plan and timing. Help me to see Your hand in every situation and to grow closer to You through both blessings and difficulties.

Give me wisdom for the decisions I face, strength for the challenges ahead, and a heart full of gratitude for Your constant presence in my life.

In Jesus' name I pray, Amen.`;
}

logger.log('[dailyPrayerService] Module loaded');
