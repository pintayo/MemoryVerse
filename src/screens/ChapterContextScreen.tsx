import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import {
  generateChapterContext,
  saveChapterContext,
  loadChapterContext,
  ChapterContext,
} from '../services/chapterContextService';
import { Card } from '../components';

interface ChapterContextScreenProps {
  navigation: any;
  route: {
    params: {
      book: string;
      chapter: number;
    };
  };
}

export const ChapterContextScreen: React.FC<ChapterContextScreenProps> = ({
  navigation,
  route,
}) => {
  const { book, chapter } = route.params;
  const [verses, setVerses] = useState<any[]>([]);
  const [context, setContext] = useState<ChapterContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, [book, chapter]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load verses
      const { data: versesData, error: versesError } = await supabase
        .from('verses')
        .select('*')
        .eq('book', book)
        .eq('chapter', chapter)
        .eq('translation', 'KJV')
        .order('verse_number');

      if (versesError) throw versesError;
      setVerses(versesData || []);

      // Try to load existing context from DB
      const existingContext = await loadChapterContext(book, chapter);

      if (existingContext) {
        logger.log('[ChapterContextScreen] Context loaded from DB');
        setContext(existingContext);
      } else {
        // Generate new context
        logger.log('[ChapterContextScreen] No cached context, generating new one');
        await handleGenerateContext(versesData || []);
      }
    } catch (error) {
      logger.error('[ChapterContextScreen] Error loading data:', error);
      Alert.alert('Error', 'Failed to load chapter context. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateContext = async (versesData: any[]) => {
    try {
      setIsGenerating(true);

      const result = await generateChapterContext(book, chapter, versesData);

      if (result.success && result.context) {
        // Add book and chapter info
        result.context.book = book;
        result.context.chapter = chapter;
        result.context.translation = 'KJV';

        setContext(result.context);

        // Save to database for future use
        await saveChapterContext(result.context);
      } else {
        Alert.alert(
          'Generation Failed',
          result.error || 'Failed to generate chapter context. Please try again.'
        );
      }
    } catch (error) {
      logger.error('[ChapterContextScreen] Error generating context:', error);
      Alert.alert('Error', 'Failed to generate chapter context. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading || isGenerating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
          <Text style={styles.headerTitle}>
            {book} {chapter}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.secondary.lightGold} />
          <Text style={styles.loadingText}>
            {isLoading ? 'Loading chapter context...' : 'Generating AI context...'}
          </Text>
          <Text style={styles.loadingSubtext}>
            This may take a moment as we analyze the chapter
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
        <Text style={styles.headerTitle}>
          {book} {chapter}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Feature Banner */}
        <View style={styles.premiumBanner}>
          <Svg width="48" height="48" viewBox="0 0 24 24">
            <Path
              d="M12 2 L15 9 L22 9 L17 14 L19 21 L12 17 L5 21 L7 14 L2 9 L9 9 Z"
              fill={theme.colors.secondary.lightGold}
            />
          </Svg>
          <Text style={styles.premiumTitle}>Premium Feature</Text>
          <Text style={styles.premiumSubtitle}>
            AI Chapter Context & Summary
          </Text>
        </View>

        {context && (
          <>
            {/* Main Themes */}
            {context.main_themes && (
              <Card variant="parchment" style={styles.contextCard}>
                <View style={styles.contextHeader}>
                  <Svg width="24" height="24" viewBox="0 0 24 24">
                    <Path
                      d="M9 11H15V13H9V11M9 15H15V17H9V15M9 7H15V9H9V7M4 2H20C21.1 2 22 2.9 22 4V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V4C2 2.9 2.9 2 4 2Z"
                      fill={theme.colors.secondary.lightGold}
                    />
                  </Svg>
                  <Text style={styles.contextTitle}>Main Themes & Teachings</Text>
                </View>
                <Text style={styles.contextText}>{context.main_themes}</Text>
              </Card>
            )}

            {/* Historical Context */}
            {context.historical_context && (
              <Card variant="warm" style={styles.contextCard}>
                <View style={styles.contextHeader}>
                  <Svg width="24" height="24" viewBox="0 0 24 24">
                    <Path
                      d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M16.2 16.2L11 13V7H12.5V12.2L17 14.9L16.2 16.2Z"
                      fill={theme.colors.secondary.warmTerracotta}
                    />
                  </Svg>
                  <Text style={styles.contextTitle}>Historical & Cultural Context</Text>
                </View>
                <Text style={styles.contextText}>{context.historical_context}</Text>
              </Card>
            )}

            {/* Key Verses */}
            {context.key_verses && (
              <Card variant="cream" style={styles.contextCard}>
                <View style={styles.contextHeader}>
                  <Svg width="24" height="24" viewBox="0 0 24 24">
                    <Path
                      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                      fill={theme.colors.accent.burnishedGold}
                    />
                  </Svg>
                  <Text style={styles.contextTitle}>Key Verses & Significance</Text>
                </View>
                <Text style={styles.contextText}>{context.key_verses}</Text>
              </Card>
            )}

            {/* Practical Applications */}
            {context.practical_applications && (
              <Card variant="lightCream" style={styles.contextCard}>
                <View style={styles.contextHeader}>
                  <Svg width="24" height="24" viewBox="0 0 24 24">
                    <Path
                      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"
                      fill={theme.colors.success.celebratoryGold}
                    />
                  </Svg>
                  <Text style={styles.contextTitle}>Practical Applications</Text>
                </View>
                <Text style={styles.contextText}>{context.practical_applications}</Text>
              </Card>
            )}

            {/* Cross References */}
            {context.cross_references && (
              <Card variant="warm" style={styles.contextCard}>
                <View style={styles.contextHeader}>
                  <Svg width="24" height="24" viewBox="0 0 24 24">
                    <Path
                      d="M10.59 13.41C11 13.8 11 14.44 10.59 14.83C10.2 15.22 9.56 15.22 9.17 14.83L5.83 11.5L9.17 8.17C9.56 7.78 10.2 7.78 10.59 8.17C11 8.56 11 9.19 10.59 9.59L8.67 11.5L10.59 13.41M13.41 9.59C13 9.2 13 8.56 13.41 8.17C13.8 7.78 14.44 7.78 14.83 8.17L18.17 11.5L14.83 14.83C14.44 15.22 13.8 15.22 13.41 14.83C13 14.44 13 13.81 13.41 13.41L15.33 11.5L13.41 9.59Z"
                      fill={theme.colors.primary.mutedStone}
                    />
                  </Svg>
                  <Text style={styles.contextTitle}>Cross-References</Text>
                </View>
                <Text style={styles.contextText}>{context.cross_references}</Text>
              </Card>
            )}
          </>
        )}

        {/* Chapter Info */}
        <View style={styles.chapterInfo}>
          <Text style={styles.chapterInfoTitle}>Chapter Information</Text>
          <Text style={styles.chapterInfoText}>
            <Text style={styles.chapterInfoLabel}>Book:</Text> {book}
          </Text>
          <Text style={styles.chapterInfoText}>
            <Text style={styles.chapterInfoLabel}>Chapter:</Text> {chapter}
          </Text>
          <Text style={styles.chapterInfoText}>
            <Text style={styles.chapterInfoLabel}>Verses:</Text> {verses.length}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.backToChapterButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backToChapterButtonText}>Back to Chapter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

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
    borderBottomColor: theme.colors.primary.mutedStone,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  premiumBanner: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.md,
  },
  premiumSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.xs,
  },
  contextCard: {
    marginBottom: theme.spacing.lg,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  contextTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  contextText: {
    fontSize: 15,
    lineHeight: 24,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  chapterInfo: {
    backgroundColor: theme.colors.background.warmParchment,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
  },
  chapterInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.md,
  },
  chapterInfoText: {
    fontSize: 15,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.xs,
  },
  chapterInfoLabel: {
    fontWeight: '600',
    color: theme.colors.secondary.lightGold,
  },
  backToChapterButton: {
    backgroundColor: theme.colors.secondary.lightGold,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  backToChapterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.onDark,
    fontFamily: theme.typography.fonts.ui.default,
  },
});

export default ChapterContextScreen;
