# MemoryVerse Code Patterns Reference

This document shows key code patterns used in MemoryVerse, useful for implementing Story Mode and AI Companion features.

---

## 1. SERVICE PATTERN (Data Layer)

### Example: VerseService (src/services/verseService.ts)

Services are the data/business logic layer that abstract away implementation details.

```typescript
// 1. Define a service class
class VerseService {
  // 2. Implement methods that interact with Supabase
  async getVerse(verseId: string): Promise<Verse | null> {
    try {
      const { data, error } = await supabase
        .from('verses')
        .select('*')
        .eq('id', verseId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('[VerseService] Error getting verse:', error);
      return null;
    }
  }

  // 3. Provide simple, reusable methods
  async searchVerses(query: string): Promise<Verse[]> {
    // Implementation...
  }

  async getVersesByBook(book: string): Promise<Verse[]> {
    // Implementation...
  }
}

// 4. Export singleton instance
export const verseService = new VerseService();
```

**Usage in Components:**
```typescript
const loadVerses = async () => {
  const verse = await verseService.getVerse(verseId);
  setVerse(verse);
};
```

---

## 2. CONTEXT PATTERN (State Management)

### Example: AuthContext (src/contexts/AuthContext.tsx)

Contexts provide global state that can be accessed from any component.

```typescript
// 1. Define context interface
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

// 2. Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Create provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // 4. Load initial state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const session = await authService.getSession();
      if (session?.user) {
        setUser(session.user);
        const profile = await profileService.getProfile(session.user.id);
        setProfile(profile);
      }
    };
    initializeAuth();
  }, []);

  const value: AuthContextType = {
    user,
    profile,
    isAuthenticated: !!user,
    signOut: async () => {
      await authService.signOut();
      setUser(null);
      setProfile(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 5. Create custom hook for using context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

**Usage in Components:**
```typescript
const MyComponent = () => {
  const { user, profile, isAuthenticated } = useAuth();
  // Component code...
};
```

---

## 3. FEATURE FLAG PATTERN

### How MemoryVerse Gates Premium Features

```typescript
// In src/config/featureFlags.ts
export const featureFlags: FeatureFlagsConfig = {
  aiCompanion: {
    enabled: true,
    premium: true,  // Requires premium subscription
    description: 'AI-powered prayer companion',
    version: 'v2.0',
  },
  storyMode: {
    enabled: true,
    premium: false,  // Free feature
    description: 'Guided Scripture story journey',
    version: 'v1.5',
  },
};

// In components, use the hook
import { useFeatureFlag, useHasPremium } from '../hooks/useFeatureFlag';

const HomeScreen = () => {
  const canUseCompanion = useFeatureFlag('aiCompanion');
  const isPremium = useHasPremium();

  if (!canUseCompanion) return null; // Feature disabled
  if (canUseCompanion && !isPremium) {
    return <PremiumPrompt feature="AI Companion" />;
  }

  return <AICompanion />;
};
```

---

## 4. USAGE LIMITS PATTERN

### How MemoryVerse Limits Premium Features

```typescript
// In src/services/usageLimitsService.ts
export async function checkAndIncrementUsage(
  userId: string,
  featureName: string,
  dailyLimit: number
): Promise<number> {
  // Call Supabase RPC function that:
  // 1. Checks today's usage count
  // 2. Compares to daily limit
  // 3. Increments if under limit
  // 4. Returns remaining uses (or -1 if limit exceeded)
  
  const { data, error } = await supabase.rpc(
    'check_and_increment_usage',
    {
      p_user_id: userId,
      p_feature_name: featureName,
      p_daily_limit: dailyLimit,
    }
  );
  
  return data as number;
}

// In components
const handlePrayerGeneration = async () => {
  const tier = getUserSubscriptionTier(isPremium, subscriptionTier);
  const remaining = await checkAndIncrementUsage(
    userId,
    FEATURES.AI_PRAYER_GENERATION,
    tier.dailyLimit
  );

  if (remaining < 0) {
    Alert.alert('Daily limit reached', 'Try again tomorrow!');
    return;
  }

  // Generate prayer...
  setRemainingUses(remaining);
};
```

---

## 5. ANIMATION PATTERN

### How MemoryVerse Animates Components

```typescript
import React, { useRef, useEffect } from 'react';
import { Animated, View } from 'react-native';

const AnimatedComponent = () => {
  // 1. Create animated values
  const breathAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // 2. Set up animations on mount
  useEffect(() => {
    // Breathing animation (loops forever)
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,  // Better performance
        }),
        Animated.timing(breathAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    breathing.start();

    return () => breathing.stop();
  }, [breathAnim]);

  // 3. Interpolate animated values to actual values
  const breathScale = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],  // 0 → 1 becomes 1 → 1.1 scale
  });

  // 4. Use in Animated.View
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: breathScale }],
        },
      ]}
    >
      {/* Content */}
    </Animated.View>
  );
};
```

---

## 6. PRAYER/CONVERSATION SCHEMA

### How Prayer Conversations Are Stored

```typescript
// Database structure for AI Companion conversations

