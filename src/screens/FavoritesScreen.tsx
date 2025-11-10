/**
 * Favorites Screen
 * Shows all favorited verses with category filtering and sorting
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../theme';
import { favoritesService, FavoriteVerse } from '../services/favoritesService';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { Card, StarButton } from '../components';

interface FavoritesScreenProps {
  navigation: any;
}

export function FavoritesScreen({ navigation }: FavoritesScreenProps) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteVerse[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'book' | 'category'>('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, [user?.id]);

  useEffect(() => {
    applyFilters();
  }, [favorites, selectedCategory, sortBy]);

  const loadFavorites = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      const [favs, cats] = await Promise.all([
        favoritesService.getFavorites(user.id, {
          translation: 'KJV',
          sortBy,
        }),
        favoritesService.getFavoriteCategories(user.id),
      ]);

      setFavorites(favs);
      setCategories(cats);
      logger.log(`[FavoritesScreen] Loaded ${favs.length} favorites, ${cats.length} categories`);
    } catch (error) {
      logger.error('[FavoritesScreen] Error loading favorites:', error);
      Alert.alert('Error', 'Failed to load favorites. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFavorites();
    setIsRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...favorites];

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(fav => fav.category === selectedCategory);
    }

    // Apply sorting
    switch (sortBy) {
      case 'book':
        filtered.sort((a, b) => {
          if (a.book !== b.book) return a.book.localeCompare(b.book);
          if (a.chapter !== b.chapter) return a.chapter - b.chapter;
          return a.verse_number - b.verse_number;
        });
        break;
      case 'category':
        filtered.sort((a, b) => {
          const catA = a.category || '';
          const catB = b.category || '';
          return catA.localeCompare(catB);
        });
        break;
      case 'recent':
      default:
        filtered.sort((a, b) =>
          new Date(b.favorited_at).getTime() - new Date(a.favorited_at).getTime()
        );
        break;
    }

    setFilteredFavorites(filtered);
  };

  const handleVersePress = (verseId: string) => {
    navigation.navigate('Understand', { verseId });
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Favorites',
      'Are you sure you want to remove all favorited verses?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;

            const result = await favoritesService.clearAllFavorites(user.id);
            if (result.success) {
              setFavorites([]);
              setFilteredFavorites([]);
              Alert.alert('Success', 'All favorites have been removed.');
            } else {
              Alert.alert('Error', 'Failed to clear favorites.');
            }
          },
        },
      ]
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Favorites</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.secondary.lightGold} />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (favorites.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Favorites</Text>
        </View>
        <View style={styles.centerContent}>
          <Svg width="80" height="80" viewBox="0 0 24 24">
            <Path
              d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"
              fill={theme.colors.text.tertiary}
            />
          </Svg>
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptyText}>
            Tap the star icon on any verse to add it to your favorites
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorites</Text>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterButton}
        >
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path
              d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"
              fill={showFilters ? theme.colors.secondary.lightGold : theme.colors.text.secondary}
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Category:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity
                style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.filterChipText, !selectedCategory && styles.filterChipTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[styles.filterChip, selectedCategory === category && styles.filterChipActive]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedCategory === category && styles.filterChipTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort by:</Text>
            <View style={styles.sortButtons}>
              {(['recent', 'book', 'category'] as const).map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.sortButton, sortBy === option && styles.sortButtonActive]}
                  onPress={() => setSortBy(option)}
                >
                  <Text style={[styles.sortButtonText, sortBy === option && styles.sortButtonTextActive]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Clear All Button */}
          {favorites.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
              <Text style={styles.clearButtonText}>Clear All ({favorites.length})</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Favorites List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.secondary.lightGold}
          />
        }
      >
        {filteredFavorites.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>
              No favorites found for "{selectedCategory}"
            </Text>
          </View>
        ) : (
          filteredFavorites.map(favorite => (
            <TouchableOpacity
              key={favorite.favorite_id}
              onPress={() => handleVersePress(favorite.id!)}
              activeOpacity={0.7}
            >
              <Card variant="warm" style={styles.verseCard}>
                <View style={styles.verseHeader}>
                  <View>
                    <Text style={styles.verseReference}>
                      {favorite.book} {favorite.chapter}:{favorite.verse_number}
                    </Text>
                    {favorite.category && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{favorite.category}</Text>
                      </View>
                    )}
                  </View>
                  <StarButton verseId={favorite.id!} size={28} onToggle={() => handleRefresh()} />
                </View>
                <Text style={styles.verseText} numberOfLines={3}>
                  {favorite.text}
                </Text>
                {favorite.notes && (
                  <View style={styles.notesContainer}>
                    <Svg width="16" height="16" viewBox="0 0 24 24">
                      <Path
                        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                        fill={theme.colors.text.tertiary}
                      />
                    </Svg>
                    <Text style={styles.notesText} numberOfLines={2}>{favorite.notes}</Text>
                  </View>
                )}
                <Text style={styles.favoritedDate}>
                  Added {new Date(favorite.favorited_at).toLocaleDateString()}
                </Text>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Results Count */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {selectedCategory
            ? `${filteredFavorites.length} of ${favorites.length} favorites`
            : `${favorites.length} favorite${favorites.length !== 1 ? 's' : ''}`}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.offWhiteParchment,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.oatmeal,
  },
  headerTitle: {
    fontSize: theme.typography.ui.title.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  filterButton: {
    padding: theme.spacing.xs,
  },
  filtersPanel: {
    backgroundColor: theme.colors.background.warmParchment,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.oatmeal,
  },
  filterSection: {
    marginBottom: theme.spacing.md,
  },
  filterLabel: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.fonts.ui.default,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.offWhiteParchment,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary.oatmeal,
  },
  filterChipActive: {
    backgroundColor: theme.colors.secondary.lightGold,
    borderColor: theme.colors.secondary.lightGold,
  },
  filterChipText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sortButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.offWhiteParchment,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary.oatmeal,
  },
  sortButtonActive: {
    backgroundColor: theme.colors.secondary.lightGold,
    borderColor: theme.colors.secondary.lightGold,
  },
  sortButtonText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  sortButtonTextActive: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  clearButton: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.error.main,
    fontFamily: theme.typography.fonts.ui.default,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  emptyTitle: {
    fontSize: theme.typography.ui.title.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontFamily: theme.typography.fonts.ui.default,
    paddingHorizontal: theme.spacing.xl,
  },
  verseCard: {
    marginBottom: theme.spacing.md,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  verseReference: {
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  categoryBadge: {
    backgroundColor: theme.colors.primary.oatmeal,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.secondary.lightGold,
    fontFamily: theme.typography.fonts.ui.default,
    textTransform: 'capitalize',
  },
  verseText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.scripture.default,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background.offWhiteParchment,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  notesText: {
    flex: 1,
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    fontStyle: 'italic',
  },
  favoritedDate: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  noResultsContainer: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontFamily: theme.typography.fonts.ui.default,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.primary.oatmeal,
    backgroundColor: theme.colors.background.warmParchment,
  },
  footerText: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontFamily: theme.typography.fonts.ui.default,
  },
});

export default FavoritesScreen;
