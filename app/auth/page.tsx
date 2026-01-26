"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Loader2, AlertCircle, Sparkles, Users, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/supabase-auth-context';

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, userProfile, signInWithGoogle, loading: authLoading } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      setError(errorParam);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (user && userProfile && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, userProfile, authLoading, router]);

  const handleGoogleSignIn = async () => {
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
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-pink-500/5 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-pink-500">
              <Heart className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="text-lg font-bold text-foreground">MeroCircle</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-pink-500 mb-4 shadow-lg shadow-primary/25"
              >
                <Heart className="h-8 w-8 text-white fill-white" />
              </motion.div>

              <h1 className="text-2xl font-bold text-foreground mb-2">
                Welcome to MeroCircle
              </h1>
              <p className="text-muted-foreground">
                Nepal's creator community platform
              </p>
            </div>

            {/* Auth Card */}
            <Card className="border-border bg-card shadow-xl">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <Button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    size="lg"
                    className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-medium"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        <span>Continue with Google</span>
                      </div>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground pt-2">
                    By continuing, you agree to our{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-8 grid grid-cols-3 gap-4"
            >
              <div className="text-center">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="text-xs text-muted-foreground">Support Creators</p>
              </div>
              <div className="text-center">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                  <Users className="h-5 w-5" />
                </div>
                <p className="text-xs text-muted-foreground">Join Community</p>
              </div>
              <div className="text-center">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <p className="text-xs text-muted-foreground">Exclusive Content</p>
              </div>
            </motion.div>

            {/* Bottom text */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              All users start as supporters. Become a creator anytime from your dashboard.
            </p>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-card/50 py-4">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MeroCircle. Made with <Heart className="inline h-3 w-3 text-red-500 fill-red-500" /> in Nepal</p>
        </div>
      </footer>
    </div>
  );
}
