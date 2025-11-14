import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Fill in the Blanks Mode</Text>
        <Text style={styles.subtitle}>Testing all imports - step 2...</Text>
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
