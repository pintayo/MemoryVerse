/**
 * Offline Mode Service
 * Premium feature for downloading Bible books for offline use
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Verse } from '../types/database';
import { logger } from '../utils/logger';

const OFFLINE_STORAGE_PREFIX = 'offline_book_';
const DOWNLOADED_BOOKS_KEY = 'downloaded_books_list';

export interface DownloadedBook {
  id?: string;
  user_id: string;
  book: string;
  translation: string;
  downloaded_at: string;
  verse_count: number;
  storage_size_bytes: number;
}

export interface DownloadProgress {
  book: string;
  translation: string;
  currentVerse: number;
  totalVerses: number;
  percentage: number;
}

class OfflineService {
  /**
   * Check if a specific book is downloaded for offline use
   */
  async isBookDownloaded(book: string, translation: string = 'KJV'): Promise<boolean> {
    try {
      const key = this.getStorageKey(book, translation);
      const data = await AsyncStorage.getItem(key);
      return data !== null;
    } catch (error) {
      logger.error('[OfflineService] Error checking if book is downloaded:', error);
      return false;
    }
  }

  /**
   * Get list of all downloaded books for a user
   */
  async getDownloadedBooks(userId: string): Promise<DownloadedBook[]> {
    try {
      // First try to get from server
      const { data, error } = await supabase
        .from('downloaded_books')
        .select('*')
        .eq('user_id', userId)
        .order('downloaded_at', { ascending: false });

      if (error) throw error;

      // Also check local storage for any books not synced
      const localBooks = await this.getLocalDownloadedBooks();

      // Merge and deduplicate
      const allBooks = [...(data || [])];
      localBooks.forEach(localBook => {
        const exists = allBooks.some(
          b => b.book === localBook.book && b.translation === localBook.translation
        );
        if (!exists) {
          allBooks.push(localBook);
        }
      });

      return allBooks;
    } catch (error) {
      logger.error('[OfflineService] Error getting downloaded books:', error);
      // Fallback to local storage only
      return this.getLocalDownloadedBooks();
    }
  }

  /**
   * Download a specific book for offline use
   */
  async downloadBook(
    userId: string,
    book: string,
    translation: string = 'KJV',
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.log(`[OfflineService] Starting download for ${book} (${translation})`);

      // Check if already downloaded
      const isDownloaded = await this.isBookDownloaded(book, translation);
      if (isDownloaded) {
        return { success: true };
      }

      // Fetch all verses for this book
      const { data: verses, error } = await supabase
        .from('verses')
        .select('*')
        .eq('book', book)
        .eq('translation', translation)
        .order('chapter')
        .order('verse_number');

      if (error) throw error;
      if (!verses || verses.length === 0) {
        return { success: false, error: 'No verses found for this book' };
      }

      // Report initial progress
      const totalVerses = verses.length;
      onProgress?.({
        book,
        translation,
        currentVerse: 0,
        totalVerses,
        percentage: 0,
      });

      // Store verses in AsyncStorage
      const key = this.getStorageKey(book, translation);
      const dataToStore = JSON.stringify(verses);
      await AsyncStorage.setItem(key, dataToStore);

      // Calculate storage size
      const storageSizeBytes = new Blob([dataToStore]).size;

      // Report completion
      onProgress?.({
        book,
        translation,
        currentVerse: totalVerses,
        totalVerses,
        percentage: 100,
      });

      // Record in database
      const downloadedBook: Omit<DownloadedBook, 'id'> = {
        user_id: userId,
        book,
        translation,
        downloaded_at: new Date().toISOString(),
        verse_count: totalVerses,
        storage_size_bytes: storageSizeBytes,
      };

      // Save to Supabase
      const { error: dbError } = await supabase
        .from('downloaded_books')
        .upsert(downloadedBook, {
          onConflict: 'user_id,book,translation',
        });

      if (dbError) {
        logger.warn('[OfflineService] Could not sync to server:', dbError);
        // Still continue - save locally
      }

      // Update local list
      await this.updateLocalDownloadedBooksList(downloadedBook);

      logger.log(`[OfflineService] Successfully downloaded ${book} (${totalVerses} verses)`);
      return { success: true };
    } catch (error) {
      logger.error('[OfflineService] Error downloading book:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to download book',
      };
    }
  }

  /**
   * Get verses from a downloaded book
   */
  async getOfflineVerses(book: string, translation: string = 'KJV'): Promise<Verse[]> {
    try {
      const key = this.getStorageKey(book, translation);
      const data = await AsyncStorage.getItem(key);

      if (!data) {
        logger.warn(`[OfflineService] Book ${book} not found in offline storage`);
        return [];
      }

      return JSON.parse(data);
    } catch (error) {
      logger.error('[OfflineService] Error getting offline verses:', error);
      return [];
    }
  }

  /**
   * Get a specific verse from offline storage
   */
  async getOfflineVerse(
    book: string,
    chapter: number,
    verseNumber: number,
    translation: string = 'KJV'
  ): Promise<Verse | null> {
    try {
      const verses = await this.getOfflineVerses(book, translation);
      return (
        verses.find(v => v.chapter === chapter && v.verse_number === verseNumber) || null
      );
    } catch (error) {
      logger.error('[OfflineService] Error getting offline verse:', error);
      return null;
    }
  }

  /**
   * Delete a downloaded book
   */
  async deleteDownloadedBook(
    userId: string,
    book: string,
    translation: string = 'KJV'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Remove from AsyncStorage
      const key = this.getStorageKey(book, translation);
      await AsyncStorage.removeItem(key);

      // Remove from Supabase
      const { error: dbError } = await supabase
        .from('downloaded_books')
        .delete()
        .eq('user_id', userId)
        .eq('book', book)
        .eq('translation', translation);

      if (dbError) {
        logger.warn('[OfflineService] Could not sync deletion to server:', dbError);
      }

      // Update local list
      await this.removeFromLocalDownloadedBooksList(book, translation);

      logger.log(`[OfflineService] Deleted ${book} (${translation})`);
      return { success: true };
    } catch (error) {
      logger.error('[OfflineService] Error deleting downloaded book:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete book',
      };
    }
  }

  /**
   * Get total storage used by offline books
   */
  async getTotalStorageUsed(): Promise<number> {
    try {
      const books = await this.getLocalDownloadedBooks();
      return books.reduce((total, book) => total + (book.storage_size_bytes || 0), 0);
    } catch (error) {
      logger.error('[OfflineService] Error getting total storage:', error);
      return 0;
    }
  }

  /**
   * Clear all downloaded books
   */
  async clearAllDownloads(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const books = await this.getLocalDownloadedBooks();

      // Remove all from AsyncStorage
      for (const book of books) {
        const key = this.getStorageKey(book.book, book.translation);
        await AsyncStorage.removeItem(key);
      }

      // Remove all from Supabase
      const { error: dbError } = await supabase
        .from('downloaded_books')
        .delete()
        .eq('user_id', userId);

      if (dbError) {
        logger.warn('[OfflineService] Could not sync clear to server:', dbError);
      }

      // Clear local list
      await AsyncStorage.removeItem(DOWNLOADED_BOOKS_KEY);

      logger.log('[OfflineService] Cleared all downloads');
      return { success: true };
    } catch (error) {
      logger.error('[OfflineService] Error clearing downloads:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear downloads',
      };
    }
  }

  /**
   * Sync local downloads with server
   */
  async syncWithServer(userId: string): Promise<void> {
    try {
      const localBooks = await this.getLocalDownloadedBooks();

      for (const book of localBooks) {
        // Check if exists in server
        const { data, error } = await supabase
          .from('downloaded_books')
          .select('id')
          .eq('user_id', userId)
          .eq('book', book.book)
          .eq('translation', book.translation)
          .single();

        if (error || !data) {
          // Doesn't exist in server, upload it
          await supabase.from('downloaded_books').insert({
            user_id: userId,
            book: book.book,
            translation: book.translation,
            downloaded_at: book.downloaded_at,
            verse_count: book.verse_count,
            storage_size_bytes: book.storage_size_bytes,
          });
        }
      }

      logger.log('[OfflineService] Synced with server');
    } catch (error) {
      logger.error('[OfflineService] Error syncing with server:', error);
    }
  }

  // Private helper methods

  private getStorageKey(book: string, translation: string): string {
    return `${OFFLINE_STORAGE_PREFIX}${book}_${translation}`;
  }

  private async getLocalDownloadedBooks(): Promise<DownloadedBook[]> {
    try {
      const data = await AsyncStorage.getItem(DOWNLOADED_BOOKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('[OfflineService] Error getting local downloaded books:', error);
      return [];
    }
  }

  private async updateLocalDownloadedBooksList(book: Omit<DownloadedBook, 'id'>): Promise<void> {
    try {
      const books = await this.getLocalDownloadedBooks();

      // Check if already exists
      const existingIndex = books.findIndex(
        b => b.book === book.book && b.translation === book.translation
      );

      if (existingIndex >= 0) {
        // Update existing
        books[existingIndex] = { ...books[existingIndex], ...book };
      } else {
        // Add new
        books.push(book as DownloadedBook);
      }

      await AsyncStorage.setItem(DOWNLOADED_BOOKS_KEY, JSON.stringify(books));
    } catch (error) {
      logger.error('[OfflineService] Error updating local downloaded books list:', error);
    }
  }

  private async removeFromLocalDownloadedBooksList(
    book: string,
    translation: string
  ): Promise<void> {
    try {
      const books = await this.getLocalDownloadedBooks();
      const filtered = books.filter(b => !(b.book === book && b.translation === translation));
      await AsyncStorage.setItem(DOWNLOADED_BOOKS_KEY, JSON.stringify(filtered));
    } catch (error) {
      logger.error('[OfflineService] Error removing from local downloaded books list:', error);
    }
  }

  /**
   * Format storage size for display
   */
  formatStorageSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}

// Export singleton instance
export const offlineService = new OfflineService();

logger.log('[offlineService] Module loaded');
