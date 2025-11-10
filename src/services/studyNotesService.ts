/**
 * Study Notes Service
 * Handles CRUD operations for verse study notes
 */

import { supabase } from '../lib/supabase';
import { VerseNote } from '../types/database';
import { logger } from '../utils/logger';

class StudyNotesService {
  /**
   * Get note for a specific verse
   */
  async getVerseNote(userId: string, verseId: string): Promise<VerseNote | null> {
    try {
      const { data, error } = await supabase
        .from('verse_notes')
        .select('*')
        .eq('user_id', userId)
        .eq('verse_id', verseId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('[StudyNotesService] Error getting verse note:', error);
      return null;
    }
  }

  /**
   * Get all notes for a user
   */
  async getAllUserNotes(userId: string): Promise<VerseNote[]> {
    try {
      const { data, error } = await supabase
        .from('verse_notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('[StudyNotesService] Error getting all notes:', error);
      return [];
    }
  }

  /**
   * Create or update a note
   */
  async saveNote(
    userId: string,
    verseId: string,
    noteText: string
  ): Promise<VerseNote | null> {
    try {
      // Check if note already exists
      const existingNote = await this.getVerseNote(userId, verseId);

      if (existingNote) {
        // Update existing note
        const { data, error } = await supabase
          .from('verse_notes')
          .update({
            note_text: noteText,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingNote.id)
          .select()
          .single();

        if (error) throw error;
        logger.log('[StudyNotesService] Note updated successfully');
        return data;
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('verse_notes')
          .insert({
            user_id: userId,
            verse_id: verseId,
            note_text: noteText,
          })
          .select()
          .single();

        if (error) throw error;
        logger.log('[StudyNotesService] Note created successfully');
        return data;
      }
    } catch (error) {
      logger.error('[StudyNotesService] Error saving note:', error);
      return null;
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('verse_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      logger.log('[StudyNotesService] Note deleted successfully');
      return true;
    } catch (error) {
      logger.error('[StudyNotesService] Error deleting note:', error);
      return false;
    }
  }

  /**
   * Get notes with verse details (for displaying in notes list)
   */
  async getNotesWithVerses(userId: string): Promise<Array<VerseNote & { verse?: any }>> {
    try {
      const { data, error } = await supabase
        .from('verse_notes')
        .select(`
          *,
          verses (*)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Map to include verse data
      const notesWithVerses = (data || []).map((item: any) => ({
        ...item,
        verse: item.verses,
      }));

      return notesWithVerses;
    } catch (error) {
      logger.error('[StudyNotesService] Error getting notes with verses:', error);
      return [];
    }
  }

  /**
   * Search notes by content
   */
  async searchNotes(userId: string, query: string): Promise<VerseNote[]> {
    try {
      const { data, error } = await supabase
        .from('verse_notes')
        .select('*')
        .eq('user_id', userId)
        .ilike('note_text', `%${query}%`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('[StudyNotesService] Error searching notes:', error);
      return [];
    }
  }

  /**
   * Get note count for user
   */
  async getNoteCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('verse_notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error('[StudyNotesService] Error getting note count:', error);
      return 0;
    }
  }
}

export const studyNotesService = new StudyNotesService();

logger.log('[studyNotesService] Module loaded');
