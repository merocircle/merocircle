"use client";

import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { useAuth as useAuthContext } from '@/contexts/auth-context';

/**
 * Combined hook for easy authentication access
 * Merges NextAuth session with custom auth context
 */
export function useAuthHelper() {
  const { data: session, status } = useSession();
  const authContext = useAuthContext();

  return {
    // Session data
    session,
    status,
    user: session?.user,
    
    // Auth context data
    ...authContext,
    
    // Helper methods
    signIn: (callbackUrl?: string) => nextAuthSignIn('google', { callbackUrl: callbackUrl || '/home' }),
    signOut: (callbackUrl?: string) => nextAuthSignOut({ callbackUrl: callbackUrl || '/' }),
    
    // Combined loading state
    loading: status === 'loading' || authContext.loading,
  };
}
