/**
 * Daily Verse Service
 * Handles fetching the synchronized daily verse that's the same for all users
 */

import { supabase } from '../lib/supabase';
import { Verse } from '../types/database';
import { logger } from '../utils/logger';

export interface DailyVerseResponse {
  id: string;
  date: string;
  verse_id: string;
  translation: string;
  book: string;
  chapter: number;
  verse_number: number;
  text: string;
}

/**
 * Get today's verse - same for all users
 * Uses server-side function to ensure synchronization
 */
export async function getTodaysDailyVerse(translation: string = 'KJV'): Promise<Verse | null> {
  try {
    logger.log('[dailyVerseService] Fetching daily verse for translation:', translation);

    // Call the database function that returns or creates today's verse
    const { data, error } = await supabase
      .rpc('get_or_create_daily_verse', {
        p_translation: translation
      });

    if (error) {
      logger.error('[dailyVerseService] Error fetching daily verse:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      logger.warn('[dailyVerseService] No daily verse returned');
      return null;
    }

    // The RPC returns an array with one row
    const dailyVerse = data[0] as DailyVerseResponse;

    // Convert to Verse format
    const verse: Verse = {
      id: dailyVerse.verse_id,
      book: dailyVerse.book,
      chapter: dailyVerse.chapter,
      verse_number: dailyVerse.verse_number,
      text: dailyVerse.text,
      translation: dailyVerse.translation,
      created_at: new Date().toISOString(),
      difficulty: 1,
      category: null,
      context: null,
      context_generated_by_ai: null,
      context_generated_at: null,
      is_memorable: null,
    };

    logger.log('[dailyVerseService] Daily verse fetched successfully:', verse.book, verse.chapter, verse.verse_number);
    return verse;
  } catch (error) {
    logger.error('[dailyVerseService] Failed to get daily verse:', error);
    return null;
  }
}

/**
 * Get daily verse for a specific date (for viewing history)
 */
export async function getDailyVerseForDate(date: string, translation: string = 'KJV'): Promise<Verse | null> {
  try {
    const { data, error } = await supabase
      .from('daily_verses')
      .select(`
        id,
        date,
        verse_id,
        translation,
        verses (
          id,
          book,
          chapter,
          verse_number,
          text,
          translation,
          category,
          difficulty,
          context,
          context_generated_by_ai,
          context_generated_at,
          is_memorable,
          created_at
        )
      `)
      .eq('date', date)
      .eq('translation', translation)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - no daily verse for this date yet
        return null;
      }
      throw error;
    }

    if (!data || !data.verses) {
      return null;
    }

    return data.verses as any as Verse;
  } catch (error) {
    logger.error('[dailyVerseService] Error fetching daily verse for date:', error);
    return null;
  }
}

logger.log('[dailyVerseService] Module loaded');