// Table: prayer_conversations
interface PrayerConversation {
  id: string;           // UUID
  user_id: string;      // Foreign key to users
  title: string;        // "Morning Prayer", "Prayer about work", etc.
  created_at: string;   // ISO timestamp
  updated_at: string;
}

// Table: prayer_messages
interface PrayerMessage {
  id: string;
  conversation_id: string;  // Foreign key to prayer_conversations
  user_id: string;
  role: 'user' | 'assistant';  // Who said it
  content: string;             // The message text
  sentiment?: 'positive' | 'neutral' | 'negative' | 'grateful' | 'hopeful' | 'worried';
  created_at: string;
}

// Table: prayer_insights (AI analysis)
interface PrayerInsight {
  id: string;
  user_id: string;
  insight_type: 'weekly_summary' | 'monthly_summary' | 'theme' | 'growth_area';
  title: string;
  content: string;      // AI-generated insight
  metadata?: Record<string, any>;  // Extra data
  created_at: string;
}
```

---

## 7. AI INTEGRATION PATTERN

### How MemoryVerse Integrates with AI APIs

```typescript
// In src/services/contextGenerator.ts
import { PerplexityAPI } from 'perplexity-api';

class ContextGenerator {
  private perplexity = new PerplexityAPI(process.env.PERPLEXITY_API_KEY);

  async generateContext(verse: Verse): Promise<string> {
    try {
      const prompt = `
        Provide a brief historical and theological context for this Bible verse:
        ${verse.text}
        
        Include:
        1. Historical context (what was happening at this time)
        2. Theological significance
        3. Practical application today
      `;

      const response = await this.perplexity.chat({
        model: 'pplx-7b-online',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0].message.content;
    } catch (error) {
      logger.error('[ContextGenerator] Error:', error);
      return 'Unable to generate context';
    }
  }
}

export const contextGenerator = new ContextGenerator();
```

**Usage:**
```typescript
const loadVerseContext = async () => {
  const context = await contextGenerator.generateContext(verse);
  setContext(context);
};
```

---

## 8. COMPONENT PATTERN

### Standard Screen Component Structure

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import { myService } from '../services/myService';

// 1. Define props type
type Props = NativeStackScreenProps<RootStackParamList, 'MyScreen'>;

// 2. Create component
const MyScreen: React.FC<Props> = ({ navigation, route }) => {
  // 3. Get auth context
  const { user, profile } = useAuth();

  // 4. Define local state
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 5. Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const result = await myService.getData(user?.id);
      setData(result);
    } catch (err) {
      setError('Failed to load data');
      logger.error('[MyScreen] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Render
  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>{error}</Text>;

  return (
    <SafeAreaView style={styles.container}>
      <View>
        {/* Content */}
      </View>
    </SafeAreaView>
  );
};

// 7. Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.offWhiteParchment,
  },
});

export default MyScreen;
```

---

## 9. GUEST PROTECTION PATTERN

### How Features Are Gated for Unauthenticated Users

```typescript
import { useGuestProtection } from '../hooks/useGuestProtection';

const MyFeatureScreen = () => {
  const { guardAction, PromptComponent, isGuest } = useGuestProtection();

  const handleSaveFavorite = async () => {
    // Check if user is guest and needs sign-up prompt
    if (await guardAction('favorites')) {
      return;  // Prompt shown, action blocked
    }

    // User is authenticated, proceed
    await favoritesService.add(verseId);
    Alert.alert('Saved!', 'Verse added to favorites');
  };

  return (
    <View>
      <Button onPress={handleSaveFavorite} title="Save Favorite" />
      {PromptComponent}  {/* Shows sign-up prompt if needed */}
    </View>
  );
};
```

---

## 10. DATABASE MIGRATION FOR NEW FEATURES

### Schema for Story Mode

```sql
-- New table for stories
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  order_number INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Junction table: stories to verses
CREATE TABLE story_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id),
  verse_id UUID NOT NULL REFERENCES verses(id),
  order_in_story INTEGER NOT NULL,
  narrative_prompt TEXT,  -- Optional AI prompt for context
  created_at TIMESTAMP DEFAULT NOW()
);

-- Track user progress in stories
CREATE TABLE user_story_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  story_id UUID NOT NULL REFERENCES stories(id),
  current_verse_index INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Achievements for completing stories
CREATE TABLE story_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  story_id UUID NOT NULL REFERENCES stories(id),
  earned_at TIMESTAMP DEFAULT NOW()
);
```

---

## QUICK REFERENCE: Common Imports

```typescript
// Contexts
import { useAuth } from '../contexts/AuthContext';

// Services
import { verseService } from '../services/verseService';
import { practiceService } from '../services/practiceService';
import { spacedRepetitionService } from '../services/spacedRepetitionService';
import { supabase } from '../lib/supabase';

// Hooks
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { useGuestProtection } from '../hooks/useGuestProtection';

// Components
import { Button, Card, Input, VerseText } from '../components';

// Types
import { Verse, Profile, PracticeSession } from '../types/database';

// Theme
import { theme } from '../theme';

// Utils
import { logger } from '../utils/logger';
```

---

**This reference covers the main patterns you'll use for Story Mode and AI Companion implementation.**

