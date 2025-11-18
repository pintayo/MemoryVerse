# Guest Mode Integration Guide

This guide shows you how to integrate guest mode protection into your existing screens.

## Overview

Guest mode allows users to explore the app without signing in. They can:
- ✅ Read daily verse
- ✅ Browse the Bible
- ✅ Practice verses (first time without prompt)
- ✅ Use prayer feature (first time without prompt)
- ✅ Search verses

Features that require sign-up:
- ⭐ Saving favorites
- 📊 Tracking progress and streaks
- 🏆 Achievements
- 📝 Study notes
- 📚 Collections
- 📈 Advanced analytics
- 📤 Exporting data
- 🙏 Prayer history

## Quick Integration

### 1. Using `useGuestProtection` Hook (Recommended)

The easiest way to protect a feature:

```typescript
import { useGuestProtection } from '../hooks/useGuestProtection';

function MyScreen() {
  const { guardAction, PromptComponent } = useGuestProtection();

  const handleFavorite = async () => {
    // Check if user is guest - shows prompt if needed
    if (await guardAction('favorites')) {
      return; // User is guest and prompt was shown
    }

    // User is authenticated, proceed with action
    await addToFavorites();
  };

  return (
    <View>
      {/* Your screen content */}
      <Button onPress={handleFavorite}>Add to Favorites</Button>

      {/* Add the prompt component */}
      {PromptComponent}
    </View>
  );
}
```

### 2. Available Triggers

Use these triggers based on the feature you're protecting:

| Trigger | Use Case | Example |
|---------|----------|---------|
| `'practice'` | Practice sessions | Before starting practice |
| `'favorites'` | Favorite verses | Before adding to favorites |
| `'progress'` | Progress tracking | Before viewing progress |
| `'streaks'` | Daily streaks | Before viewing streak calendar |
| `'achievements'` | Achievements | Before viewing achievements |
| `'notes'` | Study notes | Before adding/viewing notes |
| `'collections'` | Verse collections | Before creating collection |
| `'analytics'` | Advanced analytics | Before viewing analytics |
| `'export'` | Data export | Before exporting data |
| `'prayer_history'` | Prayer history | Before viewing prayer history |

### 3. Special Cases

#### Allow First Action (Practice/Prayer)

For practice and prayer features, allow the first action without showing a prompt:

```typescript
const handlePractice = async () => {
  // Allow first practice without prompt
  if (await guardAction('practice', { allowFirstAction: true })) {
    return;
  }

  // Proceed with practice
  startPractice();
};
```

#### Manual Prompt Control

For more control, use the hook directly:

```typescript
import { useSignUpPromptWithComponent } from '../hooks/useSignUpPrompt';

function MyScreen() {
  const { showSignUpPrompt, promptProps } = useSignUpPromptWithComponent();

  const handleAction = async () => {
    const shouldBlock = await showSignUpPrompt('favorites');
    if (shouldBlock) return;

    // Proceed...
  };

  return (
    <View>
      {/* Your content */}
      <SignUpPrompt {...promptProps} />
    </View>
  );
}
```

## Complete Examples

### Example 1: Favorites Screen

```typescript
import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useGuestProtection } from '../hooks/useGuestProtection';
import { getGuestFavorites, addGuestFavorite, removeGuestFavorite } from '../services/guestModeService';
import { favoritesService } from '../services/favoritesService';

export function FavoritesScreen() {
  const { user } = useAuth();
  const { guardAction, PromptComponent } = useGuestProtection();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    loadFavorites();
  }, [user]);

  const loadFavorites = async () => {
    if (user) {
      // Load from database for authenticated users
      const data = await favoritesService.getFavorites(user.id);
      setFavorites(data);
    } else {
      // Load from local storage for guests
      const guestFavs = await getGuestFavorites();
      setFavorites(guestFavs);
    }
  };

  const handleAddFavorite = async (verseId: string) => {
    // Show prompt if guest
    if (await guardAction('favorites')) {
      return;
    }

    // Add favorite
    if (user) {
      await favoritesService.addFavorite(user.id, verseId);
    } else {
      // Shouldn't reach here, but handle anyway
      await addGuestFavorite(verseId);
    }

    await loadFavorites();
  };

  const handleRemoveFavorite = async (verseId: string) => {
    // Allow removal without prompt
    if (user) {
      await favoritesService.removeFavorite(user.id, verseId);
    } else {
      await removeGuestFavorite(verseId);
    }

    await loadFavorites();
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={favorites}
        renderItem={({ item }) => (
          <View>
            <Text>{item.text}</Text>
            <TouchableOpacity onPress={() => handleRemoveFavorite(item.id)}>
              <Text>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Sign-up prompt */}
      {PromptComponent}
    </View>
  );
}
```

### Example 2: Practice Screen

