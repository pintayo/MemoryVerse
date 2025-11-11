import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../theme';
import SearchScreen from './SearchScreen';
import { FavoritesScreen } from './FavoritesScreen';
import { logger } from '../utils/logger';

type TabType = 'browse' | 'search' | 'favorites';

interface BibleScreenProps {
  navigation: any;
}

export const BibleScreen: React.FC<BibleScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('browse');

  // Bible books in order
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

  const handleBookSelect = (book: string) => {
    logger.log(`[BibleScreen] Selected book: ${book}`);
    // TODO: Navigate to book/chapter selection screen
    // navigation.navigate('BookChapters', { book });
  };

  const renderBrowseTab = () => (
    <ScrollView style={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse Bible</Text>
        <Text style={styles.headerSubtitle}>Select a book to start reading</Text>
      </View>

      {/* Old Testament */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Old Testament</Text>
        <View style={styles.bookGrid}>
          {OLD_TESTAMENT.map((book) => (
            <TouchableOpacity
              key={book}
              style={styles.bookCard}
              onPress={() => handleBookSelect(book)}
            >
              <Text style={styles.bookName}>{book}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* New Testament */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>New Testament</Text>
        <View style={styles.bookGrid}>
          {NEW_TESTAMENT.map((book) => (
            <TouchableOpacity
              key={book}
              style={styles.bookCard}
              onPress={() => handleBookSelect(book)}
            >
              <Text style={styles.bookName}>{book}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'browse' && styles.activeTab]}
          onPress={() => setActiveTab('browse')}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path
              d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 4h2v5l-1-.75L9 9V4zm9 16H6V4h1v9l3-2.25L13 13V4h5v16z"
              fill={activeTab === 'browse' ? theme.colors.secondary.lightGold : theme.colors.text.tertiary}
            />
          </Svg>
          <Text style={[styles.tabLabel, activeTab === 'browse' && styles.activeTabLabel]}>
            Browse
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path
              d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
              fill={activeTab === 'search' ? theme.colors.secondary.lightGold : theme.colors.text.tertiary}
            />
          </Svg>
          <Text style={[styles.tabLabel, activeTab === 'search' && styles.activeTabLabel]}>
            Search
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
          onPress={() => setActiveTab('favorites')}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              fill={activeTab === 'favorites' ? theme.colors.secondary.lightGold : theme.colors.text.tertiary}
            />
          </Svg>
          <Text style={[styles.tabLabel, activeTab === 'favorites' && styles.activeTabLabel]}>
            Favorites
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'browse' && renderBrowseTab()}
      {activeTab === 'search' && <SearchScreen navigation={navigation} />}
      {activeTab === 'favorites' && <FavoritesScreen navigation={navigation} />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.cream,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.lightCream,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.mutedStone,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.secondary.lightGold,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
  },
  activeTabLabel: {
    color: theme.colors.secondary.lightGold,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.background.lightCream,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.mutedStone,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary.darkCharcoal,
    marginBottom: 16,
  },
  bookGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bookCard: {
    backgroundColor: theme.colors.background.lightCream,
    borderRadius: 12,
    padding: 16,
    minWidth: '30%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
});
