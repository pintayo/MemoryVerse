import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

const FillInBlanksScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Fill in the Blanks Mode</Text>
        <Text style={styles.subtitle}>Coming soon...</Text>
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
  },
});

export default FillInBlanksScreen;
