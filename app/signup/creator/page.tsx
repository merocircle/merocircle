"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Heart, 
  ArrowLeft, 
  Chrome, 
  Sparkles, 
  Check,
  ArrowRight,
  Crown,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/supabase-auth-context';
import { supabase } from '@/lib/supabase';

const CREATOR_CATEGORIES = [
  'Technology', 'Education', 'Entertainment', 'Music', 'Art & Design',
  'Gaming', 'Photography', 'Writing', 'Business', 'Health & Fitness',
  'Lifestyle', 'Travel', 'Food & Cooking', 'Fashion & Beauty', 'Comedy',
  'Science', 'Sports', 'Politics & News', 'Religion & Spirituality', 'Other'
];

export default function CreatorSignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'signup' | 'creator-details' | 'complete'>('signup');
  const [creatorData, setCreatorData] = useState({
    bio: '',
    category: ''
  });
  const router = useRouter();
  const { user, userProfile, signInWithGoogle, createCreatorProfile } = useAuth();
  
  // Handle OAuth return - callback page will create profile, we just check if user is back
  useEffect(() => {
    if (user && userProfile) {
      // User is authenticated and has profile - check if they need to complete creator setup
      if (userProfile.role === 'creator') {
        // Check if creator profile exists
        const checkCreatorProfile = async () => {
          const { data } = await supabase
            .from('creator_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (!data) {
            // Creator profile doesn't exist, show setup form
            setStep('creator-details');
          } else {
            // Creator profile exists, redirect to creator dashboard
            router.push('/dashboard/creator');
          }
        };
        
        checkCreatorProfile();
      } else {
        // User is not a creator yet, redirect to dashboard
        router.push('/dashboard');
      }
    }
  }, [user, userProfile, router]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mark this as creator signup flow
      localStorage.setItem('isCreatorSignupFlow', 'true');
      
      const { data, error } = await signInWithGoogle();
      
      if (error) {
        setError(error.message || 'Failed to sign in with Google');
        localStorage.removeItem('isCreatorSignupFlow');
        return;
      }
      
      // After OAuth redirect, the useEffect will handle the rest
    } catch (error: any) {
      console.error('Creator signup error:', error);
      setError(error.message || 'Failed to create account. Please try again.');
      localStorage.removeItem('isCreatorSignupFlow');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatorSetup = async () => {
    if (!user || !creatorData.category) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('Creating creator profile for user:', user.id);
      
      // Create creator profile
      const { error } = await createCreatorProfile(creatorData.bio, creatorData.category);
      
      if (error) {
        console.error('Creator profile creation failed:', error);
        setError(error.message || 'Failed to set up creator profile');
        return;
      }
      
      console.log('Creator profile created successfully');
      setStep('complete');
      
      // Redirect to creator dashboard
      setTimeout(() => {
        router.push('/dashboard/creator');
      }, 2000);
    } catch (error: any) {
      console.error('Creator setup error:', error);
      setError(error.message || 'Failed to set up creator profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950">
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
                <Badge className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-full mb-4">
                  Creator Signup
                </Badge>
                
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Share Your Creativity
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                  Build your community and monetize your passion
                </p>
              </div>

              <Card className="p-8 mb-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Creator Account
                  </h2>
                  
                  <div className="space-y-3 text-left max-w-md mx-auto">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Build your creator profile
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Receive support from fans
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Monetize your content
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Track earnings in NPR
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
                  className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium text-lg"
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
                  Want to support creators?{' '}
                  <Link href="/signup/supporter" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Sign up as a Supporter
                  </Link>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Already have an account?{' '}
                  <Link href="/login" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </motion.div>
          )}

          {step === 'creator-details' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <Badge className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-full mb-4">
                  Step 2 of 2
                </Badge>
                
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Complete Your Creator Profile
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Tell your future supporters about yourself and what you create
                </p>
              </div>

              <Card className="p-8">
                {/* User Profile Preview */}
                {user && (
                  <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl mb-8 border border-purple-100 dark:border-purple-800">
                    <div className="relative">
                      {user.user_metadata?.avatar_url ? (
                        <img
                          src={user.user_metadata.avatar_url}
                          alt="Profile"
                          className="w-16 h-16 rounded-full object-cover ring-4 ring-white dark:ring-gray-800 shadow-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-lg">
                          <User className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {user.user_metadata?.display_name || user.email?.split('@')[0] || 'Creator'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {user.email}
                      </p>
                      <Badge className="mt-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                        <Crown className="w-3 h-3 mr-1" />
                        Creator Account
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="category" className="text-sm font-medium">
                      Category *
                    </Label>
                    <select
                      id="category"
                      value={creatorData.category}
                      onChange={(e) => setCreatorData({ ...creatorData, category: e.target.value })}
                      className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:outline-none cursor-pointer"
                      required
                    >
                      <option value="">Select your content category</option>
                      {CREATOR_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="bio" className="text-sm font-medium">
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      value={creatorData.bio}
                      onChange={(e) => setCreatorData({ ...creatorData, bio: e.target.value })}
                      placeholder="Tell your supporters about yourself and what you create..."
                      className="mt-2 min-h-[120px] resize-none border-gray-300 dark:border-gray-600 focus:border-purple-500"
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {creatorData.bio.length}/500 characters (optional)
                    </p>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                    >
                      <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                    </motion.div>
                  )}

                  <Button
                    onClick={handleCreatorSetup}
                    disabled={!creatorData.category || loading}
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Setting up profile...
                      </div>
                    ) : (
                      'Complete Setup'
                    )}
                  </Button>
                </div>
              </Card>
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
                className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Welcome to Creators Nepal! 🎉
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Your creator profile has been set up successfully. Redirecting to your dashboard...
              </p>
              
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 