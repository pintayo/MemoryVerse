import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { Card } from '../components';
import { theme } from '../theme';
import { studyNotesService } from '../services/studyNotesService';
import { VerseNote } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

interface NotesScreenProps {
  navigation: any;
}

interface NoteWithVerse extends VerseNote {
  verse?: {
    book: string;
    chapter: number;
    verse_number: number;
    text: string;
    translation: string;
  };
}

const NotesScreen: React.FC<NotesScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<NoteWithVerse[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<NoteWithVerse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteWithVerse | null>(null);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [searchQuery, notes]);

  const loadNotes = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const notesData = await studyNotesService.getNotesWithVerses(user.id);
      setNotes(notesData);
    } catch (error) {
      logger.error('[NotesScreen] Error loading notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNotes();
    setIsRefreshing(false);
  };

  const filterNotes = () => {
    if (!searchQuery.trim()) {
      setFilteredNotes(notes);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = notes.filter(
      (note) =>
        note.note_text.toLowerCase().includes(query) ||
        note.verse?.text.toLowerCase().includes(query) ||
        `${note.verse?.book} ${note.verse?.chapter}:${note.verse?.verse_number}`.toLowerCase().includes(query)
    );

    setFilteredNotes(filtered);
  };

  const handleEditNote = (note: NoteWithVerse) => {
    setEditingNote(note);
    setEditText(note.note_text);
  };

  const handleSaveEdit = async () => {
    if (!user?.id || !editingNote) return;

    if (!editText.trim()) {
      Alert.alert('Error', 'Note cannot be empty');
      return;
    }

    try {
      setIsSaving(true);
      await studyNotesService.saveNote(user.id, editingNote.verse_id, editText.trim());
      await loadNotes();
      setEditingNote(null);
      setEditText('');
    } catch (error) {
      logger.error('[NotesScreen] Error saving note:', error);
      Alert.alert('Error', 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = (note: NoteWithVerse) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await studyNotesService.deleteNote(note.id);
            if (success) {
              await loadNotes();
            } else {
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  const renderNoteCard = (note: NoteWithVerse) => {
    return (
      <Card key={note.id} variant="cream" style={styles.noteCard}>
        {/* Header */}
        <View style={styles.noteHeader}>
          <View style={styles.verseReference}>
            <Svg width="20" height="20" viewBox="0 0 24 24">
              <Path
                d="M4 6H2V20C2 21.1 2.9 22 4 22H18V20H4V6ZM20 2H8C6.9 2 6 2.9 6 4V16C6 17.1 6.9 18 8 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM19 11H9V9H19V11ZM15 15H9V13H15V15ZM19 7H9V5H19V7Z"
                fill={theme.colors.secondary.lightGold}
              />
            </Svg>
            <Text style={styles.referenceText}>
              {note.verse?.book} {note.verse?.chapter}:{note.verse?.verse_number}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.noteActions}>
            <TouchableOpacity onPress={() => handleEditNote(note)} style={styles.actionButton}>
              <Svg width="20" height="20" viewBox="0 0 24 24">
                <Path
                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                  fill={theme.colors.text.secondary}
                />
              </Svg>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleDeleteNote(note)} style={styles.actionButton}>
              <Svg width="20" height="20" viewBox="0 0 24 24">
                <Path
                  d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                  fill={theme.colors.secondary.warmTerracotta}
                />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        {/* Verse text preview */}
        <Text style={styles.verseText} numberOfLines={2}>
          "{note.verse?.text}"
        </Text>

        {/* Note content */}
        <View style={styles.noteContent}>
          <Text style={styles.noteText}>{note.note_text}</Text>
        </View>

        {/* Footer */}
        <View style={styles.noteFooter}>
          <Text style={styles.dateText}>
            Updated {formatDate(note.updated_at)}
          </Text>
          {note.verse?.translation && (
            <Text style={styles.translationText}>{note.verse.translation}</Text>
          )}
        </View>
      </Card>
    );
  };

  const renderEditModal = () => {
    if (!editingNote) return null;

    return (
      <Modal
        visible={true}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingNote(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Note</Text>
              <TouchableOpacity onPress={() => setEditingNote(null)}>
                <Svg width="24" height="24" viewBox="0 0 24 24">
                  <Path
                    d="M6 6 L18 18 M18 6 L6 18"
                    stroke={theme.colors.text.primary}
                    strokeWidth="2"
                  />
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Verse reference */}
            <View style={styles.editVerseInfo}>
              <Text style={styles.editVerseReference}>
                {editingNote.verse?.book} {editingNote.verse?.chapter}:{editingNote.verse?.verse_number}
              </Text>
              <Text style={styles.editVerseText} numberOfLines={2}>
                "{editingNote.verse?.text}"
              </Text>
            </View>

            {/* Text input */}
            <TextInput
              style={styles.editInput}
              value={editText}
              onChangeText={setEditText}
              placeholder="Write your note here..."
              placeholderTextColor={theme.colors.text.tertiary}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              autoFocus
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setEditingNote(null)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveEdit}
                disabled={isSaving}
              >
                <Text style={styles.modalButtonTextPrimary}>
                  {isSaving ? 'Saving...' : 'Save Note'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.secondary.lightGold} />
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Study Notes</Text>
        <Text style={styles.subtitle}>
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Svg width="20" height="20" viewBox="0 0 24 24" style={styles.searchIcon}>
            <Circle
              cx="10"
              cy="10"
              r="7"
              stroke={theme.colors.text.tertiary}
              strokeWidth="2"
              fill="none"
            />
            <Path
              d="M15 15 L21 21"
              stroke={theme.colors.text.tertiary}
              strokeWidth="2"
            />
          </Svg>

          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Svg width="20" height="20" viewBox="0 0 24 24">
                <Path
                  d="M6 6 L18 18 M18 6 L6 18"
                  stroke={theme.colors.text.tertiary}
                  strokeWidth="2"
                />
              </Svg>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Svg width="100" height="100" viewBox="0 0 100 100">
              <Path
                d="M30 20 L30 80 L70 80 L70 30 L60 20 Z M60 20 L60 30 L70 30"
                stroke={theme.colors.text.tertiary}
                strokeWidth="2"
                fill="none"
              />
              <Path d="M40 40 L60 40 M40 50 L60 50 M40 60 L55 60" stroke={theme.colors.text.tertiary} strokeWidth="2" />
            </Svg>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No matching notes' : 'No study notes yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try different search terms'
                : 'Add notes to verses while studying to remember insights and reflections'}
            </Text>
          </View>
        ) : (
          filteredNotes.map(renderNoteCard)
        )}
      </ScrollView>

      {/* Edit modal */}
      {renderEditModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.offWhiteParchment,
  },
  header: {
    paddingHorizontal: theme.spacing.screen.horizontal,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.ui.title.fontSize,
    lineHeight: theme.typography.ui.title.lineHeight,
    fontWeight: theme.typography.ui.title.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  subtitle: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.screen.horizontal,
    paddingVertical: theme.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.lightCream,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    padding: 0,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screen.horizontal,
    paddingBottom: theme.spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.md,
  },
  noteCard: {
    marginBottom: theme.spacing.md,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  verseReference: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flex: 1,
  },
  referenceText: {
    fontSize: theme.typography.ui.subheading.fontSize,
    fontWeight: theme.typography.ui.subheading.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  noteActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    padding: theme.spacing.xs,
  },
  verseText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
  },
  noteContent: {
    backgroundColor: theme.colors.background.warmParchment,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  noteText: {
    fontSize: theme.typography.ui.body.fontSize,
    lineHeight: theme.typography.ui.body.lineHeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  translationText: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.ui.heading.fontSize,
    fontWeight: theme.typography.ui.heading.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background.lightCream,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    maxHeight: '80%',
    paddingBottom: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.mutedStone,
  },
  modalTitle: {
    fontSize: theme.typography.ui.heading.fontSize,
    fontWeight: theme.typography.ui.heading.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  editVerseInfo: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.mutedStone,
  },
  editVerseReference: {
    fontSize: theme.typography.ui.subheading.fontSize,
    fontWeight: theme.typography.ui.subheading.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.xs,
  },
  editVerseText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    fontStyle: 'italic',
  },
  editInput: {
    margin: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.warmParchment,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    minHeight: 150,
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: theme.colors.background.warmParchment,
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
  },
  modalButtonPrimary: {
    backgroundColor: theme.colors.secondary.lightGold,
  },
  modalButtonTextSecondary: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '700',
  },
  modalButtonTextPrimary: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '700',
  },
});

export default NotesScreen;
