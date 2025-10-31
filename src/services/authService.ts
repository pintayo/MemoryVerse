import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';

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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign in an existing user
   */
  async signIn({ email, password }: SignInData) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get the current user session
   */
  async getSession() {
    try {
      const result = await supabase.auth.getSession();
      if (!result) {
        console.warn('[authService] getSession returned undefined');
        return null;
      }
      const { data, error } = result;
      if (error) throw error;
      return data?.session ?? null;
    } catch (error) {
      console.error('[authService] Error getting session:', error);
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
        console.warn('[authService] getUser returned undefined');
        return null;
      }
      const { data, error } = result;
      if (error) throw error;
      return data?.user ?? null;
    } catch (error) {
      console.error('[authService] Error getting user:', error);
      throw error;
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const { data, error} = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  },

  /**
   * Update user password
   */
  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  },
};
