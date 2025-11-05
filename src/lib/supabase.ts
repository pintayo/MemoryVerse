import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('[Supabase] Missing environment variables!');
  logger.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl);
  logger.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '***' : 'undefined');
  throw new Error(
    'Missing Supabase environment variables. Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

logger.log('[Supabase] Initializing with URL:', supabaseUrl);

// Custom storage adapter for React Native
// Uses SecureStore for sensitive data on mobile, AsyncStorage for web
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      if (Platform.OS === 'web') {
        return AsyncStorage.getItem(key);
      }
      return SecureStore.getItemAsync(key);
    } catch (error) {
      logger.error('[Supabase Storage] Error getting item:', key, error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (Platform.OS === 'web') {
        return AsyncStorage.setItem(key, value);
      }
      return SecureStore.setItemAsync(key, value);
    } catch (error) {
      logger.error('[Supabase Storage] Error setting item:', key, error);
    }
  },
  removeItem: async (key: string) => {
    try {
      if (Platform.OS === 'web') {
        return AsyncStorage.removeItem(key);
      }
      return SecureStore.deleteItemAsync(key);
    } catch (error) {
      logger.error('[Supabase Storage] Error removing item:', key, error);
    }
  },
};

logger.log('[Supabase] Creating client with config...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter as any,
    autoRefreshToken: false,  // TEMPORARY: Disable to test
    persistSession: false,    // TEMPORARY: Disable to test
    detectSessionInUrl: false,
    // Disable auto-detection to prevent early storage access
    storageKey: 'memoryverse-auth-token',
  },
  global: {
    headers: {
      'x-client-info': 'memoryverse-app',
    },
  },
});

logger.log('[Supabase] Client created successfully');
logger.log('[Supabase] Client auth object:', typeof supabase.auth);
logger.log('[Supabase] Initialization complete');
