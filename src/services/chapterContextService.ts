/**
 * Chapter Context Service
 * Generates AI-powered chapter summaries and context
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface ChapterContext {
  id?: string;
  book: string;
  chapter: number;
  translation: string;
  main_themes: string;
  historical_context: string;
  key_verses: string;
  practical_applications: string;
  cross_references: string;
  created_at?: string;
  updated_at?: string;
}

export interface GenerateChapterContextResult {
  success: boolean;
  context?: ChapterContext;
  error?: string;
}

/**
 * Generate AI-powered chapter context
 * Uses multiple AI providers with fallback support
 */
export async function generateChapterContext(
  book: string,
  chapter: number,
  verses: any[]
): Promise<GenerateChapterContextResult> {
  try {
    logger.log(`[ChapterContextService] Generating context for ${book} ${chapter}`);

    // Combine verse text for context
    const chapterText = verses
      .map(v => `${v.verse_number}. ${v.text}`)
      .join('\n');

    const prompt = `Provide a comprehensive summary and context for ${book} Chapter ${chapter} of the Bible.

Chapter text:
${chapterText.substring(0, 3000)}

Please provide:
1. Main Themes and Teachings (2-3 key themes)
2. Historical and Cultural Context (brief background)
3. Key Verses and Their Significance (2-3 important verses)
4. Practical Applications for Daily Life (2-3 actionable insights)
5. Cross-References to Related Passages (3-4 related Bible passages)

Format your response as a clear, structured summary suitable for Bible study.`;

    // Try Perplexity first (preferred provider)
    const perplexityResult = await tryPerplexity(prompt);
    if (perplexityResult.success && perplexityResult.context) {
      return perplexityResult;
    }

    // Try OpenAI as fallback
    const openaiResult = await tryOpenAI(prompt);
    if (openaiResult.success && openaiResult.context) {
      return openaiResult;
    }

    // Try Anthropic (Claude) as fallback
    const anthropicResult = await tryAnthropic(prompt);
    if (anthropicResult.success && anthropicResult.context) {
      return anthropicResult;
    }

    // If all AI services fail, return fallback context
    logger.warn('[ChapterContextService] All AI services failed, using fallback');
    return {
      success: true,
      context: getFallbackChapterContext(book, chapter),
    };
  } catch (error) {
    logger.error('[ChapterContextService] Error generating chapter context:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate chapter context',
    };
  }
}

/**
 * Try generating context with Perplexity
 */
async function tryPerplexity(prompt: string): Promise<GenerateChapterContextResult> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_PERPLEXITY_API_KEY;
    const model = process.env.EXPO_PUBLIC_PERPLEXITY_MODEL || 'sonar';

    if (!apiKey) {
      logger.warn('[ChapterContextService] Perplexity API key not configured');
      return { success: false, error: 'Perplexity not configured' };
    }

    logger.log('[ChapterContextService] Trying Perplexity API...');

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable Bible scholar providing clear, insightful chapter summaries.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[ChapterContextService] Perplexity API error:', response.status, errorText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const contextText = data.choices[0]?.message?.content || '';

    if (!contextText) {
      return { success: false, error: 'Empty response from Perplexity' };
    }

    logger.log('[ChapterContextService] Successfully generated context with Perplexity');

    return {
      success: true,
      context: parseChapterContext(contextText),
    };
  } catch (error) {
    logger.error('[ChapterContextService] Perplexity error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Perplexity failed',
    };
  }
}

/**
 * Try generating context with OpenAI
 */
async function tryOpenAI(prompt: string): Promise<GenerateChapterContextResult> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      logger.warn('[ChapterContextService] OpenAI API key not configured');
      return { success: false, error: 'OpenAI not configured' };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable Bible scholar providing clear, insightful chapter summaries.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const contextText = data.choices[0]?.message?.content || '';

    if (!contextText) {
      return { success: false, error: 'Empty response from OpenAI' };
    }

    return {
      success: true,
      context: parseChapterContext(contextText),
    };
  } catch (error) {
    logger.error('[ChapterContextService] OpenAI error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OpenAI failed',
    };
  }
}

/**
 * Try generating context with Anthropic (Claude)
 */
