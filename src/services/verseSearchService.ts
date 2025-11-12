/**
 * Verse Search Service
 * Handles verse searching with filters and history
 */

import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Verse } from '../types/database';
import { logger } from '../utils/logger';

const SEARCH_HISTORY_KEY = 'verse_search_history';
const MAX_HISTORY_ITEMS = 10;

export interface SearchFilters {
  translation?: string;
  category?: string;
  difficulty?: number;
  book?: string;
}

export interface SearchResult extends Verse {
  highlightedText?: string;
}

export interface SearchHistory {
  query: string;
  timestamp: string;
  filters?: SearchFilters;
}

class VerseSearchService {
  /**
   * Search verses by keyword with optional filters
   */
  async searchVerses(
    query: string,
    filters?: SearchFilters,
    limit: number = 50
  ): Promise<SearchResult[]> {
    try {
      logger.log(`[VerseSearchService] Searching for: "${query}"`);

      // Build query
      let queryBuilder = supabase
        .from('verses')
        .select('*')
        .ilike('text', `%${query}%`)
        .order('book')
        .order('chapter')
        .order('verse_number')
        .limit(limit);

      // Apply filters
      if (filters?.translation) {
        queryBuilder = queryBuilder.eq('translation', filters.translation);
      }
      if (filters?.category) {
        queryBuilder = queryBuilder.eq('category', filters.category);
      }
      if (filters?.difficulty) {
        queryBuilder = queryBuilder.eq('difficulty', filters.difficulty);
      }
      if (filters?.book) {
        queryBuilder = queryBuilder.eq('book', filters.book);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      // Add highlighting to results
      const results: SearchResult[] = (data || []).map((verse) => ({
        ...verse,
        highlightedText: this.highlightText(verse.text, query),
      }));

      logger.log(`[VerseSearchService] Found ${results.length} results`);
      return results;
    } catch (error) {
      logger.error('[VerseSearchService] Search error:', error);
      return [];
    }
  }

  /**
   * Search by reference (e.g., "John 3:16")
   */
  async searchByReference(reference: string): Promise<Verse | null> {
    try {
      // Parse reference (e.g., "John 3:16" or "1 John 3:16")
      const match = reference.match(/^(\d*\s*\w+)\s+(\d+):(\d+)$/i);
      if (!match) {
        logger.warn('[VerseSearchService] Invalid reference format:', reference);
        return null;
      }

      const [, book, chapter, verse] = match;

      const { data, error } = await supabase
        .from('verses')
        .select('*')
        .ilike('book', book.trim())
        .eq('chapter', parseInt(chapter))
        .eq('verse_number', parseInt(verse))
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('[VerseSearchService] Reference search error:', error);
      return null;
    }
  }

  /**
   * Get all unique books
   */
  async getBooks(translation: string = 'KJV'): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('verses')
        .select('book')
        .eq('translation', translation)
        .order('book');

      if (error) throw error;

      // Get unique books
      const uniqueBooks = [...new Set((data || []).map((item: any) => item.book))];
      return uniqueBooks;
    } catch (error) {
      logger.error('[VerseSearchService] Error getting books:', error);
      return [];
    }
  }

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const { data, error} = await supabase
        .from('verses')
        .select('category')
        .not('category', 'is', null)
        .order('category');

      if (error) throw error;

      // Get unique categories
      const uniqueCategories = [...new Set((data || []).map((item: any) => item.category).filter(Boolean))];
      return uniqueCategories;
    } catch (error) {
      logger.error('[VerseSearchService] Error getting categories:', error);
      return [];
    }
  }

  /**
   * Highlight search term in text
   */
  private highlightText(text: string, query: string): string {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '**$1**'); // Use markdown-style highlighting
  }

  /**
   * Save search to history
   */
  async saveToHistory(query: string, filters?: SearchFilters): Promise<void> {
    try {
      const history = await this.getHistory();

      // Add new search to beginning
      const newHistory: SearchHistory[] = [
        {
          query,
          timestamp: new Date().toISOString(),
          filters,
        },
        ...history.filter((item) => item.query !== query), // Remove duplicates
      ].slice(0, MAX_HISTORY_ITEMS); // Keep only last N items

      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      logger.log('[VerseSearchService] Saved to search history');
    } catch (error) {
      logger.error('[VerseSearchService] Error saving to history:', error);
    }
  }

  /**
   * Get search history
   */
  async getHistory(): Promise<SearchHistory[]> {
    try {
      const data = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('[VerseSearchService] Error getting history:', error);
      return [];
    }
  }

  /**
   * Clear search history
   */
  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
      logger.log('[VerseSearchService] Cleared search history');
    } catch (error) {
      logger.error('[VerseSearchService] Error clearing history:', error);
    }
  }

  /**
   * Delete specific history item
   */
  async deleteHistoryItem(query: string): Promise<void> {
    try {
      const history = await this.getHistory();
      const newHistory = history.filter((item) => item.query !== query);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      logger.log('[VerseSearchService] Deleted history item');
    } catch (error) {
      logger.error('[VerseSearchService] Error deleting history item:', error);
    }
  }
}

// Export singleton instance
export const verseSearchService = new VerseSearchService();

logger.log('[verseSearchService] Module loaded');
