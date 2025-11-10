import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { Card } from '../components';
import { theme } from '../theme';
import { verseSearchService, SearchFilters, SearchResult, SearchHistory } from '../services/verseSearchService';
import { logger } from '../utils/logger';

interface SearchScreenProps {
  navigation: any;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Filters
  const [filters, setFilters] = useState<SearchFilters>({
    translation: 'KJV',
    category: undefined,
    difficulty: undefined,
    book: undefined,
  });

  // Filter options
  const [books, setBooks] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const searchInputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial data
  useEffect(() => {
    loadSearchHistory();
    loadFilterOptions();
  }, []);

  const loadSearchHistory = async () => {
    const history = await verseSearchService.getHistory();
    setSearchHistory(history);
  };

  const loadFilterOptions = async () => {
    const booksData = await verseSearchService.getBooks(filters.translation);
    const categoriesData = await verseSearchService.getCategories();
    setBooks(booksData);
    setCategories(categoriesData);
  };

  // Debounced search
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    if (text.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(text);
      }, 500);
    } else {
      setResults([]);
    }
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setShowHistory(false);

      // Check if it's a reference search (e.g., "John 3:16")
      const referenceMatch = query.match(/^[\d\w\s]+\s+\d+:\d+$/i);

      if (referenceMatch) {
        const verse = await verseSearchService.searchByReference(query);
        if (verse) {
          setResults([verse as SearchResult]);
        } else {
          setResults([]);
        }
      } else {
        const searchResults = await verseSearchService.searchVerses(query, filters, 50);
        setResults(searchResults);
      }

      // Save to history
      await verseSearchService.saveToHistory(query, filters);
      await loadSearchHistory();
    } catch (error) {
      logger.error('[SearchScreen] Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleHistoryItemPress = (historyItem: SearchHistory) => {
    setSearchQuery(historyItem.query);
    if (historyItem.filters) {
      setFilters(historyItem.filters);
    }
    performSearch(historyItem.query);
    setShowHistory(false);
  };

  const handleDeleteHistoryItem = async (query: string) => {
    await verseSearchService.deleteHistoryItem(query);
    await loadSearchHistory();
  };

  const clearAllHistory = async () => {
    await verseSearchService.clearHistory();
    await loadSearchHistory();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setShowHistory(false);
  };

  const resetFilters = () => {
    setFilters({
      translation: 'KJV',
      category: undefined,
      difficulty: undefined,
      book: undefined,
    });
  };

  const applyFilters = () => {
    setShowFilters(false);
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  const renderSearchBar = () => (
    <View style={styles.searchBarContainer}>
      <View style={styles.searchBar}>
        {/* Search icon */}
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

        {/* Input */}
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search verses or references (e.g., John 3:16)"
          placeholderTextColor={theme.colors.text.tertiary}
          value={searchQuery}
          onChangeText={handleSearchChange}
          onFocus={() => setShowHistory(searchHistory.length > 0 && !searchQuery)}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Clear button */}
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
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

      {/* Filters button */}
      <TouchableOpacity
        style={[
          styles.filterButton,
          (filters.category || filters.difficulty || filters.book) && styles.filterButtonActive,
        ]}
        onPress={() => setShowFilters(true)}
      >
        <Svg width="20" height="20" viewBox="0 0 24 24">
          <Path
            d="M4 6 L20 6 M6 12 L18 12 M9 18 L15 18"
            stroke={theme.colors.text.primary}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      </TouchableOpacity>
    </View>
  );

  const renderSearchHistory = () => {
    if (!showHistory || searchHistory.length === 0) return null;

    return (
      <Card variant="cream" style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Recent Searches</Text>
          <TouchableOpacity onPress={clearAllHistory}>
            <Text style={styles.clearHistoryText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {searchHistory.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.historyItem}
            onPress={() => handleHistoryItemPress(item)}
          >
            <Svg width="16" height="16" viewBox="0 0 24 24" style={styles.historyIcon}>
              <Circle
                cx="12"
                cy="12"
                r="9"
                stroke={theme.colors.text.tertiary}
                strokeWidth="2"
                fill="none"
              />
              <Path d="M12 6 L12 12 L16 14" stroke={theme.colors.text.tertiary} strokeWidth="2" />
            </Svg>
            <Text style={styles.historyItemText}>{item.query}</Text>
            <TouchableOpacity
              onPress={() => handleDeleteHistoryItem(item.query)}
              style={styles.deleteHistoryButton}
            >
              <Svg width="16" height="16" viewBox="0 0 24 24">
                <Path
                  d="M6 6 L18 18 M18 6 L6 18"
                  stroke={theme.colors.text.tertiary}
                  strokeWidth="2"
                />
              </Svg>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </Card>
    );
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      onPress={() => {
        // Navigate to verse details or start learning
        navigation.navigate('VerseCard', { verse: item });
      }}
    >
      <Card variant="cream" style={styles.resultCard}>
        {/* Reference */}
        <View style={styles.resultHeader}>
          <Text style={styles.resultReference}>
            {item.book} {item.chapter}:{item.verse_number}
          </Text>
          {item.translation && (
            <Text style={styles.resultTranslation}>{item.translation}</Text>
          )}
        </View>

        {/* Verse text with highlighting */}
        <Text style={styles.resultText}>
          {item.highlightedText ? (
            renderHighlightedText(item.highlightedText)
          ) : (
            item.text
          )}
        </Text>

        {/* Metadata */}
        <View style={styles.resultMetadata}>
          {item.category && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.category}</Text>
            </View>
          )}
          {item.difficulty && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Level {item.difficulty}</Text>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderHighlightedText = (text: string) => {
    // Parse markdown-style highlighting **word**
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return (
      <Text style={styles.resultText}>
        {parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const highlighted = part.slice(2, -2);
            return (
              <Text key={index} style={styles.highlightedText}>
                {highlighted}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M6 6 L18 18 M18 6 L6 18"
                  stroke={theme.colors.text.primary}
                  strokeWidth="2"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterScrollView}>
            {/* Translation */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Translation</Text>
              <View style={styles.filterOptions}>
                {['KJV', 'NIV', 'ESV', 'NASB'].map((trans) => (
                  <TouchableOpacity
                    key={trans}
                    style={[
                      styles.filterOption,
                      filters.translation === trans && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilters({ ...filters, translation: trans })}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.translation === trans && styles.filterOptionTextActive,
                      ]}
                    >
                      {trans}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Category</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    !filters.category && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilters({ ...filters, category: undefined })}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      !filters.category && styles.filterOptionTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.filterOption,
                      filters.category === cat && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilters({ ...filters, category: cat })}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.category === cat && styles.filterOptionTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Difficulty */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Difficulty</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    !filters.difficulty && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilters({ ...filters, difficulty: undefined })}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      !filters.difficulty && styles.filterOptionTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {[1, 2, 3, 4, 5].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.filterOption,
                      filters.difficulty === level && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilters({ ...filters, difficulty: level })}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.difficulty === level && styles.filterOptionTextActive,
                      ]}
                    >
                      Level {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Book */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Book</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    !filters.book && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilters({ ...filters, book: undefined })}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      !filters.book && styles.filterOptionTextActive,
                    ]}
                  >
                    All Books
                  </Text>
                </TouchableOpacity>
                {books.slice(0, 20).map((book) => (
                  <TouchableOpacity
                    key={book}
                    style={[
                      styles.filterOption,
                      filters.book === book && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilters({ ...filters, book })}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.book === book && styles.filterOptionTextActive,
                      ]}
                    >
                      {book}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={resetFilters}
            >
              <Text style={styles.modalButtonTextSecondary}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={applyFilters}
            >
              <Text style={styles.modalButtonTextPrimary}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search Verses</Text>
        {renderSearchBar()}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Search history */}
        {renderSearchHistory()}

        {/* Loading state */}
        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.secondary.lightGold} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {/* Results */}
        {!isSearching && results.length > 0 && (
          <FlatList
            data={results}
            renderItem={renderResult}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={styles.resultsContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Empty state */}
        {!isSearching && searchQuery.length >= 2 && results.length === 0 && (
          <View style={styles.emptyContainer}>
            <Svg width="100" height="100" viewBox="0 0 100 100">
              <Circle
                cx="50"
                cy="50"
                r="40"
                stroke={theme.colors.text.tertiary}
                strokeWidth="2"
                fill="none"
              />
              <Path
                d="M35 45 Q50 35 65 45 M35 65 Q50 55 65 65"
                stroke={theme.colors.text.tertiary}
                strokeWidth="2"
                fill="none"
              />
            </Svg>
            <Text style={styles.emptyText}>No verses found</Text>
            <Text style={styles.emptySubtext}>
              Try different keywords or adjust your filters
            </Text>
          </View>
        )}

        {/* Initial state */}
        {!isSearching && !searchQuery && results.length === 0 && !showHistory && (
          <View style={styles.initialContainer}>
            <Svg width="120" height="120" viewBox="0 0 120 120">
              <Path
                d="M30 30 L30 90 L60 85 L60 25 Z"
                fill={theme.colors.background.warmParchment}
                stroke={theme.colors.secondary.lightGold}
                strokeWidth="2"
              />
              <Path
                d="M60 25 L60 85 L90 90 L90 30 Z"
                fill={theme.colors.background.lightCream}
                stroke={theme.colors.secondary.lightGold}
                strokeWidth="2"
              />
              <Circle
                cx="70"
                cy="50"
                r="15"
                stroke={theme.colors.secondary.lightGold}
                strokeWidth="2"
                fill="none"
              />
              <Path
                d="M82 62 L95 75"
                stroke={theme.colors.secondary.lightGold}
                strokeWidth="2"
              />
            </Svg>
            <Text style={styles.initialText}>Search for Bible verses</Text>
            <Text style={styles.initialSubtext}>
              Search by keyword or reference (e.g., "John 3:16")
            </Text>
          </View>
        )}
      </View>

      {/* Filter modal */}
      {renderFilterModal()}
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
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.ui.title.fontSize,
    lineHeight: theme.typography.ui.title.lineHeight,
    fontWeight: theme.typography.ui.title.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.md,
  },
  searchBarContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  searchBar: {
    flex: 1,
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
  filterButton: {
    backgroundColor: theme.colors.background.lightCream,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
    width: 48,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.secondary.lightGold,
    borderColor: theme.colors.accent.burnishedGold,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.screen.horizontal,
  },
  historyCard: {
    marginBottom: theme.spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  historyTitle: {
    fontSize: theme.typography.ui.subheading.fontSize,
    fontWeight: theme.typography.ui.subheading.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  clearHistoryText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.secondary.warmTerracotta,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.oatmeal,
  },
  historyIcon: {
    marginRight: theme.spacing.sm,
  },
  historyItemText: {
    flex: 1,
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  deleteHistoryButton: {
    padding: theme.spacing.xs,
  },
  resultsContainer: {
    paddingBottom: theme.spacing.xxl,
  },
  resultCard: {
    marginBottom: theme.spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  resultReference: {
    fontSize: theme.typography.ui.subheading.fontSize,
    fontWeight: theme.typography.ui.subheading.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  resultTranslation: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600',
  },
  resultText: {
    fontSize: theme.typography.ui.body.fontSize,
    lineHeight: theme.typography.ui.body.lineHeight,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.sm,
  },
  highlightedText: {
    backgroundColor: theme.colors.success.celebratoryGold,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  resultMetadata: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  badge: {
    backgroundColor: theme.colors.accent.rosyBlush,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  loadingText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.typography.ui.heading.fontSize,
    fontWeight: theme.typography.ui.heading.fontWeight,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  initialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  initialText: {
    fontSize: theme.typography.ui.heading.fontSize,
    fontWeight: theme.typography.ui.heading.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  initialSubtext: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
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
  filterScrollView: {
    padding: theme.spacing.lg,
  },
  filterSection: {
    marginBottom: theme.spacing.lg,
  },
  filterLabel: {
    fontSize: theme.typography.ui.subheading.fontSize,
    fontWeight: theme.typography.ui.subheading.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterOption: {
    backgroundColor: theme.colors.background.warmParchment,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
  },
  filterOptionActive: {
    backgroundColor: theme.colors.secondary.lightGold,
    borderColor: theme.colors.accent.burnishedGold,
  },
  filterOptionText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600',
  },
  filterOptionTextActive: {
    color: theme.colors.text.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.primary.mutedStone,
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

export default SearchScreen;
