"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const error = params.get('error');
        
        if (error) {
          router.replace(`/auth?error=${encodeURIComponent(error)}`);
          return;
        }

        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            router.replace('/dashboard');
            return;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
        
        router.replace('/dashboard');
      } catch (error) {
        console.error('Callback error:', error);
        router.replace('/dashboard');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}
