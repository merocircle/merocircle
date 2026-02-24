import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare const process: { env: Record<string, string | undefined> } | undefined;
const env = typeof process !== 'undefined' ? process?.env : {};
// Expo/Metro inject EXPO_PUBLIC_* at build time; EAS Build uses project secrets.
const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const MISSING_SUPABASE_MSG =
  'Supabase config is missing. For local dev, add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env. ' +
  'For EAS/APK builds, set them in EAS project secrets or in the build profile env (see mobile/DISTRIBUTION.md).';

function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl?.trim() || !supabaseAnonKey?.trim()) {
    throw new Error(MISSING_SUPABASE_MSG);
  }
  return createClient(supabaseUrl.trim(), supabaseAnonKey.trim(), {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Supabase client with Auth enabled. Session is persisted in AsyncStorage.
 * Mobile uses Supabase Auth (e.g. Google via Supabase OAuth); web uses NextAuth.
 * Throws at import time if EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY are missing (e.g. APK built without env).
 */
export const supabase = createSupabaseClient();
