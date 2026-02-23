import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

// Add mobile://auth/callback to: Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
const REDIRECT_URI =
  Platform.OS === 'web' ? 'http://localhost:3000/auth/callback' : 'mobile://auth/callback';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  photo_url: string | null;
  role: 'user' | 'creator';
  created_at: string;
  updated_at: string;
}

export interface CreatorProfile {
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

type AuthContextType = {
  user: { id: string; email?: string } | null;
  session: Session | null;
  userProfile: UserProfile | null;
  creatorProfile: CreatorProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Extract access_token and refresh_token from Supabase's hash-fragment redirect URL. */
function parseTokensFromUrl(url: string): { access_token?: string; refresh_token?: string } {
  const hash = url.split('#')[1] ?? '';
  const params: Record<string, string> = {};
  hash.split('&').forEach((p) => {
    const eq = p.indexOf('=');
    if (eq > 0) params[decodeURIComponent(p.slice(0, eq))] = decodeURIComponent(p.slice(eq + 1));
  });
  return { access_token: params.access_token, refresh_token: params.refresh_token };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Row not yet created — insert from Supabase auth metadata
        if (error.code === 'PGRST116') {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const { data: newProfile } = await supabase
              .from('users')
              .insert({
                id: authUser.id,
                email: authUser.email ?? '',
                display_name:
                  authUser.user_metadata?.full_name ??
                  authUser.user_metadata?.name ??
                  authUser.email?.split('@')[0] ??
                  'User',
                photo_url:
                  authUser.user_metadata?.avatar_url ??
                  authUser.user_metadata?.picture ??
                  null,
                role: 'user',
              })
              .select()
              .single();
            if (newProfile) setUserProfile(newProfile);
          }
        }
        return;
      }
      setUserProfile(profile);
      if (profile?.role === 'creator') {
        const { data: creatorData } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        setCreatorProfile(creatorData ?? null);
      } else {
        setCreatorProfile(null);
      }
    } catch (e) {
      console.error('[auth] loadProfile', e);
    }
  };

  // Auth state listener — covers initial session (from AsyncStorage), sign-in, sign-out, token refresh
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      if (event === 'INITIAL_SESSION') {
        if (newSession?.user) await loadProfile(newSession.user.id);
        setLoading(false);
      } else if (event === 'SIGNED_IN' && newSession?.user) {
        await loadProfile(newSession.user.id);
        router.replace('/(tabs)');
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        setCreatorProfile(null);
        router.replace('/');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Cold-start deep link: app opened from mobile://auth/callback#access_token=...
  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url?.includes('auth/callback')) return;
      const { access_token, refresh_token } = parseTokensFromUrl(url);
      if (access_token) {
        await supabase.auth.setSession({ access_token, refresh_token: refresh_token ?? '' });
      }
    };
    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: REDIRECT_URI, skipBrowserRedirect: true },
      });
      if (error) return { error: new Error(error.message) };
      if (!data?.url) return { error: new Error('No auth URL returned') };

      const res = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URI);
      if (res.type === 'success' && res.url) {
        const { access_token, refresh_token } = parseTokensFromUrl(res.url);
        if (!access_token) return { error: new Error('No access token in redirect') };
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token ?? '',
        });
        return { error: sessionError ? new Error(sessionError.message) : null };
      }
      if (res.type === 'cancel') return { error: null };
      return { error: new Error('Sign in was cancelled') };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('Sign in failed') };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // State cleanup happens in the SIGNED_OUT handler above
  };

  const refreshProfile = async () => {
    if (session?.user?.id) await loadProfile(session.user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user
          ? { id: session.user.id, email: session.user.email ?? undefined }
          : null,
        session,
        userProfile,
        creatorProfile,
        loading,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
