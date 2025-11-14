import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Button, Card, VerseReference } from '../components';
import { theme } from '../theme';
import { verseService } from '../services/verseService';
import { profileService } from '../services/profileService';
import { spacedRepetitionService } from '../services/spacedRepetitionService';
import { streakService } from '../services/streakService';
import { appReviewService } from '../services/appReviewService';
import { practiceService, BlankQuestion, BlankWord } from '../services/practiceService';
import { supabase } from '../lib/supabase';
import { Verse } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { practiceConfig } from '../config/practiceConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'FillInBlanks'>;

const FillInBlanksScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user, profile } = useAuth();

  const [verses, setVerses] = useState<Verse[]>([]);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentVerse = verses[currentVerseIndex];

  // Load verses on mount - TEMPORARILY DISABLED FOR DEBUGGING
  // useEffect(() => {
  //   logger.log('[FillInBlanksScreen] useEffect triggered');
  //   loadVerses();
  // }, []);

  const loadVerses = async () => {
    try {
      logger.log('[FillInBlanksScreen] loadVerses starting');
      setIsLoading(true);
      setError(null);

      const loadedVerses: Verse[] = [];

      // Load multiple random verses for practice lesson
      for (let i = 0; i < practiceConfig.versesPerLesson; i++) {
        const verse = await verseService.getRandomVerse('KJV');
        if (verse) loadedVerses.push(verse);
      }

      if (loadedVerses.length > 0) {
        setVerses(loadedVerses);
      } else {
        setError('No verses found. Please import Bible data.');
      }
    } catch (err) {
      logger.error('[FillInBlanksScreen] Error loading verses:', err);
      setError('Failed to load verses. Please try again.');
    } finally {
      setIsLoading(false);
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
        <Text style={styles.subtitle}>Testing with loadVerses - step 3...</Text>
        <Text style={styles.info}>Loaded {verses.length} verses</Text>
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
    marginBottom: 20,
  },
});

export default FillInBlanksScreen;
