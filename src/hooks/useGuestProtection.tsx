/**
 * useGuestProtection Hook
 *
 * Convenient hook for protecting features that require authentication
 * Returns a guard function that shows sign-up prompt if user is guest
 *
 * Usage:
 * const guardAction = useGuestProtection();
 *
 * const handleFavorite = async () => {
 *   if (await guardAction('favorites')) return; // Shows prompt if guest
 *   // User is authenticated, proceed
 *   await addToFavorites();
 * };
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { PromptTrigger } from '../services/guestModeService';
import { hasUserDismissedPrompt, incrementGuestPracticeCount, shouldShowPracticePrompt } from '../services/guestModeService';
import SignUpPrompt from '../components/SignUpPrompt';

// =============================================
// HOOK
// =============================================

export function useGuestProtection() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [promptVisible, setPromptVisible] = React.useState(false);
  const [currentTrigger, setCurrentTrigger] = React.useState<PromptTrigger>('practice');

  /**
   * Guard an action - returns true if user is guest and prompt was shown
   * Returns false if user is authenticated (action can proceed)
   */
  const guardAction = React.useCallback(
    async (
      trigger: PromptTrigger,
      options?: {
        allowFirstAction?: boolean; // Allow first practice/prayer without prompt
      }
    ): Promise<boolean> => {
      // User is authenticated - allow action
      if (user) {
        return false;
      }

      // Special handling for practice - allow first practice without prompt
      if (trigger === 'practice' && options?.allowFirstAction) {
        const showPrompt = await shouldShowPracticePrompt();
        if (!showPrompt) {
          // Allow this practice, increment counter for next time
          await incrementGuestPracticeCount();
          return false; // Don't block action
        }
      }

      // Check if user has dismissed this prompt
      const hasDismissed = await hasUserDismissedPrompt(trigger);
      if (hasDismissed) {
        return false; // Don't block action even though guest
      }

      // Show the prompt
      setCurrentTrigger(trigger);
      setPromptVisible(true);
      return true; // Block action
    },
    [user]
  );

  const handleSignUp = React.useCallback(() => {
    setPromptVisible(false);
    // @ts-ignore
    navigation.navigate('Signup');
  }, [navigation]);

  const handleDismiss = React.useCallback(() => {
    setPromptVisible(false);
  }, []);

  const PromptComponent = React.useMemo(
    () => (
      <SignUpPrompt
        visible={promptVisible}
        trigger={currentTrigger}
        onSignUp={handleSignUp}
        onDismiss={handleDismiss}
      />
    ),
    [promptVisible, currentTrigger, handleSignUp, handleDismiss]
  );

  return {
    guardAction,
    PromptComponent,
    isGuest: !user,
  };
}

export default useGuestProtection;
