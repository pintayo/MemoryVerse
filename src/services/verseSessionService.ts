/**
 * Verse Session Service
 *
 * Manages 5-verse learning sessions with pre-loading of context
 */

import { verseService } from './verseService';
import { Verse } from '../types/database';
import { logger } from '../utils/logger';

export interface VerseSession {
  verses: Verse[];
  currentIndex: number;
  book: string | null;
  chapter: number | null;
}

interface VerseWithContext {
  verse: Verse;
  context: string | null;
  isLoading: boolean;
}

class VerseSessionService {
  private sessions: Map<string, VerseSession> = new Map();
  private contextCache: Map<string, string> = new Map();
  private preloadQueue: Set<string> = new Set();

  /**
   * Create a new 5-verse learning session starting with a specific verse
   */
  async createSessionWithVerse(
    verseId: string,
    translation: string = 'KJV'
  ): Promise<VerseSession> {
    try {
      logger.log('[VerseSession] Creating session starting with verse:', verseId);

      // Get the specific verse first
      const specificVerse = await verseService.getVerseById(verseId);
      if (!specificVerse) {
        throw new Error('Verse not found');
      }

      const verses: Verse[] = [specificVerse];

      // Load 4 more random verses from the same book/chapter
      for (let i = 0; i < 4; i++) {
        const verse = await verseService.getRandomVerse(
          translation,
          specificVerse.book,
          specificVerse.chapter
        );
        if (verse && verse.id !== specificVerse.id) {
          verses.push(verse);
        }
      }

      const session: VerseSession = {
        verses,
        currentIndex: 0,
        book: specificVerse.book,
        chapter: specificVerse.chapter,
      };

      const sessionId = this.generateSessionId(specificVerse.book, specificVerse.chapter);
      this.sessions.set(sessionId, session);

      // Start pre-loading context for all verses
      this.preloadContextForSession(session);

      logger.log('[VerseSession] Session created with specific verse, total:', verses.length, 'verses');
      return session;
    } catch (error) {
      logger.error('[VerseSession] Error creating session with verse:', error);
      throw error;
    }
  }

  /**
   * Create a new 5-verse learning session
   */
  async createSession(
    translation: string = 'KJV',
    book?: string | null,
    chapter?: number | null
  ): Promise<VerseSession> {
    try {
      logger.log('[VerseSession] Creating session:', { book, chapter });

      const verses: Verse[] = [];

      // Load 5 random verses from the specified chapter/book or all
      for (let i = 0; i < 5; i++) {
        const verse = await verseService.getRandomVerse(translation, book ?? undefined, chapter ?? undefined);
        if (verse) {
          verses.push(verse);
        }
      }

      if (verses.length === 0) {
        throw new Error('No verses found');
      }

      const session: VerseSession = {
        verses,
        currentIndex: 0,
        book: book || null,
        chapter: chapter || null,
      };

      const sessionId = this.generateSessionId(book, chapter);
      this.sessions.set(sessionId, session);

      // Start pre-loading context for all verses
      this.preloadContextForSession(session);

      logger.log('[VerseSession] Session created with', verses.length, 'verses');
      return session;
    } catch (error) {
      logger.error('[VerseSession] Error creating session:', error);
      throw error;
    }
  }

  /**
   * Get current verse in session with its context
   */
  async getCurrentVerse(session: VerseSession): Promise<VerseWithContext> {
    const verse = session.verses[session.currentIndex];

    if (!verse) {
      throw new Error('No verse at current index');
    }

    // Check cache first
    if (this.contextCache.has(verse.id)) {
      return {
        verse,
        context: this.contextCache.get(verse.id) || null,
        isLoading: false,
      };
    }

    // Load context if not in cache
    const result = await verseService.getVerseWithContext(verse.id);

    if (result.context) {
      this.contextCache.set(verse.id, result.context);
    }

    return {
      verse,
      context: result.context,
      isLoading: false,
    };
  }

  /**
   * Move to next verse in session
   */
  nextVerse(session: VerseSession): boolean {
    if (session.currentIndex < session.verses.length - 1) {
      session.currentIndex++;
      return true;
    }
    return false;
  }

  /**
   * Move to previous verse in session
   */
  previousVerse(session: VerseSession): boolean {
    if (session.currentIndex > 0) {
      session.currentIndex--;
      return true;
    }
    return false;
  }

  /**
   * Check if there is a next verse
   */
  hasNext(session: VerseSession): boolean {
    return session.currentIndex < session.verses.length - 1;
  }

  /**
   * Check if there is a previous verse
   */
  hasPrevious(session: VerseSession): boolean {
    return session.currentIndex > 0;
  }

  /**
   * Get session progress (e.g., "2 of 5")
   */
  getProgress(session: VerseSession): { current: number; total: number } {
    return {
      current: session.currentIndex + 1,
      total: session.verses.length,
    };
  }

  /**
   * Pre-load context for all verses in session
   */
  private async preloadContextForSession(session: VerseSession): Promise<void> {
    logger.log('[VerseSession] Pre-loading context for', session.verses.length, 'verses');

    // Load context for all verses in background
    const promises = session.verses.map(async (verse) => {
      // Skip if already in cache or being loaded
      if (this.contextCache.has(verse.id) || this.preloadQueue.has(verse.id)) {
        return;
      }

      this.preloadQueue.add(verse.id);

      try {
        const result = await verseService.getVerseWithContext(verse.id);
        if (result.context) {
          this.contextCache.set(verse.id, result.context);
          logger.log('[VerseSession] Pre-loaded context for verse:', verse.id);
        }
      } catch (error) {
        logger.error('[VerseSession] Error pre-loading context for', verse.id, error);
      } finally {
        this.preloadQueue.delete(verse.id);
      }
    });

    // Don't await - let it run in background
    Promise.all(promises).then(() => {
      logger.log('[VerseSession] Finished pre-loading context for session');
    });
  }

  /**
   * Clear session and cache
   */
  clearSession(book: string | null, chapter: number | null): void {
    const sessionId = this.generateSessionId(book, chapter);
    this.sessions.delete(sessionId);
    // Keep context cache for performance
    logger.log('[VerseSession] Session cleared');
  }

  /**
   * Clear all cached context
   */
  clearCache(): void {
    this.contextCache.clear();
    this.preloadQueue.clear();
    logger.log('[VerseSession] Cache cleared');
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(book: string | null, chapter: number | null): string {
    return `${book || 'all'}_${chapter || 'all'}`;
  }
}

export const verseSessionService = new VerseSessionService();
