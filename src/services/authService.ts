logger.log('[authService] Module loading...');

import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';
import { logger } from '../utils/logger';

logger.log('[authService] Module loaded, supabase client:', typeof supabase);

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Authentication Service
 * Handles all auth-related operations with Supabase
 */
export const authService = {
  /**
   * Sign up a new user
   */
  async signUp({ email, password, fullName }: SignUpData) {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (!result) {
      logger.warn('[authService] signUp returned undefined');
      throw new Error('Sign up failed');
    }

    const { data, error } = result;
    if (error) throw error;
    return data;
  },

  /**
   * Sign in an existing user
   */
  async signIn({ email, password }: SignInData) {
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!result) {
      logger.warn('[authService] signIn returned undefined');
      throw new Error('Sign in failed');
    }

    const { data, error } = result;
    if (error) throw error;
    return data;
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    const result = await supabase.auth.signOut();
    if (!result) {
      logger.warn('[authService] signOut returned undefined');
      return;
    }
    const { error } = result;
    if (error) throw error;
  },

  /**
   * Get the current user session
   */
  async getSession() {
    try {
      const result = await supabase.auth.getSession();
      if (!result) {
        logger.warn('[authService] getSession returned undefined');
        return null;
      }
      const { data, error } = result;
      if (error) throw error;
      return data?.session ?? null;
    } catch (error) {
      logger.error('[authService] Error getting session:', error);
      throw error;
    }
  },

  /**
   * Get the current user
   */
  async getUser() {
    try {
      const result = await supabase.auth.getUser();
      if (!result) {
        logger.warn('[authService] getUser returned undefined');
        return null;
      }
      const { data, error } = result;
      if (error) throw error;
      return data?.user ?? null;
    } catch (error) {
      logger.error('[authService] Error getting user:', error);
      throw error;
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    try {
      const result = supabase.auth.onAuthStateChange(callback);
      if (!result) {
        logger.warn('[authService] onAuthStateChange returned undefined');
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
      return result;
    } catch (error) {
      logger.error('[authService] Error setting up auth state listener:', error);
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const result = await supabase.auth.resetPasswordForEmail(email);
    if (!result) {
      logger.warn('[authService] resetPassword returned undefined');
      throw new Error('Reset password failed');
    }
    const { data, error } = result;
    if (error) throw error;
    return data;
  },

  /**
   * Update user password
   */
  async updatePassword(newPassword: string) {
    const result = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (!result) {
      logger.warn('[authService] updatePassword returned undefined');
      throw new Error('Update password failed');
    }
    const { data, error } = result;
    if (error) throw error;
    return data;
  },
};
