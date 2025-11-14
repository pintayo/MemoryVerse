logger.log('[verseService] Module loading...');

logger.log('[verseService] Importing supabase...');
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
logger.log('[verseService] supabase imported');

logger.log('[verseService] Importing AsyncStorage...');
import AsyncStorage from '@react-native-async-storage/async-storage';
logger.log('[verseService] AsyncStorage imported');

logger.log('[verseService] Importing types...');
import { Verse, UserVerseProgress, PracticeSession } from '../types/database';
logger.log('[verseService] types imported');

logger.log('[verseService] Importing contextGenerator...');
import { getOrGenerateContext } from './contextGenerator';
logger.log('[verseService] contextGenerator imported');

logger.log('[verseService] Importing sentryHelper...');
import { addDatabaseBreadcrumb, errorHandlers } from '../utils/sentryHelper';
logger.log('[verseService] sentryHelper imported');

logger.log('[verseService] About to define verseService object...');

/**
 * Verse Service
 * Handles Bible verse operations
 */
export const verseService = {
  /**
   * Get all verses
   */
  async getAllVerses(translation: string = 'KJV'): Promise<Verse[]> {
    const result = await supabase
      .from('verses')
      .select('*')
      .eq('translation', translation)
      .order('book', { ascending: true })
      .order('chapter', { ascending: true })
      .order('verse_number', { ascending: true });

    if (!result) {
      logger.warn('[verseService] getAllVerses returned undefined');
      return [];
    }

    const { data, error } = result;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get verse by ID
   */
  async getVerseById(verseId: string): Promise<Verse | null> {
    try {
      addDatabaseBreadcrumb('SELECT', 'verses', true, { verseId });

      const result = await supabase
        .from('verses')
        .select('*')
        .eq('id', verseId)
        .single();

      if (!result) {
        logger.warn('[verseService] getVerseById returned undefined for verse:', verseId);
        addDatabaseBreadcrumb('SELECT', 'verses', false, { verseId, reason: 'undefined result' });
        return null;
      }

      const { data, error } = result;
      if (error) {
        addDatabaseBreadcrumb('SELECT', 'verses', false, { verseId, error: error.message });
        throw error;
      }
      return data;
    } catch (error) {
      errorHandlers.handleVerseError(error as Error, verseId);
      throw error;
    }
  },

  /**
   * Get verses by category
   */
  async getVersesByCategory(category: string, translation: string = 'KJV'): Promise<Verse[]> {
    const result = await supabase
      .from('verses')
      .select('*')
      .eq('category', category)
      .eq('translation', translation)
      .order('difficulty', { ascending: true });

    if (!result) {
      logger.warn('[verseService] getVersesByCategory returned undefined');
      return [];
    }

    const { data, error } = result;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get verses by difficulty
   */
  async getVersesByDifficulty(difficulty: number, translation: string = 'KJV'): Promise<Verse[]> {
    const result = await supabase
      .from('verses')
      .select('*')
      .eq('difficulty', difficulty)
      .eq('translation', translation);

    if (!result) {
      logger.warn('[verseService] getVersesByDifficulty returned undefined');
      return [];
    }

    const { data, error } = result;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get random verse
   * Filters to only include memorable verses (no genealogies, itineraries, etc.)
   * Optionally filter by book and/or chapter
   */
  async getRandomVerse(
    translation: string = 'KJV',
    book?: string,
    chapter?: number
  ): Promise<Verse | null> {
    // Build query with optional filters
    let query = supabase
      .from('verses')
      .select('*')
      .eq('translation', translation);

    // Add book filter if provided
    if (book) {
      query = query.eq('book', book);
    }

    // Add chapter filter if provided
    if (chapter !== undefined) {
      query = query.eq('chapter', chapter);
    }

    // Try to get memorable verses first (if no specific filters)
    if (!book && !chapter) {
      let result = await query.eq('is_memorable', true).limit(100);

      // If memorable verses found, use them
      if (result?.data && result.data.length > 0) {
        const randomIndex = Math.floor(Math.random() * result.data.length);
        return result.data[randomIndex];
      }
    }

    // Get verses without memorable filter
    query = query.limit(100);
    const result = await query;

    if (!result) {
      logger.warn('[verseService] getRandomVerse returned undefined');
      return null;
    }

    const { data, error } = result;
    if (error) throw error;
    if (!data || data.length === 0) return null;

    // Pick random verse from the pool
    const randomIndex = Math.floor(Math.random() * data.length);
    return data[randomIndex];
  },

  /**
   * Get today's verse with 24-hour caching
   * Returns the same verse all day, refreshes at midnight
   */
  async getTodayVerseWithCache(translation: string = 'KJV'): Promise<Verse | null> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      // Check cache for today's verse
      const cachedDate = await AsyncStorage.getItem('todayVerseDate');
      const cachedVerseId = await AsyncStorage.getItem('todayVerseId');

      // If cached verse is from today, return it
      if (cachedDate === today && cachedVerseId) {
        logger.log(`[verseService] Using cached today's verse from ${today}`);
        const verse = await this.getVerseById(cachedVerseId);
        if (verse) {
          return verse;
        }
        // If verse not found (deleted?), fall through to get new one
        logger.warn('[verseService] Cached verse not found, fetching new one');
      }

      // Get a new random verse for today
      logger.log(`[verseService] Fetching new today's verse for ${today}`);
      const newVerse = await this.getRandomVerse(translation);

      if (newVerse?.id) {
        // Cache the new verse
        await AsyncStorage.setItem('todayVerseDate', today);
        await AsyncStorage.setItem('todayVerseId', newVerse.id);
        logger.log(`[verseService] Cached today's verse: ${newVerse.id}`);
      }

      return newVerse;
    } catch (error) {
      logger.error('[verseService] Error in getTodayVerseWithCache:', error);
      // Fallback to random verse if caching fails
      return this.getRandomVerse(translation);
    }
  },

  /**
   * Get today's verse for a user (personalized based on their progress)
   */
  async getTodaysVerse(userId: string, translation: string = 'KJV'): Promise<Verse | null> {
    // Get user's current progress
    const progressResult = await supabase
      .from('user_verse_progress')
      .select('verse_id')
      .eq('user_id', userId);

    if (!progressResult) {
      logger.warn('[verseService] getTodaysVerse progress query returned undefined');
      return null;
    }

    const { data: progressData, error: progressError } = progressResult;
    if (progressError) throw progressError;

    const learnedVerseIds = progressData?.map(p => p.verse_id) || [];

    // Get a verse the user hasn't learned yet
    let query = supabase
      .from('verses')
      .select('*')
      .eq('translation', translation);

    if (learnedVerseIds.length > 0) {
      query = query.not('id', 'in', `(${learnedVerseIds.join(',')})`);
    }

    const result = await query.limit(1);

    if (!result) {
      logger.warn('[verseService] getTodaysVerse query returned undefined');
      return null;
    }

    const { data, error } = result;
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  /**
   * Get user's verse progress
   */
  async getUserVerseProgress(userId: string, verseId: string): Promise<UserVerseProgress | null> {
    const result = await supabase
      .from('user_verse_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('verse_id', verseId)
      .single();

    if (!result) {
      logger.warn('[verseService] getUserVerseProgress returned undefined');
      return null;
    }

    const { data, error } = result;
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  },

  /**
   * Create or update user verse progress
   */
  async upsertUserVerseProgress(
    userId: string,
    verseId: string,
    updates: Partial<UserVerseProgress>
  ): Promise<UserVerseProgress> {
    const result = await supabase
      .from('user_verse_progress')
      .upsert({
        user_id: userId,
        verse_id: verseId,
        ...updates,
      })
      .select()
      .single();

    if (!result) {
      logger.warn('[verseService] upsertUserVerseProgress returned undefined');
      throw new Error('Failed to upsert user verse progress');
    }

    const { data, error } = result;
    if (error) throw error;
    return data;
  },

  /**
   * Record a practice session
   */
  async recordPracticeSession(
    userId: string,
    verseId: string,
    sessionData: {
      session_type: 'read' | 'recall' | 'recite';
      user_answer?: string;
      is_correct: boolean;
      accuracy_percentage: number;
      time_spent_seconds?: number;
      hints_used?: number;
      xp_earned?: number;
    }
  ): Promise<PracticeSession> {
    const result = await supabase
      .from('practice_sessions')
      .insert({
        user_id: userId,
        verse_id: verseId,
        ...sessionData,
      })
      .select()
      .single();

    if (!result) {
      logger.warn('[verseService] recordPracticeSession returned undefined');
      throw new Error('Failed to record practice session');
    }

    const { data, error } = result;
    if (error) throw error;

    // Update user verse progress
    const currentProgress = await this.getUserVerseProgress(userId, verseId);
    const newAttempts = (currentProgress?.attempts || 0) + 1;
    const newAccuracy = currentProgress
      ? (currentProgress.accuracy_score * currentProgress.attempts + sessionData.accuracy_percentage) / newAttempts
      : sessionData.accuracy_percentage;

    // Determine status based on accuracy
    let status: 'learning' | 'reviewing' | 'mastered' = 'learning';
    if (newAccuracy >= 95 && newAttempts >= 3) {
      status = 'mastered';
    } else if (newAccuracy >= 70) {
      status = 'reviewing';
    }

    await this.upsertUserVerseProgress(userId, verseId, {
      accuracy_score: newAccuracy,
      attempts: newAttempts,
      status,
      last_practiced_at: new Date().toISOString(),
      ...(status === 'mastered' ? { mastered_at: new Date().toISOString() } : {}),
    });

    return data;
  },

  /**
   * Get verses due for review (spaced repetition)
   */
  async getVersesForReview(userId: string, limit: number = 5): Promise<Verse[]> {
    const now = new Date().toISOString();

    const result = await supabase
      .from('user_verse_progress')
      .select('verse_id, verses(*)')
      .eq('user_id', userId)
      .eq('status', 'reviewing')
      .lte('next_review_at', now)
      .order('next_review_at', { ascending: true })
      .limit(limit);

    if (!result) {
      logger.warn('[verseService] getVersesForReview returned undefined');
      return [];
    }

    const { data, error } = result;
    if (error) throw error;

    return data?.map(item => item.verses).filter(Boolean) as Verse[] || [];
  },

  /**
   * Get user's mastered verses
   */
  async getMasteredVerses(userId: string): Promise<Verse[]> {
    const result = await supabase
      .from('user_verse_progress')
      .select('verse_id, verses(*)')
      .eq('user_id', userId)
      .eq('status', 'mastered')
      .order('mastered_at', { ascending: false });

    if (!result) {
      logger.warn('[verseService] getMasteredVerses returned undefined');
      return [];
    }

    const { data, error } = result;
    if (error) throw error;

    return data?.map(item => item.verses).filter(Boolean) as Verse[] || [];
  },

  /**
   * Calculate Levenshtein distance (edit distance) between two strings
   * Used for fuzzy matching in checkAnswer
   */
  levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    // Create a 2D array for dynamic programming
    const matrix: number[][] = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    // Fill the matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  },

  /**
   * Check if two words are similar enough (fuzzy match)
   * Allows for common typos and small spelling variations
   */
  isFuzzyMatch(correctWord: string, userWord: string): boolean {
    // Exact match
    if (correctWord === userWord) return true;

    // Calculate edit distance
    const distance = verseService.levenshteinDistance(correctWord, userWord);

    // Allow more leniency for longer words
    // Short words (≤4 chars): max 1 edit
    // Medium words (5-7 chars): max 2 edits
    // Long words (8+ chars): max 3 edits
    const maxDistance = correctWord.length <= 4 ? 1 : correctWord.length <= 7 ? 2 : 3;

    return distance <= maxDistance;
  },

  /**
   * Check user answer accuracy with fuzzy matching
   * Returns accuracy percentage and detailed feedback
   */
  checkAnswer(correctText: string, userAnswer: string): {
    isCorrect: boolean;
    accuracy: number;
    mistakes: string[];
  } {
    // Normalize both texts
    const normalizeText = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

    const correctNormalized = normalizeText(correctText);
    const userNormalized = normalizeText(userAnswer);

    // Split into words
    const correctWords = correctNormalized.split(' ');
    const userWords = userNormalized.split(' ');

    // Calculate word-level accuracy with fuzzy matching
    let correctWordCount = 0;
    const mistakes: string[] = [];

    correctWords.forEach((word, index) => {
      const userWord = userWords[index] || '';

      // Use fuzzy matching to allow for typos
      if (verseService.isFuzzyMatch(word, userWord)) {
        correctWordCount++;
      } else {
        mistakes.push(word);
      }
    });

    const accuracy = (correctWordCount / correctWords.length) * 100;
    const isCorrect = accuracy >= 90; // 90% threshold for "correct"

    return {
      isCorrect,
      accuracy: Math.round(accuracy * 100) / 100,
      mistakes,
    };
  },

  /**
   * Get verse with context (generates on-demand if missing)
   */
  async getVerseWithContext(verseId: string): Promise<{
    verse: Verse | null;
    context: string | null;
    contextGenerated: boolean;
    error?: string;
  }> {
    try {
      addDatabaseBreadcrumb('SELECT', 'verses', true, { operation: 'getVerseWithContext', verseId });

      // Fetch verse
      const verse = await this.getVerseById(verseId);

      if (!verse) {
        return {
          verse: null,
          context: null,
          contextGenerated: false,
          error: 'Verse not found',
        };
      }

      // Get or generate context
      const contextResult = await getOrGenerateContext(verseId);

      return {
        verse,
        context: contextResult.context,
        contextGenerated: contextResult.isGenerated,
        error: contextResult.error,
      };
    } catch (error) {
      logger.error('[VerseService] Error in getVerseWithContext:', error);
      errorHandlers.handleVerseError(error as Error, verseId);
      return {
        verse: null,
        context: null,
        contextGenerated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Update verse context manually
   */
  async updateVerseContext(
    verseId: string,
    context: string,
    isAiGenerated: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await supabase
        .from('verses')
        .update({
          context,
          context_generated_by_ai: isAiGenerated,
          context_generated_at: new Date().toISOString(),
        })
        .eq('id', verseId);

      if (!result) {
        logger.warn('[verseService] updateVerseContext returned undefined');
        return {
          success: false,
          error: 'Update query returned undefined',
        };
      }

      const { error } = result;
      if (error) throw error;

      return { success: true };
    } catch (error) {
      logger.error('[VerseService] Error updating context:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get verses that need context generation
   */
  async getVersesNeedingContext(limit: number = 100): Promise<Verse[]> {
    const result = await supabase
      .from('verses')
      .select('*')
      .or('context.is.null,context.eq.')
      .limit(limit);

    if (!result) {
      logger.warn('[verseService] getVersesNeedingContext returned undefined');
      return [];
    }

    const { data, error } = result;
    if (error) throw error;
    return data || [];
  },
};

logger.log('[verseService] verseService object defined successfully');
logger.log('[verseService] Module loaded!');
