/**
 * AI Prayer Coaching Service
 * Generates personalized prayer guidance for Bible verses using AI
 * Supports OpenAI, Anthropic (Claude), and Perplexity APIs
 */

import { config } from '../config/env';
import { logger } from '../utils/logger';
import { addAPIBreadcrumb, errorHandlers } from '../utils/sentryHelper';

// Types
export interface Verse {
  id?: string;
  book: string;
  chapter: number;
  verse_number: number;
  text: string;
  translation: string;
  category?: string | null;
}

export interface PrayerGuide {
  praise: string;
  reflection: string;
  application: string;
  closing: string;
}

export interface PrayerCoachingResult {
  success: boolean;
  guide?: PrayerGuide;
  error?: string;
  retries?: number;
}

/**
 * Generate prayer coaching prompt for AI
 */
function generatePrompt(verse: Verse): string {
  const reference = `${verse.book} ${verse.chapter}:${verse.verse_number}`;

  return `You are a prayer coach helping someone pray through a Bible verse.

Verse: "${verse.text}"
Reference: ${reference}
Translation: ${verse.translation}

Generate personalized prayer guidance in 4 steps. Each step should be 1-2 sentences:

1. PRAISE: A specific prayer of praise based on what this verse reveals about God's character
2. REFLECTION: Guidance on how to reflect on this verse personally and what it means
3. APPLICATION: A prayer prompt asking God for help applying this truth in daily life
4. CLOSING: A brief, heartfelt closing prayer of thanksgiving

Format your response EXACTLY as JSON with these keys: praise, reflection, application, closing
Do not include markdown formatting, just pure JSON.`;
}

/**
 * Call AI API to generate prayer guidance
 */
async function callAI(verse: Verse, attempt: number = 0): Promise<PrayerGuide> {
  const provider = config.ai.provider;
  const prompt = generatePrompt(verse);

  logger.log(`[PrayerCoachingService] Calling ${provider} API (attempt ${attempt + 1})`);

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
          max_tokens: 1024,
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
              content: 'You are a prayer coach helping people pray through Bible verses. Always respond with valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
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
              content: 'You are a prayer coach helping people pray through Bible verses. Always respond with valid JSON only.',
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

    addAPIBreadcrumb('POST', `${provider} Prayer Coaching API`, response.status, {
      provider,
      attempt: attempt + 1,
      verse: `${verse.book} ${verse.chapter}:${verse.verse_number}`,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[PrayerCoachingService] ${provider} API error:`, errorText);
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
      throw new Error('No prayer guidance generated');
    }

    // Parse JSON response
    try {
      // Remove markdown code blocks if present
      const cleanedText = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const guide = JSON.parse(cleanedText) as PrayerGuide;

      // Validate all required fields are present
      if (!guide.praise || !guide.reflection || !guide.application || !guide.closing) {
        throw new Error('Missing required fields in prayer guide');
      }

      logger.log('[PrayerCoachingService] Prayer guidance generated successfully');
      return guide;
    } catch (parseError) {
      logger.error('[PrayerCoachingService] Failed to parse JSON response:', generatedText);
      throw new Error(`Failed to parse prayer guidance: ${parseError}`);
    }
  } catch (error) {
    logger.error(`[PrayerCoachingService] Error on attempt ${attempt + 1}:`, error);

    // Retry logic
    if (attempt < config.ai.retryAttempts - 1) {
      const delay = config.ai.retryDelayMs * Math.pow(2, attempt); // Exponential backoff
      logger.log(`[PrayerCoachingService] Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callAI(verse, attempt + 1);
    }

    throw error;
  }
}

/**
 * Generate AI-powered prayer guidance for a verse
 */
export async function generatePrayerGuidance(verse: Verse): Promise<PrayerCoachingResult> {
  try {
    logger.log(`[PrayerCoachingService] Generating prayer guidance for ${verse.book} ${verse.chapter}:${verse.verse_number}`);

    // Generate guidance
    const guide = await callAI(verse);

    return {
      success: true,
      guide,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[PrayerCoachingService] Failed to generate prayer guidance:', error);

    errorHandlers.handleAIError(
      error as Error,
      config.ai.provider,
      verse.id
    );

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get fallback prayer guide if AI fails
 */
export function getFallbackPrayerGuide(verse: Verse): PrayerGuide {
  return {
    praise: "Father God, I praise You for Your wisdom and love. Thank You for the truth revealed in Your Word.",
    reflection: `Take a moment to reflect on "${verse.text}". What does this verse reveal to you about God's character and His plan for your life?`,
    application: "Lord, help me to live out this truth in my daily life. Transform my heart and guide my steps according to Your Word.",
    closing: "Thank You for Your Word and Your presence with me. I trust in Your promises. In Jesus' name, Amen.",
  };
}

logger.log('[prayerCoachingService] Module loaded');
