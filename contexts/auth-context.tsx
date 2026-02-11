"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  photo_url: string | null;
  role: 'user' | 'creator';
  username: string | null;
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
  followers_count: number;
  posts_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  userProfile: UserProfile | null;
  user: UserProfile | null; // Alias for userProfile (backward compatibility)
  creatorProfile: CreatorProfile | null;
  isAuthenticated: boolean;
  isCreator: boolean;
  loading: boolean;
  updateUserRole: (role: 'user' | 'creator') => Promise<{ error: any }>;
  createCreatorProfile: (bio: string, category: string, socialLinks?: Record<string, string>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle?: () => void; // Optional for compatibility
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        return;
      }

      if (profile) {
        setUserProfile(profile);

        // Load creator profile if user is a creator
        if (profile.role === 'creator') {
          const { data: creator, error: creatorError } = await supabase
            .from('creator_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (!creatorError && creator) {
            setCreatorProfile(creator);
          }
        }
      }
    } catch (error) {
      console.error('Error in loadProfile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (status === 'authenticated' && session?.user?.id) {
      loadProfile(session.user.id);
    } else {
      setUserProfile(null);
      setCreatorProfile(null);
      setLoading(false);
    }
  }, [session, status, loadProfile]);

  const updateUserRole = async (role: 'user' | 'creator') => {
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', session.user.id);

      if (error) {
        return { error };
      }

      await loadProfile(session.user.id);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const createCreatorProfile = async (
    bio: string,
    category: string,
    socialLinks?: Record<string, string>
  ) => {
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    try {
      const { error: roleError } = await updateUserRole('creator');
      if (roleError) {
        return { error: roleError };
      }

      const { data, error: createError } = await supabase
        .from('creator_profiles')
        .insert({
          user_id: session.user.id,
          bio,
          category,
          social_links: socialLinks || {},
        })
        .select()
        .single();

      if (createError) {
        return { error: createError };
      }

      if (data) {
        setCreatorProfile(data);
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const refreshProfile = async () => {
    if (session?.user?.id) {
      await loadProfile(session.user.id);
    }
  };

  const signOut = async () => {
    try {
      // Clear local state first
      setUserProfile(null);
      setCreatorProfile(null);
      setLoading(true);
      
      // Sign out from NextAuth with redirect
      await nextAuthSignOut({ 
        callbackUrl: '/',
        redirect: true 
      });
    } catch (error) {
      console.error('Sign out error:', error);
      // Fallback: force redirect
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    userProfile,
    user: userProfile, // Alias for backward compatibility
    creatorProfile,
    isAuthenticated: status === 'authenticated' && !!userProfile,
    isCreator: userProfile?.role === 'creator',
    loading: loading || status === 'loading',
    updateUserRole,
    createCreatorProfile,
    refreshProfile,
    signOut,
    signInWithGoogle: undefined, // Not needed with NextAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
}
