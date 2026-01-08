"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Heart, ArrowLeft, Chrome, Shield, Zap, Users, Crown, Sparkles, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/supabase-auth-context';

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreatorPrompt, setShowCreatorPrompt] = useState(false);
  const [showCreatorForm, setShowCreatorForm] = useState(false);
  const [creatorData, setCreatorData] = useState({ bio: '', category: '' });
  const [isSubmittingCreator, setIsSubmittingCreator] = useState(false);
  const router = useRouter();
  const { user, userProfile, creatorProfile, signInWithGoogle, createCreatorProfile, loading: authLoading } = useAuth();

  // Check for error in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      setError(errorParam);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && userProfile && !authLoading) {
      // If they have a creator profile, go to dashboard
      if (creatorProfile) {
        router.push('/dashboard');
        return;
      }
      // If they're logged in but don't have creator profile, show prompt
      // Only show once - check if we've already shown it
      const hasShownPrompt = sessionStorage.getItem('creatorPromptShown');
      if (!hasShownPrompt) {
        setShowCreatorPrompt(true);
        sessionStorage.setItem('creatorPromptShown', 'true');
      } else {
        // They've seen the prompt, just go to dashboard
        router.push('/dashboard');
      }
    }
  }, [user, userProfile, creatorProfile, authLoading, router]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await signInWithGoogle();
      
      if (error) {
        setError(error.message || 'Failed to sign in');
        return;
      }
      
      // Will be redirected by the useEffect watching user state
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBecomeCreator = () => {
    setShowCreatorPrompt(false);
    setShowCreatorForm(true);
  };

  const handleSkipCreator = () => {
    setShowCreatorPrompt(false);
    sessionStorage.setItem('creatorPromptShown', 'true');
    router.push('/dashboard');
  };

  const handleCreatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorData.bio || !creatorData.category) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmittingCreator(true);
    setError(null);

    try {
      const { error: createError } = await createCreatorProfile(creatorData.bio, creatorData.category);
      
      if (createError) {
        setError(createError.message || 'Failed to create creator profile');
        return;
      }

      setShowCreatorForm(false);
      router.push('/dashboard/creator');
    } catch (error: any) {
      console.error('Creator setup error:', error);
      setError(error.message || 'Failed to set up creator profile. Please try again.');
    } finally {
      setIsSubmittingCreator(false);
    }
  };

  const features = [
    {
      icon: Shield,
      title: "Secure Authentication",
      description: "Protected by Google's advanced security"
    },
    {
      icon: Zap,
      title: "Quick Setup",
      description: "Get started in seconds with one click"
    },
    {
      icon: Users,
      title: "Join Community",
      description: "Connect with thousands of Nepal creators"
    }
  ];

  const categories = [
    'Art', 'Music', 'Photography', 'Writing', 'Cooking', 'Tech',
    'Fashion', 'Travel', 'Gaming', 'Education', 'Fitness', 'Crafts'
  ];

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="relative z-10 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/95">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-red-500" />
            <span className="text-xl font-bold">Creators Nepal</span>
          </Link>
          
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Left Side - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Badge className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-full mb-4">
                  Welcome to Creators Nepal
                </Badge>
              </motion.div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Get Started
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Sign in or create your account to join Nepal's creative community
              </p>
            </div>

            <Card className="p-8 border-0 shadow-xl bg-white dark:bg-gray-800">
              <div className="space-y-6">
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
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full h-12 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 font-medium"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Chrome className="w-5 h-5 mr-3 text-blue-600" />
                      Continue with Google
                    </div>
                  )}
                </Button>

                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  By continuing, you agree to our{' '}
                  <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link>
                </div>
              </div>
            </Card>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                All users start as supporters. You can become a creator anytime from your dashboard.
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Support creators</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Access exclusive content</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Join communities</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Features */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          
          <div className="relative z-10 flex flex-col justify-center p-12 text-white">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold mb-6">
                Join Nepal's Growing
                <br />
                Creator Economy
              </h2>
              <p className="text-xl text-blue-100 mb-12 leading-relaxed">
                Connect with supporters, build your community, and monetize your creativity with our Nepal-focused platform.
              </p>
            </motion.div>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                  className="flex items-start space-x-4"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                    <p className="text-blue-100">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Background decorations */}
          <div className="absolute top-20 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Creator Prompt Dialog */}
      <Dialog open={showCreatorPrompt} onOpenChange={setShowCreatorPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl text-center">Become a Creator?</DialogTitle>
            <DialogDescription className="text-center">
              You're currently a supporter. Would you like to become a creator and start sharing your work?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Build your creator profile</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Receive support from fans</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Monetize your content</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Track earnings in NPR</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleSkipCreator}
                className="flex-1"
              >
                Maybe Later
              </Button>
              <Button
                onClick={handleBecomeCreator}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                <Crown className="w-4 h-4 mr-2" />
                Become Creator
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Creator Registration Form Dialog */}
      <Dialog open={showCreatorForm} onOpenChange={setShowCreatorForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Set Up Your Creator Profile</DialogTitle>
            <DialogDescription>
              Tell us about yourself and your creative work
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreatorSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="bio">Bio *</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself and your creative work..."
                value={creatorData.bio}
                onChange={(e) => setCreatorData({ ...creatorData, bio: e.target.value })}
                rows={4}
                required
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={creatorData.category}
                onChange={(e) => setCreatorData({ ...creatorData, category: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreatorForm(false);
                  router.push('/dashboard');
                }}
                className="flex-1"
              >
                Skip for Now
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingCreator || !creatorData.bio || !creatorData.category}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {isSubmittingCreator ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Profile
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
