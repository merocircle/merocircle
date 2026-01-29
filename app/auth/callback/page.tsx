"use client";

import { useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const MAX_SESSION_CHECK_ATTEMPTS = 10;
const SESSION_CHECK_INTERVAL_MS = 500;

/**
 * Gets and clears the stored redirect path from localStorage
 * @returns The redirect path if valid, null otherwise
 */
function getAndClearRedirectPath(): string | null {
  if (typeof window === 'undefined') return null;
  
  const storedRedirect = localStorage.getItem('postLoginRedirect');
  if (!storedRedirect) return null;
  
  // Validate and clean up
  const redirectPath = storedRedirect.startsWith('/') ? storedRedirect : null;
  localStorage.removeItem('postLoginRedirect');
  
  return redirectPath;
}

/**
 * Polls for session with exponential backoff
 */
async function waitForSession(maxAttempts: number): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        return true;
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
    
    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, SESSION_CHECK_INTERVAL_MS));
  }
  
  return false;
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processed = useRef(false);

  const handleRedirect = useCallback((redirectPath: string | null) => {
    router.replace(redirectPath || '/home', { scroll: false });
  }, [router]);

  useEffect(() => {
    // Prevent double processing
    if (processed.current) return;
    processed.current = true;

    const handleCallback = async () => {
      try {
        // Check for error parameter using Next.js hook
        const error = searchParams.get('error');
        
        if (error) {
          router.replace(`/auth?error=${encodeURIComponent(error)}`, { scroll: false });
          return;
        }

        // Get redirect path once
        const redirectPath = getAndClearRedirectPath();

        // Wait for session to be established
        const hasSession = await waitForSession(MAX_SESSION_CHECK_ATTEMPTS);
        
        // Redirect regardless of session status (session might be set via cookies)
        handleRedirect(redirectPath);
      } catch (error) {
        console.error('Callback error:', error);
        // On error, still try to redirect
        const redirectPath = getAndClearRedirectPath();
        handleRedirect(redirectPath);
      }
    };

    handleCallback();
  }, [searchParams, router, handleRedirect]);

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
