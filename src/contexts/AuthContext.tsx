import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
// import { purchaseService } from '../services/purchaseService'; // TODO: Uncomment for development build
import { Profile } from '../types/database';
import { logger } from '../utils/logger';
import { setSentryUser, clearSentryUser, addActionBreadcrumb, errorHandlers } from '../utils/sentryHelper';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean; // User is browsing without an account
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile data when user changes
  const loadProfile = async (userId: string) => {
    try {
      logger.log('[AuthContext] Loading profile for user:', userId);
      const profile = await profileService.getProfile(userId);
      if (profile) {
        setProfile(profile);
        logger.log('[AuthContext] Profile loaded successfully');

        // Set user context in Sentry for error tracking
        setSentryUser(userId, profile.email, profile.full_name || undefined);
        addActionBreadcrumb('Profile loaded', { userId });

        // Initialize RevenueCat with user ID for subscription tracking
        // TODO: Uncomment when using development build (not Expo Go)
        // try {
        //   await purchaseService.initialize(userId);
        //   logger.log('[AuthContext] RevenueCat initialized for user');
        // } catch (error) {
        //   logger.error('[AuthContext] RevenueCat initialization failed:', error);
        //   // Don't throw - allow app to continue without purchases
        // }
      } else {
        logger.warn('[AuthContext] No profile found for user:', userId);
      }
    } catch (error) {
      logger.error('[AuthContext] Error loading profile:', error);
      errorHandlers.handleAuthError(error as Error, 'load_profile');
    }
  };

  // Refresh profile data (called after updates)
  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  };

  // Check initial auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        logger.log('[AuthContext] Starting auth initialization...');
        const currentSession = await authService.getSession();
        logger.log('[AuthContext] Session retrieved:', currentSession ? 'exists' : 'null');

        if (!mounted) return;

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);

          if (currentSession.user.id) {
            await loadProfile(currentSession.user.id);
          }
        }
      } catch (error) {
        logger.error('[AuthContext] Error initializing auth:', error);
        errorHandlers.handleAuthError(error as Error, 'initialize_auth');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: authListener } = authService.onAuthStateChange((event, currentSession) => {
      logger.log('[AuthContext] Auth state changed:', event);

      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        loadProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Sign out handler
  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);

      // Clear user context from Sentry
      clearSentryUser();
      addActionBreadcrumb('User signed out');
    } catch (error) {
      logger.error('[AuthContext] Error signing out:', error);
      errorHandlers.handleAuthError(error as Error, 'sign_out');
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated: !!user,
    isGuest: !user, // User is guest if not authenticated
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
