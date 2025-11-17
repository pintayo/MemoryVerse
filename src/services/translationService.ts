/**
 * Translation Service (Premium Feature - v1.2)
 *
 * Provides access to multiple Bible translations:
 * - ESV (Free - default)
 * - NIV, KJV, NLT, NASB, NKJV (Premium)
 * - Side-by-side comparison
 * - Translation switching
 * - User preferences
 *
 * Feature Flag: multipleTranslations
 * Premium: Yes (All tiers for premium translations)
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import type { BibleTranslation, VerseTranslation, Verse } from '../types/database';

// =============================================
// TYPES & INTERFACES
// =============================================

export interface VerseWithTranslations extends Verse {
  translations?: Array<{
    translation: BibleTranslation;
    text: string;
  }>;
}

export interface TranslationComparison {
  verse: {
    book: string;
    chapter: number;
    verseNumber: number;
  };
  translations: Array<{
    code: string;
    name: string;
    fullName: string;
    text: string;
    isPremium: boolean;
  }>;
}

// =============================================
// TRANSLATION MANAGEMENT
// =============================================

/**
 * Get all available translations
 */
export async function getAllTranslations(
  includeInactive: boolean = false
): Promise<BibleTranslation[]> {
  try {
    let query = supabase.from('bible_translations').select('*').order('sort_order');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('[Translation] Error fetching translations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('[Translation] Exception fetching translations:', error);
    return [];
  }
}

/**
 * Get translation by code
 */
export async function getTranslationByCode(
  code: string
): Promise<BibleTranslation | null> {
  try {
    const { data, error } = await supabase
      .from('bible_translations')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      logger.error('[Translation] Error fetching translation:', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('[Translation] Exception fetching translation:', error);
    return null;
  }
}

/**
 * Get free translations (available to all users)
 */
export async function getFreeTranslations(): Promise<BibleTranslation[]> {
  try {
    const { data, error } = await supabase
      .from('bible_translations')
      .select('*')
      .eq('is_premium', false)
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      logger.error('[Translation] Error fetching free translations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('[Translation] Exception fetching free translations:', error);
    return [];
  }
}

/**
 * Get premium translations
 */
export async function getPremiumTranslations(): Promise<BibleTranslation[]> {
  try {
    const { data, error } = await supabase
      .from('bible_translations')
      .select('*')
      .eq('is_premium', true)
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      logger.error('[Translation] Error fetching premium translations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('[Translation] Exception fetching premium translations:', error);
    return [];
  }
}

/**
 * Check if user can access a translation
 */
export async function canAccessTranslation(
  translationCode: string,
  isPremium: boolean
): Promise<boolean> {
  try {
    const translation = await getTranslationByCode(translationCode);

    if (!translation) {
      return false;
    }

    // Inactive translations are not accessible
    if (!translation.is_active) {
      return false;
    }

    // Free translations are accessible to everyone
    if (!translation.is_premium) {
      return true;
    }

    // Premium translations require premium subscription
    return isPremium;
  } catch (error) {
    logger.error('[Translation] Exception checking access:', error);
    return false;
  }
}

// =============================================
// VERSE TRANSLATION MANAGEMENT
// =============================================

/**
 * Get verse in a specific translation
 */
export async function getVerseInTranslation(
  verseId: string,
  translationCode: string
): Promise<string | null> {
  try {
    // First get the translation ID
    const translation = await getTranslationByCode(translationCode);
    if (!translation) {
      logger.error('[Translation] Translation not found:', translationCode);
      return null;
    }

    // Get the verse translation
    const { data, error } = await supabase
      .from('verses_translations')
      .select('text')
      .eq('verse_id', verseId)
      .eq('translation_id', translation.id)
      .single();

    if (error) {
      logger.error('[Translation] Error fetching verse translation:', error);
      return null;
    }

    return data?.text || null;
  } catch (error) {
    logger.error('[Translation] Exception fetching verse translation:', error);
    return null;
  }
}

/**
 * Get verse with multiple translations
 */
export async function getVerseWithTranslations(
  verseId: string,
  translationCodes: string[]
): Promise<VerseWithTranslations | null> {
  try {
    // Get the base verse
    const { data: verse, error: verseError } = await supabase
      .from('verses')
      .select('*')
      .eq('id', verseId)
      .single();

    if (verseError || !verse) {
      logger.error('[Translation] Error fetching verse:', verseError);
      return null;
    }

    // Get all requested translations
    const translations: Array<{
      translation: BibleTranslation;
      text: string;
    }> = [];

    for (const code of translationCodes) {
      const translation = await getTranslationByCode(code);
      if (!translation) continue;

      const { data: verseTranslation } = await supabase
        .from('verses_translations')
        .select('text')
        .eq('verse_id', verseId)
        .eq('translation_id', translation.id)
        .single();

      if (verseTranslation) {
        translations.push({
          translation,
          text: verseTranslation.text,
        });
      }
    }

    return {
      ...verse,
      translations,
    };
  } catch (error) {
    logger.error('[Translation] Exception fetching verse with translations:', error);
    return null;
  }
}

/**
 * Compare verse across multiple translations
 */
export async function compareTranslations(
  book: string,
  chapter: number,
  verseNumber: number,
  translationCodes: string[]
): Promise<TranslationComparison | null> {
  try {
    // Get the verse (any translation to get the verse_id)
    const { data: baseVerse, error: verseError } = await supabase
      .from('verses')
      .select('id')
      .eq('book', book)
      .eq('chapter', chapter)
      .eq('verse_number', verseNumber)
      .limit(1)
      .single();

    if (verseError || !baseVerse) {
      logger.error('[Translation] Error fetching verse:', verseError);
      return null;
    }

    const translations: TranslationComparison['translations'] = [];

    for (const code of translationCodes) {
      const translation = await getTranslationByCode(code);
      if (!translation) continue;

      const { data: verseTranslation } = await supabase
        .from('verses_translations')
        .select('text')
        .eq('verse_id', baseVerse.id)
        .eq('translation_id', translation.id)
        .single();

      translations.push({
        code: translation.code,
        name: translation.name,
        fullName: translation.full_name,
        text: verseTranslation?.text || 'Translation not available',
        isPremium: translation.is_premium,
      });
    }

    return {
      verse: {
        book,
        chapter,
        verseNumber,
      },
      translations,
    };
  } catch (error) {
    logger.error('[Translation] Exception comparing translations:', error);
    return null;
  }
}

// =============================================
// USER PREFERENCES
// =============================================

/**
 * Set user's preferred translation
 */
export async function setPreferredTranslation(
  userId: string,
  translationCode: string
): Promise<boolean> {
  try {
    const translation = await getTranslationByCode(translationCode);
    if (!translation) {
      logger.error('[Translation] Translation not found:', translationCode);
      return false;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        preferred_translation_id: translation.id,
      })
      .eq('id', userId);

    if (error) {
      logger.error('[Translation] Error setting preferred translation:', error);
      return false;
    }

    logger.log('[Translation] Preferred translation set:', translationCode);
    return true;
  } catch (error) {
    logger.error('[Translation] Exception setting preferred translation:', error);
    return false;
  }
}

/**
 * Get user's preferred translation
 */
export async function getPreferredTranslation(
  userId: string
): Promise<BibleTranslation | null> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('preferred_translation_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile || !profile.preferred_translation_id) {
      // Default to ESV
      return await getTranslationByCode('ESV');
    }

    const { data: translation, error: translationError } = await supabase
      .from('bible_translations')
      .select('*')
      .eq('id', profile.preferred_translation_id)
      .single();

    if (translationError) {
      logger.error('[Translation] Error fetching preferred translation:', translationError);
      return await getTranslationByCode('ESV');
    }

    return translation;
  } catch (error) {
    logger.error('[Translation] Exception getting preferred translation:', error);
    return null;
  }
}

// =============================================
// BULK OPERATIONS
// =============================================

/**
 * Add translation for a verse
 * (Admin/system function to populate translation data)
 */
export async function addVerseTranslation(
  verseId: string,
  translationCode: string,
  text: string
): Promise<boolean> {
  try {
    const translation = await getTranslationByCode(translationCode);
    if (!translation) {
      logger.error('[Translation] Translation not found:', translationCode);
      return false;
    }

    const { error } = await supabase.from('verses_translations').upsert(
      {
        verse_id: verseId,
        translation_id: translation.id,
        text,
      },
      {
        onConflict: 'verse_id,translation_id',
      }
    );

    if (error) {
      logger.error('[Translation] Error adding verse translation:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('[Translation] Exception adding verse translation:', error);
    return false;
  }
}

/**
 * Get verses that are missing a translation
 * (Helper for data population)
 */
export async function getVersesMissingTranslation(
  translationCode: string,
  limit: number = 100
): Promise<Verse[]> {
  try {
    const translation = await getTranslationByCode(translationCode);
    if (!translation) {
      return [];
    }

    // Get all verses
    const { data: allVerses } = await supabase
      .from('verses')
      .select('id')
      .limit(limit);

    if (!allVerses) return [];

    // Get verses that have this translation
    const { data: translatedVerses } = await supabase
      .from('verses_translations')
      .select('verse_id')
      .eq('translation_id', translation.id);

    const translatedVerseIds = new Set(
      translatedVerses?.map((v) => v.verse_id) || []
    );

    // Find missing verses
    const missingVerseIds = allVerses
      .filter((v) => !translatedVerseIds.has(v.id))
      .map((v) => v.id);

    if (missingVerseIds.length === 0) {
      return [];
    }

    const { data: missingVerses } = await supabase
      .from('verses')
      .select('*')
      .in('id', missingVerseIds);

    return missingVerses || [];
  } catch (error) {
    logger.error('[Translation] Exception getting missing translations:', error);
    return [];
  }
}

// =============================================
// SEARCH WITH TRANSLATION
// =============================================

/**
 * Search verses in a specific translation
 */
export async function searchVersesInTranslation(
  searchQuery: string,
  translationCode: string,
  limit: number = 20
): Promise<Verse[]> {
  try {
    const translation = await getTranslationByCode(translationCode);
    if (!translation) {
      logger.error('[Translation] Translation not found:', translationCode);
      return [];
    }

    // Search in verses_translations table
    const { data: verseTranslations, error } = await supabase
      .from('verses_translations')
      .select('verse_id, text')
      .eq('translation_id', translation.id)
      .ilike('text', `%${searchQuery}%`)
      .limit(limit);

    if (error) {
      logger.error('[Translation] Error searching verses:', error);
      return [];
    }

    if (!verseTranslations || verseTranslations.length === 0) {
      return [];
    }

    // Get full verse details
    const verseIds = verseTranslations.map((vt) => vt.verse_id);
    const { data: verses } = await supabase
      .from('verses')
      .select('*')
      .in('id', verseIds);

    return verses || [];
  } catch (error) {
    logger.error('[Translation] Exception searching verses:', error);
    return [];
  }
}

// =============================================
// EXPORTS
// =============================================

export default {
  getAllTranslations,
  getTranslationByCode,
  getFreeTranslations,
  getPremiumTranslations,
  canAccessTranslation,
  getVerseInTranslation,
  getVerseWithTranslations,
  compareTranslations,
  setPreferredTranslation,
  getPreferredTranslation,
  addVerseTranslation,
  getVersesMissingTranslation,
  searchVersesInTranslation,
};
