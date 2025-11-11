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

  const handleVerseSelect = (verse: any) => {
    navigation.navigate('VerseCard', { verseId: verse.id });
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
    // Show search results if searching for verses
    if (searchQuery.length >= 3 && searchResults.length > 0) {
      return (
        <View style={styles.searchResultsContainer}>
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
        </View>
      );
    }

    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.secondary.lightGold} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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

    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {filteredVerses.map((verse) => (
          <TouchableOpacity
            key={verse.id}
            style={styles.verseCard}
            onPress={() => handleVerseSelect(verse)}
          >
            <View style={styles.verseHeader}>
              <Text style={styles.verseNumber}>{verse.verse_number}</Text>
            </View>
            <Text style={styles.verseText}>{verse.text}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    gap: 12,
  },
  chapterCard: {
    width: 60,
    height: 60,
    backgroundColor: theme.colors.background.lightCream,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
  },
  chapterNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
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
});
