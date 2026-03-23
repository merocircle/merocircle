"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { logger } from '@/lib/logger';

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
  vanity_username: string | null;
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
  createCreatorProfile: (bio: string, category: string, socialLinks?: Record<string, string>, vanityUsername?: string, displayName?: string) => Promise<{ error: any }>;
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

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/me');
      if (!res.ok) {
        logger.error('Error loading profile', 'AUTH_CONTEXT', { status: res.status });
        return;
      }
      const { userProfile: profile, creatorProfile: creator } = await res.json();
      if (profile) {
        setUserProfile(profile);
        setCreatorProfile(creator ?? null);
      }
    } catch (error) {
      logger.error('Error in loadProfile', 'AUTH_CONTEXT', { error: error instanceof Error ? error.message : String(error) });
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
      loadProfile();
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
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        return { error: d.error || 'Failed to update role' };
      }

      await loadProfile();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const createCreatorProfile = async (
    bio: string,
    category: string,
    socialLinks?: Record<string, string>,
    vanityUsername?: string,
    displayName?: string
  ) => {
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    try {
      const { error: roleError } = await updateUserRole('creator');
      if (roleError) {
        return { error: roleError };
      }

      // Update display name if provided
      if (displayName) {
        const res = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ display_name: displayName.trim() }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          return { error: d.error || 'Failed to update display name' };
        }
      }

      const res = await fetch('/api/creator/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio,
          category,
          social_links: socialLinks || {},
          vanity_username: vanityUsername?.trim().toLowerCase() || undefined,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        return { error: d.error || 'Failed to create creator profile' };
      }

      const data = await res.json();
      if (data.creatorProfile) {
        setCreatorProfile(data.creatorProfile);
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const refreshProfile = async () => {
    await loadProfile();
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
      logger.error('Sign out error', 'AUTH_CONTEXT', { error: error instanceof Error ? error.message : String(error) });
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
