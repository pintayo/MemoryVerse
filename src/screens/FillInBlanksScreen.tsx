console.log('[FillInBlanksScreen] Module loading...');

import React from 'react';
console.log('[FillInBlanksScreen] React imported');

import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
console.log('[FillInBlanksScreen] RN components imported');

import { SafeAreaView } from 'react-native-safe-area-context';
console.log('[FillInBlanksScreen] SafeAreaView imported');

import { NativeStackScreenProps } from '@react-navigation/native-stack';
console.log('[FillInBlanksScreen] Navigation imported');

import { RootStackParamList } from '../navigation/types';
console.log('[FillInBlanksScreen] Types imported');

import { Button, Card, VerseReference } from '../components';
console.log('[FillInBlanksScreen] Components imported');

import { theme } from '../theme';
console.log('[FillInBlanksScreen] Theme imported');

import { verseService } from '../services/verseService';
console.log('[FillInBlanksScreen] verseService imported');

import { profileService } from '../services/profileService';
console.log('[FillInBlanksScreen] profileService imported');

import { spacedRepetitionService } from '../services/spacedRepetitionService';
console.log('[FillInBlanksScreen] spacedRepetitionService imported');

import { streakService } from '../services/streakService';
console.log('[FillInBlanksScreen] streakService imported');

import { appReviewService } from '../services/appReviewService';
console.log('[FillInBlanksScreen] appReviewService imported');

import { practiceService, BlankQuestion, BlankWord } from '../services/practiceService';
console.log('[FillInBlanksScreen] practiceService imported');

import { supabase } from '../lib/supabase';
console.log('[FillInBlanksScreen] supabase imported');

import { Verse } from '../types/database';
console.log('[FillInBlanksScreen] database types imported');

import { useAuth } from '../contexts/AuthContext';
console.log('[FillInBlanksScreen] useAuth imported');

import { logger } from '../utils/logger';
console.log('[FillInBlanksScreen] logger imported');

import { practiceConfig } from '../config/practiceConfig';
console.log('[FillInBlanksScreen] practiceConfig imported');

console.log('[FillInBlanksScreen] All imports complete!');

type Props = NativeStackScreenProps<RootStackParamList, 'FillInBlanks'>;

const FillInBlanksScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user, profile } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Fill in the Blanks Mode</Text>
        <Text style={styles.subtitle}>Debugging imports...</Text>
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
    marginBottom: 20,
  },
});

export default FillInBlanksScreen;
