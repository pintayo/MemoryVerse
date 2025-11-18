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
 * Get today's verse for the user's timezone
 * Each user sees the verse for their local date
 * Uses the database function to handle creation with proper RLS privileges
 */
export async function getTodaysDailyVerse(translation: string = 'KJV'): Promise<Verse | null> {
  try {
    // Get today's date in user's local timezone (YYYY-MM-DD)
    const today = new Date();
    const localDate = today.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format

    logger.log('[dailyVerseService] Fetching daily verse for date:', localDate, 'translation:', translation);

    // Use the database function which handles creation with SECURITY DEFINER
    const { data, error } = await supabase
      .rpc('get_or_create_daily_verse', {
        p_translation: translation
      });

    if (error) {
      logger.error('[dailyVerseService] Error calling get_or_create_daily_verse:', error);
      // Fallback: try to fetch directly
      return await getDailyVerseForDate(localDate, translation);
    }

    if (!data || data.length === 0) {
      logger.error('[dailyVerseService] No verse returned from function');
      return null;
    }

    // The function returns a row with verse details
    const verseData = data[0];
    const verse: Verse = {
      id: verseData.verse_id,
      book: verseData.book,
      chapter: verseData.chapter,
      verse_number: verseData.verse_number,
      text: verseData.text,
      translation: verseData.translation,
      category: null,
      difficulty: null,
      context: null,
      context_generated_by_ai: false,
      context_generated_at: null,
      is_memorable: false,
      created_at: new Date().toISOString()
    };

    logger.log('[dailyVerseService] Got daily verse:', verse.book, verse.chapter, verse.verse_number);
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
