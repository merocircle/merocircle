"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/supabase-auth-context';

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');
  const router = useRouter();
  const { user, userProfile } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait a moment for auth state to settle
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!user) {
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        setStatus('success');
        setMessage('Authentication successful!');

        // Check if this is a signup flow
        const isSignupFlow = localStorage.getItem('isSignupFlow');
        const signupRole = localStorage.getItem('signupRole');

        if (isSignupFlow === 'true' && signupRole) {
          // Signup flow - redirect back to signup page to complete
          setTimeout(() => router.push('/signup'), 2000);
        } else {
          // Regular login flow - redirect to dashboard
          setTimeout(() => {
            if (userProfile?.role === 'creator') {
              router.push('/dashboard/creator');
            } else {
              router.push('/dashboard/supporter');
            }
          }, 2000);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleCallback();
  }, [user, userProfile, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="flex items-center justify-center mb-6">
          <Heart className="h-12 w-12 text-red-500 mr-3" />
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">Creators Nepal</span>
        </div>

        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          {status === 'loading' && (
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
          )}
          {status === 'success' && (
            <Check className="w-10 h-10 text-green-600" />
          )}
          {status === 'error' && (
            <AlertCircle className="w-10 h-10 text-red-600" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {status === 'loading' && 'Authenticating...'}
          {status === 'success' && 'Welcome!'}
          {status === 'error' && 'Authentication Failed'}
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-8">
          {message}
        </p>

        {status === 'success' && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting you to your dashboard...
          </p>
        )}

        {status === 'error' && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting you back to login...
          </p>
        )}
      </motion.div>
    </div>
  );
} 