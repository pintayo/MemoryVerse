import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChapterVerses();
  }, [book, chapter]);

  const loadChapterVerses = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('verses')
        .select('*')
        .eq('book', book)
        .eq('chapter', chapter)
        .eq('translation', 'KJV')
        .order('verse_number');

      if (error) throw error;
      setVerses(data || []);
    } catch (error) {
      logger.error('[ChapterContextScreen] Error loading verses:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* Coming Soon Card */}
        <View style={styles.comingSoonCard}>
          <Svg width="80" height="80" viewBox="0 0 24 24">
            <Path
              d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 17C11.45 17 11 16.55 11 16V12C11 11.45 11.45 11 12 11C12.55 11 13 11.45 13 12V16C13 16.55 12.55 17 12 17ZM13 9H11V7H13V9Z"
              fill={theme.colors.secondary.lightGold}
            />
          </Svg>
          <Text style={styles.comingSoonTitle}>AI Chapter Summaries</Text>
          <Text style={styles.comingSoonText}>
            We're developing an advanced AI system that will provide comprehensive chapter summaries,
            including:
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>Main themes and teachings</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>Historical and cultural context</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>Key verses and their significance</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>Practical applications for daily life</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>Cross-references to related passages</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              This feature is currently in development and will be available to all premium members
              in a future update. Thank you for your patience!
            </Text>
          </View>
        </View>

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
  comingSoonCard: {
    backgroundColor: theme.colors.background.lightCream,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
  },
  comingSoonTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  comingSoonText: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  featuresList: {
    alignSelf: 'stretch',
    marginBottom: theme.spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
    paddingLeft: theme.spacing.md,
  },
  featureBullet: {
    fontSize: 16,
    color: theme.colors.secondary.lightGold,
    marginRight: theme.spacing.sm,
    fontWeight: '700',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    lineHeight: 22,
  },
  infoBox: {
    backgroundColor: theme.colors.background.cream,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.secondary.lightGold,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    lineHeight: 20,
    textAlign: 'center',
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
