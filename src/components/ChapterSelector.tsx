/**
 * Chapter Selector Component
 *
 * Allows users to select a book and chapter for focused learning
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

interface ChapterSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (book: string | null, chapter: number | null) => void;
}

const OLD_TESTAMENT = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
];

const NEW_TESTAMENT = [
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
  'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation'
];

type Step = 'testament' | 'book' | 'chapter';

export const ChapterSelector: React.FC<ChapterSelectorProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const [step, setStep] = useState<Step>('testament');
  const [selectedTestament, setSelectedTestament] = useState<'old' | 'new' | null>(null);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [chapters, setChapters] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      // Reset to initial state when modal opens
      setStep('testament');
      setSelectedTestament(null);
      setSelectedBook(null);
      setChapters([]);
    }
  }, [visible]);

  const handleTestamentSelect = (testament: 'old' | 'new') => {
    setSelectedTestament(testament);
    setStep('book');
  };

  const handleBookSelect = async (book: string) => {
    setSelectedBook(book);
    setIsLoading(true);

    try {
      // Load chapters for this book
      const { data, error } = await supabase
        .from('verses')
        .select('chapter')
        .eq('book', book)
        .eq('translation', 'KJV')
        .order('chapter');

      if (error) throw error;

      const uniqueChapters = [...new Set(data.map((v: any) => v.chapter))];
      setChapters(uniqueChapters);
      setStep('chapter');
    } catch (error) {
      logger.error('[ChapterSelector] Error loading chapters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChapterSelect = (chapter: number) => {
    onSelect(selectedBook, chapter);
    onClose();
  };

  const handleAllChapters = () => {
    // Select all chapters (null means random from all)
    onSelect(null, null);
    onClose();
  };

  const handleAllChaptersFromBook = () => {
    // Select all chapters from the selected book (book specified, chapter null)
    onSelect(selectedBook, null);
    onClose();
  };

  const handleBack = () => {
    if (step === 'chapter') {
      setStep('book');
      setSelectedBook(null);
      setChapters([]);
    } else if (step === 'book') {
      setStep('testament');
      setSelectedTestament(null);
    }
  };

  const books = selectedTestament === 'old' ? OLD_TESTAMENT : NEW_TESTAMENT;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {step !== 'testament' && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>
            {step === 'testament' && 'Choose Testament'}
            {step === 'book' && `${selectedTestament === 'old' ? 'Old' : 'New'} Testament`}
            {step === 'chapter' && selectedBook}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.secondary.lightGold} />
          </View>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {step === 'testament' && (
              <>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={handleAllChapters}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name="shuffle" size={24} color={theme.colors.secondary.lightGold} />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>All Chapters</Text>
                    <Text style={styles.optionSubtitle}>Learn from any book</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => handleTestamentSelect('old')}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name="book" size={24} color={theme.colors.secondary.lightGold} />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Old Testament</Text>
                    <Text style={styles.optionSubtitle}>39 books</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => handleTestamentSelect('new')}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name="book" size={24} color={theme.colors.secondary.lightGold} />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>New Testament</Text>
                    <Text style={styles.optionSubtitle}>27 books</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
                </TouchableOpacity>
              </>
            )}

            {step === 'book' && (
              <View style={styles.booksGrid}>
                {books.map((book) => (
                  <TouchableOpacity
                    key={book}
                    style={styles.bookButton}
                    onPress={() => handleBookSelect(book)}
                  >
                    <Text style={styles.bookName}>{book}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {step === 'chapter' && (
              <>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={handleAllChaptersFromBook}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name="book-outline" size={24} color={theme.colors.secondary.lightGold} />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>All Chapters from {selectedBook}</Text>
                    <Text style={styles.optionSubtitle}>Learn from any chapter in this book</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
                </TouchableOpacity>

                <View style={styles.divider} />

                <Text style={styles.sectionLabel}>Or choose a specific chapter:</Text>

                <View style={styles.chaptersGrid}>
                  {chapters.map((chapter) => (
                    <TouchableOpacity
                      key={chapter}
                      style={styles.chapterButton}
                      onPress={() => handleChapterSelect(chapter)}
                    >
                      <Text style={styles.chapterNumber}>{chapter}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.lightCream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.mutedStone,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.warmParchment,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary.oatmeal,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.lightCream,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.primary.oatmeal,
    marginVertical: theme.spacing.sm,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  bookButton: {
    backgroundColor: theme.colors.background.warmParchment,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary.oatmeal,
    minWidth: '48%',
    alignItems: 'center',
  },
  bookName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
  },
  chaptersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'center',
  },
  chapterButton: {
    width: 64,
    height: 64,
    backgroundColor: theme.colors.background.warmParchment,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.secondary.lightGold,
  },
  chapterNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
});
