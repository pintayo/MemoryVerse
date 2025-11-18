/**
 * Learn Verse Screen (formerly Understand Screen)
 *
 * 5-verse learning sessions with chapter selection and context pre-loading
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import Card from '../components/Card';
import VerseReference from '../components/VerseReference';
import BibleCompanion from '../components/BibleCompanion';
import { ChapterSelector } from '../components/ChapterSelector';
import { StarButton } from '../components/StarButton';
import { verseSessionService, VerseSession } from '../services/verseSessionService';
import { Verse } from '../types/database';
import { logger } from '../utils/logger';
import { completeTask } from '../services/dailyTasksService';

logger.log('[LearnVerseScreen] Module loaded');

type RootStackParamList = {
  Understand: { verseId?: string };
  Home: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Understand'>;

export function LearnVerseScreen({ navigation, route }: Props) {
  const [session, setSession] = useState<VerseSession | null>(null);
  const [currentVerse, setCurrentVerse] = useState<Verse | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [showAiBadge, setShowAiBadge] = useState(false);

  // Initialize session on mount
  useEffect(() => {
    initializeSession();

    // Cleanup on unmount - reset session
    return () => {
      if (session) {
        verseSessionService.clearSession(session.book, session.chapter);
      }
    };
  }, []);

  // Load current verse when session or index changes
  useEffect(() => {
    if (session) {
      loadCurrentVerse();
    }
  }, [session?.currentIndex]);

  const initializeSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if a specific verseId was passed (e.g., from daily verse tap)
      const { verseId } = route.params || {};

      if (verseId) {
        logger.log('[LearnVerseScreen] Loading specific verse:', verseId);
        // TODO: For now, create a random session.
        // Future: could create a session around this specific verse
        const newSession = await verseSessionService.createSession('KJV', null, null);
        setSession(newSession);
      } else {
        // Create a new random session (all chapters)
        const newSession = await verseSessionService.createSession('KJV', null, null);
        setSession(newSession);
      }

      // Mark "understand" task as complete
      await completeTask('understand');
    } catch (err) {
      logger.error('[LearnVerseScreen] Error initializing session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load verses');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentVerse = async () => {
    if (!session) return;

    try {
      setIsLoadingContext(true);

      const result = await verseSessionService.getCurrentVerse(session);
      setCurrentVerse(result.verse);
      setContext(result.context);
      setShowAiBadge(result.verse?.context_generated_by_ai || false);
    } catch (err) {
      logger.error('[LearnVerseScreen] Error loading verse:', err);
      setError(err instanceof Error ? err.message : 'Failed to load verse');
    } finally {
      setIsLoadingContext(false);
    }
  };

  const handleChapterSelect = async (book: string | null, chapter: number | null) => {
    try {
      setIsLoading(true);
      setError(null);

      // Create new session with selected chapter
      const newSession = await verseSessionService.createSession('KJV', book, chapter);
      setSession(newSession);
    } catch (err) {
      logger.error('[LearnVerseScreen] Error creating session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load verses');
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (session && verseSessionService.hasNext(session)) {
      const success = verseSessionService.nextVerse(session);
      if (success) {
        setSession({ ...session }); // Trigger re-render
      }
    } else {
      // Session complete - show completion message
      Alert.alert(
        'Session Complete! 🎉',
        'You\'ve learned 5 verses! Would you like to start a new session?',
        [
          { text: 'Go Back', style: 'cancel', onPress: () => navigation.goBack() },
          { text: 'New Session', onPress: () => setShowChapterSelector(true) },
        ]
      );
    }
  };

  const handlePrevious = () => {
    if (session && verseSessionService.hasPrevious(session)) {
      const success = verseSessionService.previousVerse(session);
      if (success) {
        setSession({ ...session }); // Trigger re-render
      }
    }
  };

  const handleRefreshContext = () => {
    Alert.alert(
      'Regenerate Context',
      'This feature is coming soon in the pro version!',
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary.mutedStone} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Learn Verses</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.gold} />
          <Text style={styles.loadingText}>Loading verses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !session || !currentVerse) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary.mutedStone} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Learn Verses</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error.main} />
          <Text style={styles.errorText}>{error || 'Verses not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={initializeSession}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const reference = `${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse_number}`;
  const progress = verseSessionService.getProgress(session);
  const hasNext = verseSessionService.hasNext(session);
  const hasPrevious = verseSessionService.hasPrevious(session);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary.mutedStone} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Learn Verses</Text>
          <Text style={styles.progressText}>
            Verse {progress.current} of {progress.total}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <StarButton verseId={currentVerse.id} size={28} />
          <TouchableOpacity
            onPress={() => setShowChapterSelector(true)}
            style={styles.chapterButton}
          >
            <Ionicons name="library" size={24} color={colors.accent.gold} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Bible Companion */}
        <View style={styles.companionContainer}>
          <BibleCompanion
            streak={7}
            isCelebrating={false}
          />
        </View>

        {/* Verse Card */}
        <Card variant="parchment" style={styles.verseCard}>
          <VerseReference style={styles.reference}>{reference}</VerseReference>
          <Text style={styles.verseText}>
            {currentVerse.text}
          </Text>

          {currentVerse.category && (
            <View style={styles.categoryBadge}>
              <Ionicons name="bookmark" size={14} color={colors.accent.gold} />
              <Text style={styles.categoryText}>{currentVerse.category}</Text>
            </View>
          )}
        </Card>

        {/* Context Section */}
        <View style={styles.contextSection}>
          <View style={styles.contextHeader}>
            <View style={styles.contextTitleRow}>
              <Ionicons name="bulb" size={24} color={colors.accent.gold} />
              <Text style={styles.contextTitle}>Spiritual Context</Text>
            </View>

            {showAiBadge && (
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={12} color={colors.accent.gold} />
                <Text style={styles.aiBadgeText}>AI-Generated</Text>
              </View>
            )}
          </View>

          <Card variant="cream" style={styles.contextCard}>
            {isLoadingContext ? (
              <View style={styles.generatingContainer}>
                <ActivityIndicator size="small" color={colors.accent.gold} />
                <Text style={styles.generatingText}>
                  Loading context...
                </Text>
              </View>
            ) : context ? (
              <>
                <Text style={styles.contextText}>{context}</Text>

                {showAiBadge && (
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={handleRefreshContext}
                  >
                    <Ionicons name="refresh" size={16} color={colors.accent.gold} />
                    <Text style={styles.refreshButtonText}>Regenerate</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.noContextContainer}>
                <Ionicons name="information-circle" size={32} color={colors.primary.mutedStone} />
                <Text style={styles.noContextText}>
                  Context could not be loaded.
                </Text>
              </View>
            )}
          </Card>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, !hasPrevious && styles.navButtonDisabled]}
            onPress={handlePrevious}
            disabled={!hasPrevious}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={hasPrevious ? colors.accent.gold : colors.primary.mutedStone}
            />
            <Text style={[styles.navButtonText, !hasPrevious && styles.navButtonTextDisabled]}>
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {hasNext ? 'Next Verse' : 'Complete Session'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Chapter Selector Modal */}
      <ChapterSelector
        visible={showChapterSelector}
        onClose={() => setShowChapterSelector(false)}
        onSelect={handleChapterSelect}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary.parchmentCream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary.oatmeal,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.scripture.default,
    color: colors.primary.mutedStone,
    fontWeight: '600',
  },
  progressText: {
    fontSize: 12,
    fontFamily: typography.fonts.ui.default,
    color: colors.text.secondary,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chapterButton: {
    padding: spacing.xs,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: typography.fonts.ui.default,
    color: colors.primary.mutedStone,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  errorText: {
    fontSize: 16,
    fontFamily: typography.fonts.ui.default,
    color: colors.error.main,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: typography.fonts.ui.default,
    color: colors.text.onDark,
  },
  companionContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  verseCard: {
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  reference: {
    marginBottom: spacing.md,
  },
  verseText: {
    fontSize: 20,
    lineHeight: 32,
    color: '#2C1810',
    fontFamily: typography.fonts.scripture.default,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary.oatmeal,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: typography.fonts.ui.default,
    color: colors.accent.gold,
    textTransform: 'capitalize',
  },
  contextSection: {
    marginBottom: spacing.lg,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  contextTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  contextTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.ui.default,
    color: colors.primary.mutedStone,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.oatmeal,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 10,
    fontFamily: typography.fonts.ui.default,
    color: colors.accent.gold,
  },
  contextCard: {
    padding: spacing.lg,
  },
  contextText: {
    fontSize: 15,
    fontFamily: typography.fonts.ui.default,
    color: colors.text.primary,
    lineHeight: 24,
  },
  generatingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  generatingText: {
    fontSize: 15,
    fontFamily: typography.fonts.ui.default,
    color: colors.primary.mutedStone,
    textAlign: 'center',
  },
  noContextContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  noContextText: {
    fontSize: 15,
    fontFamily: typography.fonts.ui.default,
    color: colors.primary.mutedStone,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  refreshButtonText: {
    fontSize: 14,
    fontFamily: typography.fonts.ui.default,
    color: colors.accent.gold,
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: 'white',
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent.gold,
  },
  navButtonDisabled: {
    opacity: 0.3,
    borderColor: colors.primary.mutedStone,
  },
  navButtonText: {
    fontSize: 16,
    fontFamily: typography.fonts.ui.default,
    color: colors.accent.gold,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: colors.primary.mutedStone,
  },
  nextButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent.gold,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: typography.fonts.ui.default,
    color: 'white',
    fontWeight: '700',
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
