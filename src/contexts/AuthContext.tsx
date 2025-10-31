console.log('[AuthContext] Module loading...');

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';

console.log('[AuthContext] Importing authService...');
import { authService } from '../services/authService';
console.log('[AuthContext] Importing profileService...');
import { profileService } from '../services/profileService';
console.log('[AuthContext] Importing database types...');
import { Profile } from '../types/database';

console.log('[AuthContext] All imports complete');

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

console.log('[AuthContext] About to define AuthProvider component...');

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('[AuthProvider] Component function called - rendering started');

  const [user, setUser] = useState<User | null>(() => {
    console.log('[AuthProvider] Initializing user state');
    return null;
  });
  const [profile, setProfile] = useState<Profile | null>(() => {
    console.log('[AuthProvider] Initializing profile state');
    return null;
  });
  const [session, setSession] = useState<Session | null>(() => {
    console.log('[AuthProvider] Initializing session state');
    return null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    console.log('[AuthProvider] Initializing isLoading state');
    return true;
  });

  // Load profile data when user changes
  const loadProfile = async (userId: string) => {
    try {
      console.log('[AuthContext] Loading profile for user:', userId);
      const profile = await profileService.getProfile(userId);
      console.log('[AuthContext] Profile result:', profile ? 'success' : 'null');
      if (profile) {
        setProfile(profile);
        console.log('[AuthContext] Profile loaded successfully');
      } else {
        console.warn('[AuthContext] No profile found for user:', userId);
      }
    } catch (error) {
      console.error('[AuthContext] Error loading profile:', error);
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
        console.log('[AuthContext] Starting auth initialization...');
        // Get current session
        const currentSession = await authService.getSession();
        console.log('[AuthContext] Session retrieved:', currentSession ? 'exists' : 'null');

        if (!mounted) return;

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);

          // Load profile data
          if (currentSession.user.id) {
            await loadProfile(currentSession.user.id);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: authListener } = authService.onAuthStateChange((event, currentSession) => {
      console.log('[AuthContext] Auth state changed:', event);

      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        // User signed in - load profile
        loadProfile(currentSession.user.id);
      } else {
        // User signed out - clear profile
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
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated: !!user,
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
