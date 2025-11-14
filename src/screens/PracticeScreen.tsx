import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Button } from '../components';
import { theme } from '../theme';
import { verseService } from '../services/verseService';
import { practiceService, PracticeMode } from '../services/practiceService';
import { Verse } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { practiceConfig } from '../config/practiceConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'Practice'>;

interface VerseWithMode {
  verse: Verse;
  mode: PracticeMode;
}

const PracticeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user, profile } = useAuth();

  const [versesWithModes, setVersesWithModes] = useState<VerseWithMode[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVerses();
  }, []);

  const loadVerses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const loadedVerses: Verse[] = [];

      for (let i = 0; i < practiceConfig.versesPerLesson; i++) {
        const verse = await verseService.getRandomVerse('KJV');
        if (verse) loadedVerses.push(verse);
      }

      if (loadedVerses.length > 0) {
        // Assign a random mode to each verse
        const userLevel = profile?.level || 1;
        const withModes = loadedVerses.map(verse => ({
          verse,
          mode: practiceService.selectModeForUser(userLevel)
        }));
        setVersesWithModes(withModes);
      } else {
        setError('No verses found.');
      }
    } catch (err) {
      logger.error('[PracticeScreen] Error loading verses:', err);
      setError('Failed to load verses.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < versesWithModes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Practice complete
      navigation.goBack();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.secondary.mutedGold} />
          <Text style={styles.text}>Loading verses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Try Again" onPress={loadVerses} variant="olive" />
        </View>
      </SafeAreaView>
    );
  }

  if (versesWithModes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>No verses available</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} variant="olive" />
        </View>
      </SafeAreaView>
    );
  }

  const currentVerseWithMode = versesWithModes[currentIndex];
  const { verse, mode } = currentVerseWithMode;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {versesWithModes.length}
          </Text>
          <Text style={styles.modeLabel}>
            {mode === 'recall' ? 'Recall' : mode === 'fill-in-blanks' ? 'Fill in Blanks' : 'Multiple Choice'}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.center}>
          <Text style={styles.reference}>
            {verse.book} {verse.chapter}:{verse.verse_number}
          </Text>
          <Text style={styles.verseText}>{verse.text}</Text>
          <Text style={styles.modeDescription}>
            Mode: {mode} - UI coming soon!
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Next Verse"
            onPress={handleNext}
            variant="olive"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.offWhiteParchment,
  },
  content: {
    flex: 1,
    padding: theme.spacing.screen.horizontal,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  progressText: {
    fontSize: theme.typography.ui.body.fontSize,
    fontFamily: theme.typography.fonts.ui.bold,
    color: theme.colors.text.secondary,
  },
  modeLabel: {
    fontSize: theme.typography.ui.caption.fontSize,
    fontFamily: theme.typography.fonts.ui.medium,
    color: theme.colors.secondary.mutedGold,
    textTransform: 'uppercase',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reference: {
    fontSize: theme.typography.ui.subheading.fontSize,
    fontFamily: theme.typography.fonts.ui.bold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  verseText: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.scripture.default,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 28,
  },
  modeDescription: {
    fontSize: theme.typography.ui.body.fontSize,
    fontFamily: theme.typography.fonts.ui.default,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
  actions: {
    paddingVertical: theme.spacing.lg,
  },
  text: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.ui.default,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  errorText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.ui.default,
    color: theme.colors.error.main,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default PracticeScreen;
