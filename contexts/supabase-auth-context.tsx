"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

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
  followers_count: number;
  posts_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  creatorProfile: CreatorProfile | null;
  isAuthenticated: boolean;
  isCreator: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  updateUserRole: (role: 'user' | 'creator') => Promise<{ error: any }>;
  createCreatorProfile: (bio: string, category: string) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const { data: newProfile, error: createError } = await supabase
              .from('users')
              .insert({
                id: authUser.id,
                email: authUser.email || '',
                display_name: authUser.user_metadata?.full_name || 
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

            if (createError?.code === '23505') {
              const { data: existingProfile } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
              if (existingProfile) {
                setUserProfile(existingProfile);
              }
              return;
            }
            
            if (newProfile) {
              setUserProfile(newProfile);
            }
          }
        }
        return;
      }

      setUserProfile(profile);

      if (profile?.role === 'creator') {
        const { data: creatorData, error: creatorError } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!creatorError && creatorData) {
          setCreatorProfile(creatorData);
        } else {
          setCreatorProfile(null);
        }
      } else {
        setCreatorProfile(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          await loadProfile(currentSession.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          setLoading(true);
          
          setTimeout(async () => {
            try {
              await loadProfile(newSession.user.id);
            } catch (error) {
              console.error('Error loading profile on sign in:', error);
            } finally {
              if (mounted) {
                setLoading(false);
              }
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setCreatorProfile(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      return { data, error };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUserProfile(null);
    setCreatorProfile(null);
  };

  const updateUserRole = async (role: 'user' | 'creator') => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', user.id);

    if (!error && userProfile) {
      setUserProfile({ ...userProfile, role });
    }

    return { error };
  };

  const createCreatorProfile = async (bio: string, category: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      await updateUserRole('creator');

      const { error: profileError } = await supabase
        .from('creator_profiles')
        .insert({
          user_id: user.id,
          bio,
          category,
        });

      if (profileError) {
        return { error: profileError };
      }

      await loadProfile(user.id);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const value = {
    user,
    session,
    userProfile,
    creatorProfile,
    isAuthenticated: !!user && !!userProfile,
    isCreator: userProfile?.role === 'creator' && !!creatorProfile,
    loading,
    signInWithGoogle,
    signOut,
    updateUserRole,
    createCreatorProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
