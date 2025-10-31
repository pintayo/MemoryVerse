import { supabase } from '../lib/supabase';
import { Verse, UserVerseProgress, PracticeSession } from '../types/database';
import { getOrGenerateContext } from './contextGenerator';

/**
 * Verse Service
 * Handles Bible verse operations
 */
export const verseService = {
  /**
   * Get all verses
   */
  async getAllVerses(translation: string = 'NIV'): Promise<Verse[]> {
    const result = await supabase
      .from('verses')
      .select('*')
      .eq('translation', translation)
      .order('book', { ascending: true })
      .order('chapter', { ascending: true })
      .order('verse_number', { ascending: true });

    if (!result) {
      console.warn('[verseService] getAllVerses returned undefined');
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
    const result = await supabase
      .from('verses')
      .select('*')
      .eq('id', verseId)
      .single();

    if (!result) {
      console.warn('[verseService] getVerseById returned undefined for verse:', verseId);
      return null;
    }

    const { data, error } = result;
    if (error) throw error;
    return data;
  },

  /**
   * Get verses by category
   */
  async getVersesByCategory(category: string, translation: string = 'NIV'): Promise<Verse[]> {
    const result = await supabase
      .from('verses')
      .select('*')
      .eq('category', category)
      .eq('translation', translation)
      .order('difficulty', { ascending: true });

    if (!result) {
      console.warn('[verseService] getVersesByCategory returned undefined');
      return [];
    }

    const { data, error } = result;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get verses by difficulty
   */
  async getVersesByDifficulty(difficulty: number, translation: string = 'NIV'): Promise<Verse[]> {
    const result = await supabase
      .from('verses')
      .select('*')
      .eq('difficulty', difficulty)
      .eq('translation', translation);

    if (!result) {
      console.warn('[verseService] getVersesByDifficulty returned undefined');
      return [];
    }

    const { data, error } = result;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get random verse
   */
  async getRandomVerse(translation: string = 'NIV'): Promise<Verse | null> {
    const result = await supabase
      .from('verses')
      .select('*')
      .eq('translation', translation)
      .limit(100); // Get a pool of verses

    if (!result) {
      console.warn('[verseService] getRandomVerse returned undefined');
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
   * Get today's verse for a user (personalized based on their progress)
   */
  async getTodaysVerse(userId: string, translation: string = 'NIV'): Promise<Verse | null> {
    // Get user's current progress
    const progressResult = await supabase
      .from('user_verse_progress')
      .select('verse_id')
      .eq('user_id', userId);

    if (!progressResult) {
      console.warn('[verseService] getTodaysVerse progress query returned undefined');
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
      console.warn('[verseService] getTodaysVerse query returned undefined');
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
      console.warn('[verseService] getUserVerseProgress returned undefined');
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
      console.warn('[verseService] upsertUserVerseProgress returned undefined');
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
      console.warn('[verseService] recordPracticeSession returned undefined');
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
      console.warn('[verseService] getVersesForReview returned undefined');
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
      console.warn('[verseService] getMasteredVerses returned undefined');
      return [];
    }

    const { data, error } = result;
    if (error) throw error;

    return data?.map(item => item.verses).filter(Boolean) as Verse[] || [];
  },

  /**
   * Check user answer accuracy
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

    // Calculate word-level accuracy
    let correctWordCount = 0;
    const mistakes: string[] = [];

    correctWords.forEach((word, index) => {
      if (userWords[index] === word) {
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
      console.error('[VerseService] Error in getVerseWithContext:', error);
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
        console.warn('[verseService] updateVerseContext returned undefined');
        return {
          success: false,
          error: 'Update query returned undefined',
        };
      }

      const { error } = result;
      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('[VerseService] Error updating context:', error);
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
      console.warn('[verseService] getVersesNeedingContext returned undefined');
      return [];
    }

    const { data, error } = result;
    if (error) throw error;
    return data || [];
  },
};
