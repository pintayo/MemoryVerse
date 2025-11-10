import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import Svg, { Path, Circle } from 'react-native-svg';
import { offlineService, DownloadedBook, DownloadProgress } from '../services/offlineService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

// List of all Bible books
const BIBLE_BOOKS = [
  // Old Testament
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  // New Testament
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon',
  'Hebrews', 'James', '1 Peter', '2 Peter',
  '1 John', '2 John', '3 John', 'Jude', 'Revelation',
];

export const DownloadsScreen: React.FC = () => {
  const { user } = useAuth();
  const [downloadedBooks, setDownloadedBooks] = useState<DownloadedBook[]>([]);
  const [availableBooks, setAvailableBooks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingBook, setDownloadingBook] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [totalStorage, setTotalStorage] = useState<number>(0);
  const [tab, setTab] = useState<'available' | 'downloaded'>('available');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Get downloaded books
      const downloaded = await offlineService.getDownloadedBooks(user.id);
      setDownloadedBooks(downloaded);

      // Get available books from database
      const { data, error } = await supabase
        .from('verses')
        .select('book')
        .eq('translation', 'KJV');

      if (error) throw error;

      // Get unique books
      const uniqueBooks = [...new Set(data.map((item: any) => item.book))];

      // Filter out already downloaded books
      const downloadedBookNames = downloaded.map(b => b.book);
      const available = uniqueBooks.filter(book => !downloadedBookNames.includes(book));

      setAvailableBooks(available);

      // Get total storage
      const storage = await offlineService.getTotalStorageUsed();
      setTotalStorage(storage);

      logger.log(`[DownloadsScreen] Loaded ${downloaded.length} downloaded, ${available.length} available`);
    } catch (error) {
      logger.error('[DownloadsScreen] Error loading data:', error);
      Alert.alert('Error', 'Failed to load downloads');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (book: string) => {
    if (!user?.id) return;

    try {
      setDownloadingBook(book);
      setDownloadProgress(null);

      const result = await offlineService.downloadBook(
        user.id,
        book,
        'KJV',
        (progress) => {
          setDownloadProgress(progress);
        }
      );

      if (result.success) {
        Alert.alert('Success', `${book} downloaded successfully!`);
        await loadData(); // Reload data
      } else {
        Alert.alert('Error', result.error || 'Failed to download book');
      }
    } catch (error) {
      logger.error('[DownloadsScreen] Error downloading book:', error);
      Alert.alert('Error', 'Failed to download book');
    } finally {
      setDownloadingBook(null);
      setDownloadProgress(null);
    }
  };

  const handleDelete = async (book: string, translation: string) => {
    if (!user?.id) return;

    Alert.alert(
      'Delete Download',
      `Are you sure you want to delete ${book}? This will free up storage space.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await offlineService.deleteDownloadedBook(user.id, book, translation);
              if (result.success) {
                await loadData(); // Reload data
              } else {
                Alert.alert('Error', result.error || 'Failed to delete book');
              }
            } catch (error) {
              logger.error('[DownloadsScreen] Error deleting book:', error);
              Alert.alert('Error', 'Failed to delete book');
            }
          },
        },
      ]
    );
  };

  const handleClearAll = async () => {
    if (!user?.id) return;

    Alert.alert(
      'Clear All Downloads',
      'Are you sure you want to delete all downloaded books? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await offlineService.clearAllDownloads(user.id);
              if (result.success) {
                await loadData(); // Reload data
              } else {
                Alert.alert('Error', result.error || 'Failed to clear downloads');
              }
            } catch (error) {
              logger.error('[DownloadsScreen] Error clearing downloads:', error);
              Alert.alert('Error', 'Failed to clear downloads');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.secondary.lightGold} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Offline Downloads</Text>
        <Text style={styles.subtitle}>Premium Feature</Text>
        <View style={styles.storageInfo}>
          <Svg width="20" height="20" viewBox="0 0 24 24">
            <Path
              d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"
              fill={theme.colors.text.tertiary}
            />
          </Svg>
          <Text style={styles.storageText}>
            Storage used: {offlineService.formatStorageSize(totalStorage)}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'available' && styles.tabActive]}
          onPress={() => setTab('available')}
        >
          <Text style={[styles.tabText, tab === 'available' && styles.tabTextActive]}>
            Available ({availableBooks.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'downloaded' && styles.tabActive]}
          onPress={() => setTab('downloaded')}
        >
          <Text style={[styles.tabText, tab === 'downloaded' && styles.tabTextActive]}>
            Downloaded ({downloadedBooks.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {tab === 'available' ? (
          <View style={styles.bookList}>
            {availableBooks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  All books are downloaded! 🎉
                </Text>
              </View>
            ) : (
              availableBooks.map((book) => (
                <View key={book} style={styles.bookItem}>
                  <View style={styles.bookInfo}>
                    <Text style={styles.bookName}>{book}</Text>
                    <Text style={styles.bookTranslation}>KJV</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.downloadButton,
                      downloadingBook === book && styles.downloadButtonDisabled,
                    ]}
                    onPress={() => handleDownload(book)}
                    disabled={downloadingBook !== null}
                  >
                    {downloadingBook === book ? (
                      <>
                        <ActivityIndicator
                          size="small"
                          color={theme.colors.text.onDark}
                        />
                        {downloadProgress && (
                          <Text style={styles.downloadButtonText}>
                            {downloadProgress.percentage}%
                          </Text>
                        )}
                      </>
                    ) : (
                      <>
                        <Svg width="20" height="20" viewBox="0 0 24 24">
                          <Path
                            d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"
                            fill={theme.colors.text.onDark}
                          />
                        </Svg>
                        <Text style={styles.downloadButtonText}>Download</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.bookList}>
            {downloadedBooks.length === 0 ? (
              <View style={styles.emptyState}>
                <Svg width="64" height="64" viewBox="0 0 24 24">
                  <Path
                    d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"
                    fill={theme.colors.text.tertiary}
                  />
                </Svg>
                <Text style={styles.emptyText}>No books downloaded yet</Text>
                <Text style={styles.emptySubtext}>
                  Download books for offline access
                </Text>
              </View>
            ) : (
              <>
                {downloadedBooks.map((book) => (
                  <View key={`${book.book}_${book.translation}`} style={styles.bookItem}>
                    <View style={styles.bookInfo}>
                      <Text style={styles.bookName}>{book.book}</Text>
                      <Text style={styles.bookMeta}>
                        {book.translation} • {book.verse_count} verses • {' '}
                        {offlineService.formatStorageSize(book.storage_size_bytes)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(book.book, book.translation)}
                    >
                      <Svg width="20" height="20" viewBox="0 0 24 24">
                        <Path
                          d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                          fill={theme.colors.error.main}
                        />
                      </Svg>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAll}>
                  <Text style={styles.clearAllText}>Clear All Downloads</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.offWhiteParchment,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.oatmeal,
  },
  title: {
    fontSize: theme.typography.ui.heading.fontSize,
    fontWeight: theme.typography.ui.heading.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.secondary.lightGold,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  storageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  storageText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.oatmeal,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.secondary.lightGold,
  },
  tabText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600',
  },
  tabTextActive: {
    color: theme.colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  bookList: {
    padding: theme.spacing.md,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background.warmParchment,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary.oatmeal,
  },
  bookInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  bookName: {
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.xs,
  },
  bookTranslation: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  bookMeta: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.secondary.lightGold,
    borderRadius: theme.borderRadius.sm,
    minWidth: 100,
    justifyContent: 'center',
  },
  downloadButtonDisabled: {
    opacity: 0.6,
  },
  downloadButtonText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.colors.text.onDark,
    fontFamily: theme.typography.fonts.ui.default,
  },
  deleteButton: {
    padding: theme.spacing.sm,
  },
  clearAllButton: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.error.light,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  clearAllText: {
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: '600',
    color: theme.colors.error.main,
    fontFamily: theme.typography.fonts.ui.default,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
    gap: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
  },
});
