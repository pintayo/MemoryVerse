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
 */
export async function getTodaysDailyVerse(translation: string = 'KJV'): Promise<Verse | null> {
  try {
    // Get today's date in user's local timezone (YYYY-MM-DD)
    const today = new Date();
    const localDate = today.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format

    logger.log('[dailyVerseService] Fetching daily verse for date:', localDate, 'translation:', translation);

    // Try to get existing daily verse for this date
    const { data: existingVerse, error: fetchError } = await supabase
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
      .eq('date', localDate)
      .eq('translation', translation)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.error('[dailyVerseService] Error fetching daily verse:', fetchError);
      throw fetchError;
    }

    // If verse exists for today, return it
    if (existingVerse?.verses) {
      const verse = existingVerse.verses as any as Verse;
      logger.log('[dailyVerseService] Found existing daily verse:', verse.book, verse.chapter, verse.verse_number);
      return verse;
    }

    // No verse for today yet - create one by selecting a random memorable verse
    logger.log('[dailyVerseService] No verse for today, creating new one...');

    // Get a random memorable verse
    let { data: randomVerses, error: randomError } = await supabase
      .from('verses')
      .select('*')
      .eq('translation', translation)
      .eq('is_memorable', true)
      .limit(100);

    // If no memorable verses, get any verses
    if (!randomVerses || randomVerses.length === 0) {
      const result = await supabase
        .from('verses')
        .select('*')
        .eq('translation', translation)
        .limit(100);

      randomVerses = result.data;
      randomError = result.error;
    }

    if (randomError || !randomVerses || randomVerses.length === 0) {
      logger.error('[dailyVerseService] No verses available');
      return null;
    }

    // Pick a random verse from the pool
    const randomVerse = randomVerses[Math.floor(Math.random() * randomVerses.length)] as Verse;

    // Store it as today's verse
    const { error: insertError } = await supabase
      .from('daily_verses')
      .insert({
        date: localDate,
        verse_id: randomVerse.id,
        translation: translation,
      });

    if (insertError) {
      logger.error('[dailyVerseService] Error storing daily verse:', insertError);
      // Continue anyway - just return the verse
    } else {
      logger.log('[dailyVerseService] Created new daily verse for', localDate);
    }

    return randomVerse;
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
