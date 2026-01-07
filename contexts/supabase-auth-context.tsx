"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  photo_url: string | null;
  role: 'user' | 'creator';
  created_at: string;
  updated_at: string;
}

interface CreatorProfile {
  id: string;
  user_id: string;
  bio: string | null;
  category: string | null;
  is_verified: boolean;
  total_earnings: number;
  supporters_count: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  creatorProfile: CreatorProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isCreator: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<{ data: any; error: any }>;
  signInWithEmail: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateUserRole: (role: 'user' | 'creator') => Promise<{ error: any }>;
  createCreatorProfile: (bio: string, category: string) => Promise<{ error: any }>;
  createUserProfile: (role: 'user' | 'creator') => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Load user profile data
  const loadUserProfile = async (userId: string, retryCount = 0): Promise<void> => {
    const maxRetries = 2; // Reduced retries to prevent long delays
    
    try {
      logger.debug('Loading user profile', 'AUTH_CONTEXT', { userId, retryCount });
      
      // Wait a bit if retrying (database trigger might be creating profile)
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 500 * retryCount)); // Reduced wait time
      }
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If no profile exists, create one automatically
        if (error.code === 'PGRST116') {
          logger.info('No user profile found, creating automatically', 'AUTH_CONTEXT', { userId, retryCount });
          
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const { data: newProfile, error: createError } = await supabase
              .from('users')
              .insert({
                id: authUser.id,
                email: authUser.email || '',
                display_name: authUser.user_metadata?.display_name || 
                             authUser.user_metadata?.full_name || 
                             authUser.user_metadata?.name ||
                             authUser.email?.split('@')[0] || 
                             'User',
                photo_url: authUser.user_metadata?.avatar_url || 
                          authUser.user_metadata?.picture || 
                          null,
                role: 'user'
              })
              .select()
              .single();

            if (createError) {
              // If duplicate key error, profile was created by trigger - retry once
              if (createError.code === '23505' && retryCount < 1) {
                logger.debug('Profile creation conflict, retrying', 'AUTH_CONTEXT', {
                  retryCount: retryCount + 1
                });
                return loadUserProfile(userId, retryCount + 1);
              }
              
              logger.warn('Failed to auto-create user profile, will continue without profile', 'AUTH_CONTEXT', {
                userId,
                error: createError.message,
                errorCode: createError.code
              });
              // Don't set to null - allow UI to render with fallback
              return;
            }
            
            logger.info('User profile auto-created successfully', 'AUTH_CONTEXT', {
              userId,
              profileId: newProfile.id
            });
            setUserProfile(newProfile);
            setCreatorProfile(null);
            return;
          } else {
            logger.warn('No auth user found when trying to create profile', 'AUTH_CONTEXT', { userId });
            // Don't block - allow UI to render
            return;
          }
        }
        
        // Other errors - retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          logger.debug('Error loading profile, retrying', 'AUTH_CONTEXT', {
            userId,
            retryCount: retryCount + 1,
            error: error.message
          });
          return loadUserProfile(userId, retryCount + 1);
        }
        
        logger.warn('Error loading user profile after retries, continuing anyway', 'AUTH_CONTEXT', {
          userId,
          error: error.message,
          errorCode: error.code
        });
        // Don't block - allow UI to render with fallback
        return;
      }

      logger.debug('User profile loaded', 'AUTH_CONTEXT', {
        userId,
        role: profile.role,
        displayName: profile.display_name
      });
      setUserProfile(profile);

      // If user is a creator, load creator profile (non-blocking)
      if (profile.role === 'creator') {
        logger.debug('Loading creator profile', 'AUTH_CONTEXT', { userId });
        
        const { data: creatorData, error: creatorError } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!creatorError && creatorData) {
          logger.debug('Creator profile loaded', 'AUTH_CONTEXT', {
            userId,
            creatorProfileId: creatorData.id
          });
          setCreatorProfile(creatorData);
        } else if (creatorError?.code === 'PGRST116') {
          logger.debug('No creator profile found yet', 'AUTH_CONTEXT', { userId });
          setCreatorProfile(null);
        } else {
          logger.warn('Error loading creator profile', 'AUTH_CONTEXT', {
            userId,
            error: creatorError?.message
          });
          setCreatorProfile(null);
        }
      } else {
        setCreatorProfile(null);
      }
    } catch (error) {
      logger.warn('Exception in loadUserProfile, continuing anyway', 'AUTH_CONTEXT', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      // Don't set to null - allow UI to render with fallback
    }
  };

  useEffect(() => {
    if (initialized) return;

    // Get initial session
    const getInitialSession = async () => {
      try {
        logger.debug('Getting initial session', 'AUTH_CONTEXT');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('Error getting session', 'AUTH_CONTEXT', {
            error: error.message,
            errorCode: error.status
          });
          
          // Clear invalid session
          if (error.message.includes('refresh_token_not_found') || error.message.includes('Invalid Refresh Token')) {
            logger.info('Clearing invalid session', 'AUTH_CONTEXT');
            await supabase.auth.signOut();
          }
        }
        
        logger.debug('Initial session retrieved', 'AUTH_CONTEXT', {
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
        
        setLoading(false);
        setInitialized(true);
      } catch (error) {
        logger.error('Exception in getInitialSession', 'AUTH_CONTEXT', {
          error: error instanceof Error ? error.message : String(error)
        });
        setLoading(false);
        setInitialized(true);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        logger.info('Auth state changed', 'AUTH_CONTEXT', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email
        });
        
        // Handle specific auth events
        if (event === 'SIGNED_OUT') {
          logger.info('User signed out', 'AUTH_CONTEXT');
          setUserProfile(null);
          setCreatorProfile(null);
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Handle TOKEN_REFRESHED - don't block UI if we have profile, but reload if missing
        if (event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session?.user ?? null);
          
          // If we have a profile, don't reload (just update session)
          if (userProfile && session?.user?.id === userProfile.id) {
            setLoading(false);
            return;
          }
          
          // If profile is missing or user changed, reload it (but don't block UI)
          if (session?.user) {
            setLoading(false); // Don't block UI during token refresh
            // Load profile in background
            loadUserProfile(session.user.id).catch((error) => {
              logger.error('Error loading profile after token refresh', 'AUTH_CONTEXT', {
                error: error instanceof Error ? error.message : String(error)
              });
            });
          }
          return;
        }
        
        // For other events, set loading and reload profile
        setLoading(true);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            await loadUserProfile(session.user.id);
          } catch (error) {
            logger.error('Error loading profile in auth state change', 'AUTH_CONTEXT', {
              error: error instanceof Error ? error.message : String(error)
            });
          }
        } else {
          setUserProfile(null);
          setCreatorProfile(null);
        }
        
        // Always set loading to false after handling auth state changes
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initialized]);

  const signInWithGoogle = async () => {
    try {
      logger.info('Initiating Google sign-in', 'AUTH_CONTEXT');
      
      const redirectUrl = `${window.location.origin}/auth/callback`;
      logger.debug('Google OAuth redirect URL', 'AUTH_CONTEXT', { redirectUrl });
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        logger.error('Google sign-in error', 'AUTH_CONTEXT', {
          error: error.message,
          errorCode: error.status
        });
      } else {
        logger.info('Google sign-in initiated successfully', 'AUTH_CONTEXT', {
          url: data?.url
        });
      }
      
      return { data, error };
    } catch (error) {
      logger.error('Exception in signInWithGoogle', 'AUTH_CONTEXT', {
        error: error instanceof Error ? error.message : String(error)
      });
      return { data: null, error };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      logger.info('Signing in with email', 'AUTH_CONTEXT', { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        logger.error('Email sign-in error', 'AUTH_CONTEXT', {
          error: error.message,
          email
        });
      } else {
        logger.info('Email sign-in successful', 'AUTH_CONTEXT', {
          userId: data.user?.id,
          email
        });
      }
      
      return { data, error };
    } catch (error) {
      logger.error('Exception in signInWithEmail', 'AUTH_CONTEXT', {
        error: error instanceof Error ? error.message : String(error)
      });
      return { data: null, error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      logger.info('Signing up with email', 'AUTH_CONTEXT', { email, displayName });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      });
      
      if (error) {
        logger.error('Email sign-up error', 'AUTH_CONTEXT', {
          error: error.message,
          email
        });
      } else {
        logger.info('Email sign-up successful', 'AUTH_CONTEXT', {
          userId: data.user?.id,
          email
        });
      }
      
      return { data, error };
    } catch (error) {
      logger.error('Exception in signUpWithEmail', 'AUTH_CONTEXT', {
        error: error instanceof Error ? error.message : String(error)
      });
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      logger.info('Signing out', 'AUTH_CONTEXT', { userId: user?.id });
      
      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        setUser(null);
        setUserProfile(null);
        setCreatorProfile(null);
        setSession(null);
        logger.info('Sign out successful', 'AUTH_CONTEXT');
      } else {
        logger.error('Sign out error', 'AUTH_CONTEXT', {
          error: error.message
        });
      }
      
      return { error };
    } catch (error) {
      logger.error('Exception in signOut', 'AUTH_CONTEXT', {
        error: error instanceof Error ? error.message : String(error)
      });
      return { error };
    }
  };

  const updateUserRole = async (role: 'user' | 'creator') => {
    if (!user) {
      logger.warn('Cannot update role: no user logged in', 'AUTH_CONTEXT');
      return { error: new Error('No user logged in') };
    }

    try {
      logger.info('Updating user role', 'AUTH_CONTEXT', { userId: user.id, role });
      
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', user.id);

      if (error) {
        logger.error('Error updating user role', 'AUTH_CONTEXT', {
          userId: user.id,
          role,
          error: error.message
        });
        return { error };
      }

      logger.info('User role updated successfully', 'AUTH_CONTEXT', {
        userId: user.id,
        role
      });

      // Reload user profile to get updated role
      await loadUserProfile(user.id);

      return { error: null };
    } catch (error) {
      logger.error('Exception in updateUserRole', 'AUTH_CONTEXT', {
        userId: user.id,
        error: error instanceof Error ? error.message : String(error)
      });
      return { error };
    }
  };

  const createCreatorProfile = async (bio: string, category: string) => {
    if (!user) {
      logger.warn('Cannot create creator profile: no user logged in', 'AUTH_CONTEXT');
      return { error: new Error('No user logged in') };
    }

    try {
      logger.info('Creating creator profile', 'AUTH_CONTEXT', {
        userId: user.id,
        bio,
        category
      });

      // First update user role to creator
      const { error: roleError } = await updateUserRole('creator');
      if (roleError) {
        logger.error('Failed to update role to creator', 'AUTH_CONTEXT', {
          userId: user.id,
          error: roleError
        });
        return { error: roleError };
      }

      // Create creator profile
      const { data, error } = await supabase
        .from('creator_profiles')
        .insert({
          user_id: user.id,
          bio,
          category
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating creator profile', 'AUTH_CONTEXT', {
          userId: user.id,
          error: error.message,
          errorCode: error.code
        });
        return { error };
      }

      logger.info('Creator profile created successfully', 'AUTH_CONTEXT', {
        userId: user.id,
        creatorProfileId: data.id
      });

      setCreatorProfile(data);

      // Reload user profile one more time to ensure everything is synced
      await loadUserProfile(user.id);

      return { error: null };
    } catch (error) {
      logger.error('Exception in createCreatorProfile', 'AUTH_CONTEXT', {
        userId: user.id,
        error: error instanceof Error ? error.message : String(error)
      });
      return { error };
    }
  };

  // Manually create user profile (fallback if trigger doesn't work)
  const createUserProfile = async (role: 'user' | 'creator' = 'user') => {
    if (!user) {
      logger.warn('Cannot create user profile: no user logged in', 'AUTH_CONTEXT');
      return { error: new Error('No user logged in') };
    }

    try {
      logger.info('Manually creating user profile', 'AUTH_CONTEXT', {
        userId: user.id,
        role
      });

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        logger.info('User profile already exists', 'AUTH_CONTEXT', {
          userId: user.id,
          existingRole: existingProfile.role
        });
        
        // If profile exists but role is different, update it
        if (existingProfile.role !== role) {
          logger.info('Updating existing profile role', 'AUTH_CONTEXT', {
            userId: user.id,
            oldRole: existingProfile.role,
            newRole: role
          });
          
          const { error } = await supabase
            .from('users')
            .update({ role })
            .eq('id', user.id);
          
          if (!error) {
            await loadUserProfile(user.id);
          }
          return { error };
        }
        return { error: null };
      }

      // Create new profile
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          photo_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          role: role
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating user profile', 'AUTH_CONTEXT', {
          userId: user.id,
          error: error.message,
          errorCode: error.code
        });
        return { error };
      }

      logger.info('User profile created successfully', 'AUTH_CONTEXT', {
        userId: user.id,
        profileId: data.id,
        role
      });

      setUserProfile(data);
      return { error: null };
    } catch (error) {
      logger.error('Exception in createUserProfile', 'AUTH_CONTEXT', {
        userId: user.id,
        error: error instanceof Error ? error.message : String(error)
      });
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    creatorProfile,
    session,
    isAuthenticated: !!user,
    isCreator: userProfile?.role === 'creator',
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateUserRole,
    createCreatorProfile,
    createUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
