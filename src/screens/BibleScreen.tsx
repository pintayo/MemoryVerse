import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';

interface BibleScreenProps {
  navigation: any;
}

type ScreenMode = 'books' | 'chapters' | 'verses';

interface SearchResult {
  id: string;
  book: string;
  chapter: number;
  verse_number: number;
  text: string;
}

// All 66 Bible books in order
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

const ALL_BOOKS = [...OLD_TESTAMENT, ...NEW_TESTAMENT];

export const BibleScreen: React.FC<BibleScreenProps> = ({ navigation }) => {
  const { profile } = useAuth();
  const isPremiumUser = profile?.is_premium || false;

  const [mode, setMode] = useState<ScreenMode>('books');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [chapters, setChapters] = useState<number[]>([]);
  const [verses, setVerses] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Filter books by search query
  const filteredBooks = searchQuery
    ? ALL_BOOKS.filter(book =>
        book.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : ALL_BOOKS;

  // Search verses when query is entered
  useEffect(() => {
    const searchVerses = async () => {
      if (searchQuery.length < 3) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('verses')
          .select('id, book, chapter, verse_number, text')
          .eq('translation', 'KJV')
          .ilike('text', `%${searchQuery}%`)
          .limit(50);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        logger.error('[BibleScreen] Error searching verses:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchVerses, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleBookSelect = async (book: string) => {
    setSelectedBook(book);
    setMode('chapters');
    setSearchQuery('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('verses')
        .select('chapter')
        .eq('book', book)
        .eq('translation', 'KJV')
        .order('chapter');

      if (error) throw error;

      const uniqueChapters = [...new Set(data.map((v: any) => v.chapter))];
      setChapters(uniqueChapters);
    } catch (error) {
      logger.error('[BibleScreen] Error loading chapters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChapterSelect = async (chapter: number) => {
    if (!selectedBook) return;

    setSelectedChapter(chapter);
    setMode('verses');
    setSearchQuery('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('verses')
        .select('*')
        .eq('book', selectedBook)
        .eq('chapter', chapter)
        .eq('translation', 'KJV')
        .order('verse_number');

      if (error) throw error;
      setVerses(data || []);
    } catch (error) {
      logger.error('[BibleScreen] Error loading verses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerseSelect = async (verse: SearchResult) => {
    // Navigate to the chapter containing this verse
    setSelectedBook(verse.book);
    setSelectedChapter(verse.chapter);
    setMode('verses');
    setSearchQuery('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('verses')
        .select('*')
        .eq('book', verse.book)
        .eq('chapter', verse.chapter)
        .eq('translation', 'KJV')
        .order('verse_number');

      if (error) throw error;
      setVerses(data || []);

      // Load chapters for this book for navigation
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('verses')
        .select('chapter')
        .eq('book', verse.book)
        .eq('translation', 'KJV')
        .order('chapter');

      if (!chaptersError && chaptersData) {
        const uniqueChapters = [...new Set(chaptersData.map((v: any) => v.chapter))];
        setChapters(uniqueChapters);
      }
    } catch (error) {
      logger.error('[BibleScreen] Error loading chapter from verse:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (mode === 'verses') {
      setMode('chapters');
      setSelectedChapter(null);
      setVerses([]);
    } else if (mode === 'chapters') {
      setMode('books');
      setSelectedBook(null);
      setChapters([]);
    }
    setSearchQuery('');
  };

  const handlePreviousChapter = async () => {
    if (!selectedBook || !selectedChapter) return;
    const currentIndex = chapters.indexOf(selectedChapter);
    if (currentIndex > 0) {
      await handleChapterSelect(chapters[currentIndex - 1]);
    }
  };

  const handleNextChapter = async () => {
    if (!selectedBook || !selectedChapter) return;
    const currentIndex = chapters.indexOf(selectedChapter);
    if (currentIndex < chapters.length - 1) {
      await handleChapterSelect(chapters[currentIndex + 1]);
    }
  };

  const handleRequestChapterContext = () => {
    if (!selectedBook || !selectedChapter) return;

    logger.log('[BibleScreen] Request context for chapter:', selectedBook, selectedChapter);

    if (isPremiumUser) {
      // Premium users can access chapter context feature
      navigation.navigate('ChapterContext', {
        book: selectedBook,
        chapter: selectedChapter,
      });
    } else {
      // Non-premium users see upgrade prompt
      navigation.navigate('PremiumUpgrade');
    }
  };

  const handleRequestVerseContext = (verseId: string) => {
    navigation.navigate('Understand', { verseId });
  };

  const handleFavorites = () => {
    // Navigate to favorites (could be a modal or separate screen)
    logger.log('[BibleScreen] Navigate to favorites');
    // TODO: Implement favorites navigation
  };

  const renderHeader = () => {
    let title = 'Browse Bible';
    if (mode === 'chapters' && selectedBook) {
      title = selectedBook;
    } else if (mode === 'verses' && selectedBook && selectedChapter) {
      title = `${selectedBook} ${selectedChapter}`;
    }

    return (
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {mode !== 'books' && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Svg width={24} height={24} viewBox="0 0 24 24">
                <Path
                  d="M15 18 L9 12 L15 6"
                  stroke={theme.colors.text.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>{title}</Text>
          {mode === 'books' && (
            <TouchableOpacity onPress={handleFavorites} style={styles.favoritesButton}>
              <Svg width={24} height={24} viewBox="0 0 24 24">
                <Path
                  d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                  fill={theme.colors.secondary.lightGold}
                />
              </Svg>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Svg width={20} height={20} viewBox="0 0 24 24" style={styles.searchIcon}>
            <Path
              d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
              fill={theme.colors.text.tertiary}
            />
          </Svg>
          <TextInput
            style={styles.searchInput}
            placeholder={
              mode === 'books'
                ? "Search books or verses..."
                : mode === 'chapters'
                ? "Search chapters..."
                : "Search verses in this chapter..."
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.text.tertiary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                  fill={theme.colors.text.tertiary}
                />
              </Svg>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderBooksList = () => {
    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Show verse search results if searching */}
        {searchQuery.length >= 3 && (
          <View style={styles.searchResultsSection}>
            {isSearching ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.secondary.lightGold} />
                <Text style={styles.loadingText}>Searching verses...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <>
                <Text style={styles.searchResultsTitle}>
                  {searchResults.length} verse{searchResults.length !== 1 ? 's' : ''} found
                </Text>
                {searchResults.map((result) => (
                  <TouchableOpacity
                    key={result.id}
                    style={styles.verseResultCard}
                    onPress={() => handleVerseSelect(result)}
                  >
                    <Text style={styles.verseResultRef}>
                      {result.book} {result.chapter}:{result.verse_number}
                    </Text>
                    <Text style={styles.verseResultText} numberOfLines={2}>
                      {result.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <Text style={styles.noResultsText}>No verses found matching "{searchQuery}"</Text>
            )}
          </View>
        )}

        {/* Always show books list */}
        {filteredBooks.length === 0 ? (
          <Text style={styles.noResultsText}>No books found</Text>
        ) : (
          <>
            {OLD_TESTAMENT.some(book => filteredBooks.includes(book)) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Old Testament</Text>
                {OLD_TESTAMENT.filter(book => filteredBooks.includes(book)).map((book) => (
                  <TouchableOpacity
                    key={book}
                    style={styles.bookItem}
                    onPress={() => handleBookSelect(book)}
                  >
                    <Text style={styles.bookName}>{book}</Text>
                    <Svg width={20} height={20} viewBox="0 0 24 24">
                      <Path
                        d="M9 6 L15 12 L9 18"
                        stroke={theme.colors.text.tertiary}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </Svg>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {NEW_TESTAMENT.some(book => filteredBooks.includes(book)) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>New Testament</Text>
                {NEW_TESTAMENT.filter(book => filteredBooks.includes(book)).map((book) => (
                  <TouchableOpacity
                    key={book}
                    style={styles.bookItem}
                    onPress={() => handleBookSelect(book)}
                  >
                    <Text style={styles.bookName}>{book}</Text>
                    <Svg width={20} height={20} viewBox="0 0 24 24">
                      <Path
                        d="M9 6 L15 12 L9 18"
                        stroke={theme.colors.text.tertiary}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </Svg>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    );
  };

  const renderChaptersList = () => {
    const filteredChapters = searchQuery
      ? chapters.filter(ch => ch.toString().includes(searchQuery))
      : chapters;

    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.chaptersGrid}>
          {filteredChapters.map((chapter) => (
            <TouchableOpacity
              key={chapter}
              style={styles.chapterCard}
              onPress={() => handleChapterSelect(chapter)}
            >
              <Text style={styles.chapterNumber}>{chapter}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderVersesList = () => {
    const filteredVerses = searchQuery
      ? verses.filter(v => v.text.toLowerCase().includes(searchQuery.toLowerCase()))
      : verses;

    const currentChapterIndex = chapters.indexOf(selectedChapter || 0);
    const hasPrevious = currentChapterIndex > 0;
    const hasNext = currentChapterIndex < chapters.length - 1;

    return (
      <View style={styles.chapterViewContainer}>
        {/* Chapter Action Buttons */}
        <View style={styles.chapterActionsBar}>
          <TouchableOpacity
            style={[styles.actionButton, styles.contextButton]}
            onPress={handleRequestChapterContext}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path
                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z"
                fill={theme.colors.secondary.lightGold}
              />
            </Svg>
            <Text style={styles.contextButtonText}>Chapter Context</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.chapterScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Continuous Chapter Text */}
          <View style={styles.chapterTextContainer}>
            {filteredVerses.map((verse, index) => (
              <View key={verse.id} style={styles.verseInlineContainer}>
                <TouchableOpacity
                  style={styles.verseNumberButton}
                  onPress={() => handleRequestVerseContext(verse.id)}
                >
                  <Text style={styles.verseNumberInline}>{verse.verse_number}</Text>
                </TouchableOpacity>
                <Text style={styles.verseContinuousText}>
                  {verse.text}
                  {index < filteredVerses.length - 1 ? ' ' : ''}
                </Text>
              </View>
            ))}
          </View>

          {/* Chapter Navigation Buttons */}
          <View style={styles.chapterNavigation}>
            <TouchableOpacity
              style={[styles.navButton, !hasPrevious && styles.navButtonDisabled]}
              onPress={handlePreviousChapter}
              disabled={!hasPrevious}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path
                  d="M15 18 L9 12 L15 6"
                  stroke={hasPrevious ? theme.colors.text.primary : theme.colors.text.tertiary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
              <Text style={[styles.navButtonText, !hasPrevious && styles.navButtonTextDisabled]}>
                Previous Chapter
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, !hasNext && styles.navButtonDisabled]}
              onPress={handleNextChapter}
              disabled={!hasNext}
            >
              <Text style={[styles.navButtonText, !hasNext && styles.navButtonTextDisabled]}>
                Next Chapter
              </Text>
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path
                  d="M9 6 L15 12 L9 18"
                  stroke={hasNext ? theme.colors.text.primary : theme.colors.text.tertiary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.secondary.lightGold} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          {mode === 'books' && renderBooksList()}
          {mode === 'chapters' && renderChaptersList()}
          {mode === 'verses' && renderVersesList()}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.cream,
  },
  header: {
    backgroundColor: theme.colors.background.lightCream,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.mutedStone,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
    minHeight: 44,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  favoritesButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.cream,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary.darkCharcoal,
    marginBottom: 12,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.lightCream,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
  },
  bookName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  chaptersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 8,
  },
  chapterCard: {
    width: 64,
    height: 64,
    backgroundColor: theme.colors.background.warmParchment,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.secondary.lightGold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chapterNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  verseCard: {
    backgroundColor: theme.colors.background.lightCream,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
  },
  verseHeader: {
    marginBottom: 8,
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.secondary.lightGold,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.primary,
  },
  searchResultsContainer: {
    padding: 16,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    marginBottom: 16,
  },
  verseResultCard: {
    backgroundColor: theme.colors.background.lightCream,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
  },
  verseResultRef: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.secondary.lightGold,
    marginBottom: 6,
  },
  verseResultText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.tertiary,
  },
  noResultsText: {
    fontSize: 16,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: 32,
  },
  searchResultsSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary.mutedStone,
  },
  searchLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  chapterViewContainer: {
    flex: 1,
  },
  chapterActionsBar: {
    backgroundColor: theme.colors.background.lightCream,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.mutedStone,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contextButton: {
    backgroundColor: theme.colors.background.cream,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.secondary.lightGold,
  },
  contextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  chapterScrollContent: {
    padding: 16,
  },
  chapterTextContainer: {
    backgroundColor: theme.colors.background.lightCream,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  verseInlineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  verseNumberButton: {
    marginRight: 6,
    marginTop: 2,
  },
  verseNumberInline: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.secondary.lightGold,
    backgroundColor: theme.colors.background.cream,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verseContinuousText: {
    flex: 1,
    fontSize: 17,
    lineHeight: 28,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.scripture.default,
  },
  chapterNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 32,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.background.lightCream,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  navButtonTextDisabled: {
    color: theme.colors.text.tertiary,
  },
});