async function tryAnthropic(prompt: string): Promise<GenerateChapterContextResult> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey) {
      logger.warn('[ChapterContextService] Anthropic API key not configured');
      return { success: false, error: 'Anthropic not configured' };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const contextText = data.content[0]?.text || '';

    if (!contextText) {
      return { success: false, error: 'Empty response from Anthropic' };
    }

    return {
      success: true,
      context: parseChapterContext(contextText),
    };
  } catch (error) {
    logger.error('[ChapterContextService] Anthropic error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Anthropic failed',
    };
  }
}

/**
 * Parse AI response into structured chapter context
 */
function parseChapterContext(text: string): ChapterContext {
  // Simple parsing - in production, you'd want more sophisticated parsing
  const sections = {
    main_themes: '',
    historical_context: '',
    key_verses: '',
    practical_applications: '',
    cross_references: '',
  };

  // Try to extract sections based on common patterns
  const lines = text.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('main theme') || lower.includes('key theme')) {
      currentSection = 'main_themes';
    } else if (lower.includes('historical') || lower.includes('cultural')) {
      currentSection = 'historical_context';
    } else if (lower.includes('key verse')) {
      currentSection = 'key_verses';
    } else if (lower.includes('practical') || lower.includes('application')) {
      currentSection = 'practical_applications';
    } else if (lower.includes('cross-reference') || lower.includes('related passage')) {
      currentSection = 'cross_references';
    } else if (currentSection && line.trim()) {
      sections[currentSection as keyof typeof sections] += line + '\n';
    }
  }

  return {
    book: '',
    chapter: 0,
    translation: 'KJV',
    main_themes: sections.main_themes.trim() || text,
    historical_context: sections.historical_context.trim(),
    key_verses: sections.key_verses.trim(),
    practical_applications: sections.practical_applications.trim(),
    cross_references: sections.cross_references.trim(),
  };
}

/**
 * Get fallback chapter context when AI services are unavailable
 */
function getFallbackChapterContext(book: string, chapter: number): ChapterContext {
  return {
    book,
    chapter,
    translation: 'KJV',
    main_themes: `This chapter from ${book} contains important Biblical teachings and narratives. Study it carefully to understand its significance in the broader context of Scripture.`,
    historical_context: 'This passage was written in the historical context of ancient Israel and the early church, reflecting the cultural and religious practices of that time.',
    key_verses: 'Each verse in this chapter contributes to the overall message and theme. Read through the chapter multiple times to identify the most significant passages.',
    practical_applications: 'Reflect on how the teachings in this chapter apply to your daily life. Consider how you can live out these principles in your relationships, work, and spiritual journey.',
    cross_references: 'Explore related passages throughout Scripture to gain a deeper understanding of this chapter\'s themes and teachings.',
  };
}

/**
 * Save chapter context to database
 */
export async function saveChapterContext(
  context: ChapterContext
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('chapter_contexts').upsert(
      {
        book: context.book,
        chapter: context.chapter,
        translation: context.translation,
        main_themes: context.main_themes,
        historical_context: context.historical_context,
        key_verses: context.key_verses,
        practical_applications: context.practical_applications,
        cross_references: context.cross_references,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'book,chapter,translation',
      }
    );

    if (error) throw error;

    logger.log(`[ChapterContextService] Context saved for ${context.book} ${context.chapter}`);
    return { success: true };
  } catch (error) {
    logger.error('[ChapterContextService] Error saving context:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save context',
    };
  }
}

/**
 * Load chapter context from database
 */
export async function loadChapterContext(
  book: string,
  chapter: number,
  translation: string = 'KJV'
): Promise<ChapterContext | null> {
  try {
    const { data, error } = await supabase
      .from('chapter_contexts')
      .select('*')
      .eq('book', book)
      .eq('chapter', chapter)
      .eq('translation', translation)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - context not yet generated
        return null;
      }
      throw error;
    }

    logger.log(`[ChapterContextService] Context loaded from DB for ${book} ${chapter}`);
    return data as ChapterContext;
  } catch (error) {
    logger.error('[ChapterContextService] Error loading context:', error);
    return null;
  }
}

logger.log('[chapterContextService] Module loaded');
