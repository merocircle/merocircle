"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  ArrowLeft, 
  Chrome, 
  User, 
  Check,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/supabase-auth-context';

export default function SupporterSignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'signup' | 'complete'>('signup');
  const router = useRouter();
  const { user, userProfile, signInWithGoogle } = useAuth();
  
  // Handle OAuth return - callback page will create profile, we just check if user is back
  useEffect(() => {
    if (user && userProfile) {
      // User is authenticated and has profile - redirect to dashboard
      setStep('complete');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } else if (user) {
      // User is authenticated but profile is still loading
      // Wait a bit for profile to be created
      const timeout = setTimeout(() => {
        if (userProfile) {
          setStep('complete');
          setTimeout(() => router.push('/dashboard'), 2000);
        }
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [user, userProfile, router]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mark this as supporter signup flow
      localStorage.setItem('isSupporterSignupFlow', 'true');
      
      const { data, error } = await signInWithGoogle();
      
      if (error) {
        setError(error.message || 'Failed to sign in with Google');
        localStorage.removeItem('isSupporterSignupFlow');
        return;
      }
      
      // After OAuth redirect, the useEffect will handle the rest
    } catch (error: any) {
      console.error('Supporter signup error:', error);
      setError(error.message || 'Failed to create account. Please try again.');
      localStorage.removeItem('isSupporterSignupFlow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-blue-950/20 dark:to-gray-950">
      {/* Header */}
      <header className="relative z-10 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/95">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-red-500" />
            <span className="text-xl font-bold">Creators Nepal</span>
          </Link>
          
          <Link href="/signup">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Signup
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl"
        >
          {step === 'signup' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-12">
                <Badge className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium rounded-full mb-4">
                  Supporter Signup
                </Badge>
                
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Support Amazing Creators
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                  Join Nepal's creative community and support your favorite creators
                </p>
              </div>

              <Card className="p-8 mb-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Supporter Account
                  </h2>
                  
                  <div className="space-y-3 text-left max-w-md mx-auto">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Support creators with donations
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Access exclusive content and perks
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Join creator communities
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Get supporter rewards and recognition
                    </div>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-6"
                  >
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                  </motion.div>
                )}

                <Button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium text-lg"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Creating account...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Chrome className="w-6 h-6 mr-3" />
                      Continue with Google
                      <ArrowRight className="w-5 h-5 ml-3" />
                    </div>
                  )}
                </Button>
              </Card>

              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Want to create content?{' '}
                  <Link href="/signup/creator" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">
                    Sign up as a Creator
                  </Link>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </motion.div>
          )}

          {step === 'complete' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <User className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Welcome to the Community! 🎉
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Your supporter account has been created successfully. Redirecting to your dashboard...
              </p>
              
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 