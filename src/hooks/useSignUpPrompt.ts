/**
 * useSignUpPrompt Hook
 *
 * Easy-to-use hook for showing sign-up prompts
 * Automatically checks if user is authenticated and if prompt has been dismissed
 *
 * Usage:
 * const { showSignUpPrompt, SignUpPromptComponent } = useSignUpPrompt();
 *
 * // In your component
 * const handleFavorite = async () => {
 *   if (await showSignUpPrompt('favorites')) {
 *     return; // User is guest and prompt was shown
 *   }
 *   // User is logged in, proceed with action
 * };
 */

import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import type { PromptTrigger } from '../services/guestModeService';
import { hasUserDismissedPrompt } from '../services/guestModeService';
import { logger } from '../utils/logger';

// =============================================
// TYPES
// =============================================

interface UseSignUpPromptReturn {
  /**
   * Show sign-up prompt if user is guest and hasn't dismissed it
   * Returns true if prompt was shown, false if user is authenticated
   */
  showSignUpPrompt: (trigger: PromptTrigger) => Promise<boolean>;

  /**
   * Current visible state
   */
  isVisible: boolean;

  /**
   * Current trigger
   */
  currentTrigger: PromptTrigger | null;

  /**
   * Manually show prompt (bypasses dismissed check)
   */
  forceShowPrompt: (trigger: PromptTrigger) => void;

  /**
   * Manually hide prompt
   */
  hidePrompt: () => void;
}

// =============================================
// HOOK
// =============================================

export function useSignUpPrompt(): UseSignUpPromptReturn {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [isVisible, setIsVisible] = useState(false);
  const [currentTrigger, setCurrentTrigger] = useState<PromptTrigger | null>(null);

  /**
   * Show sign-up prompt if conditions are met
   */
  const showSignUpPrompt = useCallback(
    async (trigger: PromptTrigger): Promise<boolean> => {
      // If user is authenticated, no need to show prompt
      if (user) {
        logger.log('[SignUpPrompt] User is authenticated, skipping prompt');
        return false;
      }

      // Check if user has dismissed this prompt
      const hasDismissed = await hasUserDismissedPrompt(trigger);
      if (hasDismissed) {
        logger.log('[SignUpPrompt] User has dismissed this prompt:', trigger);
        return false;
      }

      // Show the prompt
      setCurrentTrigger(trigger);
      setIsVisible(true);
      logger.log('[SignUpPrompt] Showing prompt for:', trigger);
      return true;
    },
    [user]
  );

  /**
   * Force show prompt (bypass dismissed check)
   */
  const forceShowPrompt = useCallback((trigger: PromptTrigger) => {
    setCurrentTrigger(trigger);
    setIsVisible(true);
    logger.log('[SignUpPrompt] Force showing prompt for:', trigger);
  }, []);

  /**
   * Hide the prompt
   */
  const hidePrompt = useCallback(() => {
    setIsVisible(false);
    setCurrentTrigger(null);
  }, []);

  return {
    showSignUpPrompt,
    isVisible,
    currentTrigger,
    forceShowPrompt,
    hidePrompt,
  };
}

/**
 * Higher-level hook that includes the component
 */
export function useSignUpPromptWithComponent() {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [isVisible, setIsVisible] = useState(false);
  const [currentTrigger, setCurrentTrigger] = useState<PromptTrigger>('practice');

  const showSignUpPrompt = useCallback(
    async (trigger: PromptTrigger): Promise<boolean> => {
      if (user) return false;

      const hasDismissed = await hasUserDismissedPrompt(trigger);
      if (hasDismissed) return false;

      setCurrentTrigger(trigger);
      setIsVisible(true);
      return true;
    },
    [user]
  );

  const handleSignUp = useCallback(() => {
    setIsVisible(false);
    // Navigate to signup screen
    // @ts-ignore - Navigation typing
    navigation.navigate('Signup');
  }, [navigation]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
  }, []);

  return {
    showSignUpPrompt,
    promptProps: {
      visible: isVisible,
      trigger: currentTrigger,
      onSignUp: handleSignUp,
      onDismiss: handleDismiss,
    },
  };
}

export default useSignUpPrompt;
