console.log('[FillInBlanksScreen] Module loading...');

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Button, Card, VerseReference } from '../components';
import { theme } from '../theme';
import { verseService } from '../services/verseService';
import { Verse } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { practiceConfig } from '../config/practiceConfig';

console.log('[FillInBlanksScreen] All imports complete!');

type Props = NativeStackScreenProps<RootStackParamList, 'FillInBlanks'>;

const FillInBlanksScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user, profile } = useAuth();

  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load verses on mount
  useEffect(() => {
    logger.log('[FillInBlanksScreen] useEffect triggered, calling loadVerses');
    loadVerses();
  }, []);

  const loadVerses = async () => {
    try {
      logger.log('[FillInBlanksScreen] loadVerses starting');
      setIsLoading(true);
      setError(null);

      const loadedVerses: Verse[] = [];

      logger.log(`[FillInBlanksScreen] Loading ${practiceConfig.versesPerLesson} verses`);

      // Load verses one at a time with error handling
      for (let i = 0; i < practiceConfig.versesPerLesson; i++) {
        logger.log(`[FillInBlanksScreen] Loading verse ${i + 1}/${practiceConfig.versesPerLesson}`);

        try {
          const verse = await verseService.getRandomVerse('KJV');
          logger.log(`[FillInBlanksScreen] Verse ${i + 1} loaded:`, verse ? 'success' : 'null');

          if (verse) {
            loadedVerses.push(verse);
          }
        } catch (verseError) {
          logger.error(`[FillInBlanksScreen] Error loading verse ${i + 1}:`, verseError);
          // Continue trying to load other verses
        }
      }

      logger.log(`[FillInBlanksScreen] Loaded ${loadedVerses.length} verses total`);

      if (loadedVerses.length > 0) {
        setVerses(loadedVerses);
      } else {
        setError('No verses found. Please import Bible data.');
      }
    } catch (err) {
      logger.error('[FillInBlanksScreen] Error in loadVerses:', err);
      setError('Failed to load verses. Please try again.');
    } finally {
      setIsLoading(false);
      logger.log('[FillInBlanksScreen] loadVerses completed');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.secondary.mutedGold} />
          <Text style={styles.loadingText}>Loading verses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Try Again" onPress={loadVerses} variant="olive" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Fill in the Blanks Mode</Text>
        <Text style={styles.subtitle}>Verses loaded successfully!</Text>
        <Text style={styles.info}>Loaded {verses.length} verses</Text>
        <Text style={styles.info}>User: {user?.email || 'Not logged in'}</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          variant="olive"
        />
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontFamily: theme.typography.fonts.ui.default,
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: theme.typography.fonts.ui.default,
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.feedback.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: theme.typography.fonts.ui.bold,
    color: theme.colors.text.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.ui.default,
    color: theme.colors.text.secondary,
    marginBottom: 10,
  },
  info: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.ui.default,
    color: theme.colors.text.tertiary,
    marginBottom: 10,
  },
});

export default FillInBlanksScreen;
