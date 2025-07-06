"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
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
  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Loading user profile for:', userId);
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If the error is "PGRST116" (no rows found), it means the user profile doesn't exist yet
        if (error.code === 'PGRST116') {
          console.log('No user profile found - this is normal for new users');
          setUserProfile(null);
          setCreatorProfile(null);
          return;
        }
        
        // For other errors, log them
        console.error('Error loading user profile:', error);
        return;
      }

      console.log('Loaded user profile:', profile);
      setUserProfile(profile);

      // If user is a creator, load creator profile
      if (profile.role === 'creator') {
        console.log('User is creator, loading creator profile...');
        const { data: creatorData, error: creatorError } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!creatorError && creatorData) {
          console.log('Loaded creator profile:', creatorData);
          setCreatorProfile(creatorData);
        } else if (creatorError?.code === 'PGRST116') {
          console.log('No creator profile found yet (expected if just upgraded to creator)');
          setCreatorProfile(null);
        } else {
          console.log('Error loading creator profile:', creatorError);
          setCreatorProfile(null);
        }
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    }
  };

  useEffect(() => {
    if (initialized) return;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          // If there's an error getting the session, clear any stored tokens
          if (error.message.includes('refresh_token_not_found') || error.message.includes('Invalid Refresh Token')) {
            console.log('Clearing invalid session...');
            await supabase.auth.signOut();
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
        
        setLoading(false);
        setInitialized(true);
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setLoading(false);
        setInitialized(true);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        // Handle specific auth events
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setUserProfile(null);
          setCreatorProfile(null);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setUserProfile(null);
          setCreatorProfile(null);
        }
        
        if (initialized) {
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initialized]);

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      return { data, error };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return { data: null, error };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      return { data, error };
    } catch (error) {
      console.error('Error signing in with email:', error);
      return { data: null, error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      });
      
      return { data, error };
    } catch (error) {
      console.error('Error signing up:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        setUser(null);
        setUserProfile(null);
        setCreatorProfile(null);
        setSession(null);
      }
      
      return { error };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error };
    }
  };

  const updateUserRole = async (role: 'user' | 'creator') => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      console.log('Updating user role to:', role, 'for user:', user.id);
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user role:', error);
        return { error };
      }

      console.log('User role updated successfully, reloading profile...');
      // Reload user profile to get updated role
      await loadUserProfile(user.id);
      console.log('Profile reloaded after role update');

      return { error: null };
    } catch (error) {
      console.error('Error updating user role:', error);
      return { error };
    }
  };

  const createCreatorProfile = async (bio: string, category: string) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      console.log('Creating creator profile for user:', user.id);
      
      // First update user role to creator
      const { error: roleError } = await updateUserRole('creator');
      if (roleError) {
        console.error('Failed to update role to creator:', roleError);
        return { error: roleError };
      }

      console.log('Role updated to creator, now creating creator profile...');
      
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
        console.error('Error creating creator profile:', error);
        return { error };
      }

      console.log('Creator profile created successfully:', data);
      setCreatorProfile(data);

      // Reload user profile one more time to ensure everything is synced
      await loadUserProfile(user.id);

      return { error: null };
    } catch (error) {
      console.error('Error creating creator profile:', error);
      return { error };
    }
  };

  // Manually create user profile (fallback if trigger doesn't work)
  const createUserProfile = async (role: 'user' | 'creator' = 'user') => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      console.log('Manually creating user profile for:', user.id, 'with role:', role);
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        console.log('User profile already exists:', existingProfile);
        // If profile exists but role is different, update it
        if (existingProfile.role !== role) {
          console.log('Updating existing profile role to:', role);
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
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
          photo_url: user.user_metadata?.avatar_url || null,
          role: role
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        return { error };
      }

      console.log('User profile created successfully:', data);
      setUserProfile(data);
      return { error: null };
    } catch (error) {
      console.error('Error in createUserProfile:', error);
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