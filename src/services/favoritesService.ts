/**
 * Favorites Service
 * Manages user's favorite/starred verses
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { Verse } from '../types/database';

export interface UserFavorite {
  id: string;
  user_id: string;
  verse_id: string;
  created_at: string;
  notes?: string;
}

export interface FavoriteVerse extends Verse {
  favorite_id: string;
  favorited_at: string;
  notes?: string;
}

export const favoritesService = {
  /**
   * Check if a verse is favorited
   */
  async isFavorited(userId: string, verseId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('verse_id', verseId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return !!data;
    } catch (error) {
      logger.error('[FavoritesService] Error checking if favorited:', error);
      return false;
    }
  },

  /**
   * Add a verse to favorites
   */
  async addFavorite(userId: string, verseId: string, notes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: userId,
          verse_id: verseId,
          notes,
        });

      if (error) {
        // Check if already favorited (duplicate key error)
        if (error.code === '23505') {
          return { success: true }; // Already favorited, consider it success
        }
        throw error;
      }

      logger.log('[FavoritesService] Verse favorited:', verseId);
      return { success: true };
    } catch (error) {
      logger.error('[FavoritesService] Error adding favorite:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add favorite',
      };
    }
  },

  /**
   * Remove a verse from favorites
   */
  async removeFavorite(userId: string, verseId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('verse_id', verseId);

      if (error) throw error;

      logger.log('[FavoritesService] Verse unfavorited:', verseId);
      return { success: true };
    } catch (error) {
      logger.error('[FavoritesService] Error removing favorite:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove favorite',
      };
    }
  },

  /**
   * Toggle favorite status
   */
  async toggleFavorite(userId: string, verseId: string): Promise<{ isFavorited: boolean; success: boolean; error?: string }> {
    try {
      const isFavorited = await this.isFavorited(userId, verseId);

      if (isFavorited) {
        const result = await this.removeFavorite(userId, verseId);
        return { isFavorited: false, ...result };
      } else {
        const result = await this.addFavorite(userId, verseId);
        return { isFavorited: true, ...result };
      }
    } catch (error) {
      logger.error('[FavoritesService] Error toggling favorite:', error);
      return {
        isFavorited: false,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle favorite',
      };
    }
  },

  /**
   * Get all favorite verses for a user
   */
  async getFavorites(userId: string, options?: {
    category?: string;
    translation?: string;
    sortBy?: 'recent' | 'book' | 'category';
  }): Promise<FavoriteVerse[]> {
    try {
      let query = supabase
        .from('user_favorites')
        .select(`
          id,
          user_id,
          verse_id,
          created_at,
          notes,
          verses:verse_id (
            id,
            book,
            chapter,
            verse_number,
            text,
            translation,
            category,
            difficulty,
            context
          )
        `)
        .eq('user_id', userId);

      // Apply translation filter to joined verses table
      if (options?.translation) {
        query = query.eq('verses.translation', options.translation);
      }

      // Apply category filter
      if (options?.category) {
        query = query.eq('verses.category', options.category);
      }

      // Apply sorting
      switch (options?.sortBy) {
        case 'book':
          query = query.order('verses.book', { ascending: true });
          break;
        case 'category':
          query = query.order('verses.category', { ascending: true });
          break;
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to flatten the verses object
      const favorites: FavoriteVerse[] = (data || []).map((fav: any) => ({
        ...fav.verses,
        favorite_id: fav.id,
        favorited_at: fav.created_at,
        notes: fav.notes,
      }));

      logger.log(`[FavoritesService] Loaded ${favorites.length} favorites`);
      return favorites;
    } catch (error) {
      logger.error('[FavoritesService] Error getting favorites:', error);
      return [];
    }
  },

  /**
   * Get favorite count for a user
   */
  async getFavoriteCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('user_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      logger.error('[FavoritesService] Error getting favorite count:', error);
      return 0;
    }
  },

  /**
   * Get unique categories from favorited verses
   */
  async getFavoriteCategories(userId: string): Promise<string[]> {
    try {
      const favorites = await this.getFavorites(userId);

      // Extract unique categories
      const categories = [...new Set(
        favorites
          .map(fav => fav.category)
          .filter((cat): cat is string => !!cat)
      )];

      return categories.sort();
    } catch (error) {
      logger.error('[FavoritesService] Error getting categories:', error);
      return [];
    }
  },

  /**
   * Update notes for a favorite
   */
  async updateNotes(userId: string, verseId: string, notes: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .update({ notes })
        .eq('user_id', userId)
        .eq('verse_id', verseId);

      if (error) throw error;

      logger.log('[FavoritesService] Notes updated for verse:', verseId);
      return { success: true };
    } catch (error) {
      logger.error('[FavoritesService] Error updating notes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update notes',
      };
    }
  },

  /**
   * Remove all favorites for a user
   */
  async clearAllFavorites(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      logger.log('[FavoritesService] All favorites cleared for user:', userId);
      return { success: true };
    } catch (error) {
      logger.error('[FavoritesService] Error clearing favorites:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear favorites',
      };
    }
  },
};

logger.log('[favoritesService] Module loaded');
