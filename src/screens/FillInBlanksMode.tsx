import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Button } from '../components';
import { theme } from '../theme';
import { verseService } from '../services/verseService';
import { Verse } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { practiceConfig } from '../config/practiceConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'FillInBlanks'>;

const FillInBlanksMode: React.FC<Props> = ({ navigation, route }) => {
  const { user, profile } = useAuth();

  const [verses, setVerses] = useState<Verse[]>([]);
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
        setVerses(loadedVerses);
      } else {
        setError('No verses found.');
      }
    } catch (err) {
      logger.error('[FillInBlanksMode] Error loading verses:', err);
      setError('Failed to load verses.');
    } finally {
      setIsLoading(false);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.title}>Fill in the Blanks</Text>
        <Text style={styles.text}>Loaded {verses.length} verses!</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} variant="olive" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.offWhiteParchment,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: theme.typography.fonts.ui.bold,
    color: theme.colors.text.primary,
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.ui.default,
    color: theme.colors.text.secondary,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.ui.default,
    color: theme.colors.feedback.error,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default FillInBlanksMode;
