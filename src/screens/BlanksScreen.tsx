import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

const BlanksScreen: React.FC<any> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.title}>Fill in the Blanks</Text>
        <Text style={styles.text}>Coming soon!</Text>
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
});

export default BlanksScreen;
