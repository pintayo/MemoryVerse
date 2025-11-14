import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import Svg, { Path } from 'react-native-svg';
import { logger } from '../utils/logger';

interface BibleVersePickerProps {
  visible: boolean;
  onClose: () => void;
  onVerseSelect: (verseId: string) => void;
  onChapterSelect?: (book: string, chapter: number) => void;
  onRandomVerse: (book?: string, chapter?: number) => void;
}

interface Book {
  book: string;
}

export const BibleVersePicker: React.FC<BibleVersePickerProps> = ({
  visible,
  onClose,
  onVerseSelect,
  onChapterSelect,
  onRandomVerse,
}) => {
  const [step, setStep] = useState<'books' | 'chapters' | 'verses'>('books');
  const [books, setBooks] = useState<string[]>([]);
  const [chapters, setChapters] = useState<number[]>([]);
  const [verses, setVerses] = useState<Array<{id: string, verse_number: number, text: string}>>([]);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadBooks();
    } else {
      // Reset when modal closes
      setStep('books');
      setSelectedBook(null);
      setSelectedChapter(null);
    }
  }, [visible]);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      // Increase limit to get all verses (Supabase defaults to 1000 rows max)
      const { data, error } = await supabase
        .from('verses')
        .select('book')
        .eq('translation', 'KJV') // Only get KJV translation
        .order('book')
        .limit(35000); // Get all ~31k verses to ensure we get all books

      if (error) throw error;

      // Get unique books
      const uniqueBooks = [...new Set(data.map((item: Book) => item.book))];
      logger.log(`[BibleVersePicker] Loaded ${uniqueBooks.length} books from ${data.length} verses`);
      logger.log(`[BibleVersePicker] Books:`, uniqueBooks);
      setBooks(uniqueBooks);
    } catch (error) {
      logger.error('[BibleVersePicker] Error loading books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChapters = async (book: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('verses')
        .select('chapter')
        .eq('book', book)
        .eq('translation', 'KJV') // Only get KJV translation
        .order('chapter');

      if (error) throw error;

      // Get unique chapters
      const uniqueChapters = [...new Set(data.map((item: any) => item.chapter))];
      logger.log(`[BibleVersePicker] Loaded ${uniqueChapters.length} chapters for ${book}`);
      setChapters(uniqueChapters);
      setSelectedBook(book);
      setStep('chapters');
    } catch (error) {
      logger.error('[BibleVersePicker] Error loading chapters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVerses = async (book: string, chapter: number) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('verses')
        .select('id, verse_number, text')
        .eq('book', book)
        .eq('chapter', chapter)
        .eq('translation', 'KJV') // Only get KJV translation
        .order('verse_number');

      if (error) throw error;

      setVerses(data || []);
      setSelectedChapter(chapter);
      setStep('verses');
    } catch (error) {
      logger.error('[BibleVersePicker] Error loading verses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'verses') {
      setStep('chapters');
    } else if (step === 'chapters') {
      setStep('books');
    }
  };

  const handleVerseSelect = (verseId: string) => {
    onVerseSelect(verseId);
    onClose();
  };

  const getRandomButtonText = () => {
    if (step === 'verses' && selectedBook && selectedChapter) {
      return `Random Verse of ${selectedBook} ${selectedChapter}`;
    } else if (step === 'chapters' && selectedBook) {
      return `Random Verse of ${selectedBook}`;
    }
    return 'Random Verse';
  };

  const handleRandomVerse = () => {
    if (step === 'verses' && selectedBook && selectedChapter) {
      onRandomVerse(selectedBook, selectedChapter);
    } else if (step === 'chapters' && selectedBook) {
      onRandomVerse(selectedBook);
    } else {
      onRandomVerse();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={step === 'books' ? onClose : handleBack} style={styles.backButton}>
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
                  fill={theme.colors.text.primary}
                />
              </Svg>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {step === 'books' && 'Select a Book'}
              {step === 'chapters' && selectedBook}
              {step === 'verses' && `${selectedBook} ${selectedChapter}`}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                  fill={theme.colors.text.primary}
                />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Random Verse Button */}
          <TouchableOpacity style={styles.randomButton} onPress={handleRandomVerse}>
            <Svg width="20" height="20" viewBox="0 0 24 24">
              <Path
                d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
                fill={theme.colors.text.primary}
              />
            </Svg>
            <Text style={styles.randomButtonText}>{getRandomButtonText()}</Text>
          </TouchableOpacity>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.secondary.lightGold} />
            </View>
          ) : (
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {step === 'books' && (
                <View style={styles.grid}>
                  {books.map((book) => (
                    <TouchableOpacity
                      key={book}
                      style={styles.gridItem}
                      onPress={() => loadChapters(book)}
                    >
                      <Text style={styles.gridItemText}>{book}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {step === 'chapters' && (
                <View style={styles.grid}>
                  {chapters.map((chapter) => (
                    <TouchableOpacity
                      key={chapter}
                      style={styles.gridItemSmall}
                      onPress={() => selectedBook && loadVerses(selectedBook, chapter)}
                    >
                      <Text style={styles.gridItemText}>{chapter}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {step === 'verses' && (
                <>
                  {onChapterSelect && selectedBook && selectedChapter && (
                    <TouchableOpacity
                      style={styles.selectAllButton}
                      onPress={() => {
                        onChapterSelect(selectedBook, selectedChapter);
                        onClose();
                      }}
                    >
                      <Svg width="20" height="20" viewBox="0 0 24 24">
                        <Path
                          d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                          fill={theme.colors.text.onDark}
                        />
                      </Svg>
                      <Text style={styles.selectAllText}>
                        Explain All Verses in {selectedBook} {selectedChapter}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <View style={styles.verseList}>
                    {verses.map((verse) => (
                      <TouchableOpacity
                        key={verse.id}
                        style={styles.verseItem}
                        onPress={() => handleVerseSelect(verse.id)}
                      >
                        <Text style={styles.verseNumber}>{verse.verse_number}</Text>
                        <Text style={styles.verseText} numberOfLines={2}>
                          {verse.text}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.background.offWhiteParchment,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '80%',
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.oatmeal,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.typography.ui.title.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  randomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    margin: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.secondary.lightGold,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  randomButtonText: {
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    margin: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.success.mutedOlive,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  selectAllText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.colors.text.onDark,
    fontFamily: theme.typography.fonts.ui.default,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  gridItem: {
    width: '48%',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.warmParchment,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary.oatmeal,
  },
  gridItemSmall: {
    width: '18%',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.warmParchment,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary.oatmeal,
  },
  gridItemText: {
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  verseList: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  verseItem: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.warmParchment,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary.oatmeal,
  },
  verseNumber: {
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: 'bold',
    color: theme.colors.secondary.lightGold,
    fontFamily: theme.typography.fonts.ui.default,
    minWidth: 30,
  },
  verseText: {
    flex: 1,
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.scripture.default,
  },
});