```typescript
import React from 'react';
import { View, Button } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useGuestProtection } from '../hooks/useGuestProtection';
import { incrementGuestPracticeCount } from '../services/guestModeService';

export function PracticeScreen() {
  const { user } = useAuth();
  const { guardAction, PromptComponent } = useGuestProtection();

  const handleStartPractice = async () => {
    // Allow first practice without prompt
    if (await guardAction('practice', { allowFirstAction: true })) {
      return; // Guest user, prompt shown (or will show on next practice)
    }

    // Start practice session
    // For authenticated users: save to database
    // For guests: just practice without saving
    startPracticeSession();
  };

  const startPracticeSession = () => {
    if (!user) {
      console.log('Guest user - progress will not be saved');
    }
    // Your practice logic here
  };

  return (
    <View>
      <Button title="Start Practice" onPress={handleStartPractice} />
      {PromptComponent}
    </View>
  );
}
```

### Example 3: Profile Screen (Show Sign-Up CTA for Guests)

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

export function ProfileScreen() {
  const { user, isGuest } = useAuth();
  const navigation = useNavigation();

  if (isGuest) {
    return (
      <View style={styles.guestContainer}>
        <Text style={styles.guestIcon}>👤</Text>
        <Text style={styles.guestTitle}>You're Browsing as Guest</Text>
        <Text style={styles.guestMessage}>
          Sign up to save your progress, earn achievements, and sync across devices!
        </Text>

        <TouchableOpacity
          style={styles.signUpButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.signUpButtonText}>Create Free Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>I Have an Account</Text>
        </TouchableOpacity>

        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Benefits of Signing Up:</Text>
          <Text style={styles.benefitItem}>📊 Track your progress</Text>
          <Text style={styles.benefitItem}>🔥 Build daily streaks</Text>
          <Text style={styles.benefitItem}>⭐ Save favorite verses</Text>
          <Text style={styles.benefitItem}>🏆 Unlock achievements</Text>
          <Text style={styles.benefitItem}>☁️ Sync across devices</Text>
        </View>
      </View>
    );
  }

  // Show normal profile for authenticated users
  return (
    <View>
      {/* Your normal profile UI */}
    </View>
  );
}

const styles = StyleSheet.create({
  guestContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  guestIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.clay,
    marginBottom: 12,
    fontFamily: theme.fonts.serif,
  },
  guestMessage: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  signUpButton: {
    backgroundColor: theme.colors.clay,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    maxWidth: 300,
  },
  signUpButtonText: {
    color: theme.colors.parchment,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  loginButton: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginBottom: 32,
  },
  loginButtonText: {
    color: theme.colors.clay,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  benefitsContainer: {
    alignItems: 'flex-start',
    width: '100%',
    maxWidth: 300,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.clay,
    marginBottom: 12,
  },
  benefitItem: {
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 8,
  },
});
```

## Best Practices

1. **Always add the PromptComponent**: Don't forget to include `{PromptComponent}` in your JSX

2. **Use appropriate triggers**: Choose the trigger that best describes the feature

3. **Allow first actions for practice/prayer**: Use `allowFirstAction: true` for better UX

4. **Handle both cases**: Always have code paths for both authenticated and guest users

5. **Show guest state in UI**: Make it clear when users are browsing as guest (especially in Profile)

6. **Don't save guest data to database**: Only save to local storage for guests

7. **Clear guest data on signup**: Use `clearGuestData()` when users sign up

## Testing Guest Mode

1. Sign out of the app (or use a fresh install)
2. Skip onboarding
3. Try to use a protected feature
4. Verify the appropriate sign-up prompt appears
5. Test "Don't show again" functionality
6. Test that first practice/prayer doesn't show prompt

## Migration on Sign-Up

When a guest signs up, you may want to migrate their local data:

```typescript
import { getGuestFavorites, clearGuestData } from '../services/guestModeService';

async function handleSignUpSuccess(userId: string) {
  // Migrate guest favorites
  const guestFavorites = await getGuestFavorites();
  if (guestFavorites.length > 0) {
    await favoritesService.bulkAddFavorites(userId, guestFavorites);
  }

  // Clear guest data
  await clearGuestData();

  // Navigate to main app
  navigation.navigate('Main');
}
```

## API Reference

### useGuestProtection()

```typescript
const { guardAction, PromptComponent, isGuest } = useGuestProtection();
```

- `guardAction(trigger, options?)` - Check if user is guest and show prompt if needed
- `PromptComponent` - React component to render the sign-up prompt
- `isGuest` - Boolean indicating if user is browsing as guest

### Guest Mode Services

```typescript
import {
  hasUserDismissedPrompt,
  dismissPrompt,
  getGuestFavorites,
  addGuestFavorite,
  removeGuestFavorite,
  clearGuestData,
  getSignUpBenefits,
} from '../services/guestModeService';
```

See `src/services/guestModeService.ts` for complete API documentation.
