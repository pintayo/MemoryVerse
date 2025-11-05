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
import { shadows } from '../theme/shadows';
import Card from '../components/Card';
import VerseText from '../components/VerseText';
import VerseReference from '../components/VerseReference';
import BibleCompanion from '../components/BibleCompanion';
import { BibleVersePicker } from '../components/BibleVersePicker';
import { verseService } from '../services/verseService';
import { Verse } from '../types/database';
import { logger } from '../utils/logger';

logger.log('[UnderstandScreen] Module loaded');

type RootStackParamList = {
  Understand: { verseId: string };
  Home: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Understand'>;

export function UnderstandScreen({ navigation, route }: Props) {
  const { verseId } = route.params;

  const [verse, setVerse] = useState<Verse | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAiBadge, setShowAiBadge] = useState(false);
  const [showVersePicker, setShowVersePicker] = useState(false);
  const [currentVerseId, setCurrentVerseId] = useState(verseId);

  useEffect(() => {
    loadVerseWithContext();
  }, [currentVerseId]);

  const loadVerseWithContext = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await verseService.getVerseWithContext(currentVerseId);

      if (result.error) {
        setError(result.error);
        setVerse(result.verse);
        setContext(null);
        return;
      }

      setVerse(result.verse);
      setContext(result.context);
      setIsGenerating(result.contextGenerated);
      setShowAiBadge(result.verse?.context_generated_by_ai || false);

    } catch (err) {
      logger.error('[UnderstandScreen] Error loading verse:', err);
      setError(err instanceof Error ? err.message : 'Failed to load verse');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshContext = () => {
    Alert.alert(
      'Regenerate Context',
      'This feature is coming soon in the premium version!',
      [{ text: 'OK' }]
    );
  };

  const handleVerseSelect = (newVerseId: string) => {
    setCurrentVerseId(newVerseId);
  };

  const handleRandomVerse = async () => {
    const randomVerse = await verseService.getRandomVerse('NIV');
    if (randomVerse?.id) {
      setCurrentVerseId(randomVerse.id);
    }
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
          <Text style={styles.headerTitle}>Understanding</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.gold} />
          <Text style={styles.loadingText}>Loading verse...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !verse) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary.mutedStone} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Understanding</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error.main} />
          <Text style={styles.errorText}>{error || 'Verse not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadVerseWithContext}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const reference = `${verse.book} ${verse.chapter}:${verse.verse_number}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary.mutedStone} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Understanding</Text>
        <TouchableOpacity
          onPress={() => setShowVersePicker(true)}
          style={styles.bibleButton}
        >
          <Ionicons name="book" size={24} color={colors.accent.gold} />
        </TouchableOpacity>
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
          <Text style={[styles.verseText, {
            fontSize: 20,
            lineHeight: 32,
            color: '#2C1810',
            fontFamily: typography.fonts.scripture.default,
            textAlign: 'center',
            marginBottom: spacing.lg,
          }]}>
            {verse.text}
          </Text>

          {verse.category && (
            <View style={styles.categoryBadge}>
              <Ionicons name="bookmark" size={14} color={colors.accent.gold} />
              <Text style={styles.categoryText}>{verse.category}</Text>
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
            {isGenerating && !context ? (
              <View style={styles.generatingContainer}>
                <ActivityIndicator size="small" color={colors.accent.gold} />
                <Text style={styles.generatingText}>
                  Generating spiritual context for you...
                </Text>
                <Text style={styles.generatingSubtext}>
                  This may take a few moments
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
                  Context could not be generated at this time.
                </Text>
                <Text style={styles.noContextSubtext}>
                  Please check your internet connection and try again.
                </Text>
                <TouchableOpacity
                  style={styles.retryContextButton}
                  onPress={loadVerseWithContext}
                >
                  <Text style={styles.retryContextButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        </View>

        {/* Memory Tips */}
        <Card variant="parchment" style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="star" size={20} color={colors.accent.gold} />
            <Text style={styles.tipsTitle}>Memory Tips</Text>
          </View>

          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Read the verse aloud 3 times to engage auditory memory
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Break it into phrases and memorize one phrase at a time
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Visualize the meaning and create a mental picture
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Practice reciting from memory without looking
            </Text>
          </View>
        </Card>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bible Verse Picker Modal */}
      <BibleVersePicker
        visible={showVersePicker}
        onClose={() => setShowVersePicker(false)}
        onVerseSelect={handleVerseSelect}
        onRandomVerse={handleRandomVerse}
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
  headerTitle: {
    fontSize: 20,
    fontFamily: typography.fonts.scripture.default,
    color: colors.primary.mutedStone,
  },
  bibleButton: {
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
    marginBottom: spacing.md,
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
  generatingSubtext: {
    fontSize: 13,
    fontFamily: typography.fonts.ui.default,
    color: colors.text.secondary,
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
  noContextSubtext: {
    fontSize: 13,
    fontFamily: typography.fonts.ui.default,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryContextButton: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  retryContextButtonText: {
    fontSize: 14,
    fontFamily: typography.fonts.ui.default,
    color: colors.text.onDark,
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
  tipsCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: typography.fonts.ui.default,
    color: colors.primary.mutedStone,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingRight: spacing.md,
  },
  tipBullet: {
    fontSize: 14,
    fontFamily: typography.fonts.ui.default,
    color: colors.accent.gold,
    marginRight: spacing.sm,
    width: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontFamily: typography.fonts.ui.default,
    color: colors.text.primary,
    lineHeight: 20,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
