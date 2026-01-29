"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/supabase-auth-context';
import { Header } from '@/components/header';
import {
  AuthHero,
  AuthCard,
  AuthFeatures,
  AuthFooter,
} from '@/components/auth';

function AuthPageContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, signInWithGoogle, loading: authLoading } = useAuth();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(errorParam);
      router.replace('/auth', { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (user && userProfile && !authLoading) {
      router.replace('/home');
    }
  }, [user, userProfile, authLoading, router]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await signInWithGoogle();

      if (error) {
        setError(error.message || 'Failed to sign in');
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [signInWithGoogle]);

  // Early return for loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AuthHero />

            <AuthCard 
              loading={loading}
              error={error}
              onSignIn={handleGoogleSignIn}
            />

            <AuthFeatures />

            {/* Bottom text */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              All users start as supporters. Become a creator anytime from your dashboard.
            </p>
          </motion.div>
        </div>
      </main>

      <AuthFooter />
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}
