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
  User,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/supabase-auth-context';

const CREATOR_CATEGORIES = [
  'Technology', 'Education', 'Entertainment', 'Music', 'Art & Design',
  'Gaming', 'Photography', 'Writing', 'Business', 'Health & Fitness',
  'Lifestyle', 'Travel', 'Food & Cooking', 'Fashion & Beauty', 'Comedy',
  'Science', 'Sports', 'Politics & News', 'Religion & Spirituality', 'Other'
];

type UserRole = 'creator' | 'supporter';
type SignupStep = 'role-selection' | 'creator-details' | 'auth-processing' | 'complete';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<SignupStep>('role-selection');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [creatorData, setCreatorData] = useState({
    bio: '',
    category: ''
  });
  
  const router = useRouter();
  const { user, signInWithGoogle, createUserProfile, createCreatorProfile } = useAuth();
  const hasProcessedOAuthRef = useRef(false);

  // Handle OAuth return and complete signup
  useEffect(() => {
    const handleOAuthReturn = async () => {
      if (user && !hasProcessedOAuthRef.current) {
        const signupRole = localStorage.getItem('signupRole') as UserRole;
        const isSignupFlow = localStorage.getItem('isSignupFlow');
        
        if (isSignupFlow === 'true' && signupRole) {
          console.log('Processing OAuth return for role:', signupRole);
          hasProcessedOAuthRef.current = true;
          
          try {
            // Create user profile with selected role (map 'supporter' to 'user')
            const dbRole = signupRole === 'supporter' ? 'user' : 'creator';
            const { error: profileError } = await createUserProfile(dbRole);
            
            if (profileError) {
              console.error('Failed to create user profile:', profileError);
              setError('Failed to create your profile. Please try again.');
              hasProcessedOAuthRef.current = false;
              return;
            }
            
            console.log('User profile created successfully');
            
            // If creator, show creator details form to complete setup
            if (signupRole === 'creator') {
              setSelectedRole('creator');
              setStep('creator-details');
            } else {
              // If supporter, complete signup
              localStorage.removeItem('signupRole');
              localStorage.removeItem('isSignupFlow');
              setStep('complete');
              
              setTimeout(() => {
                router.push('/dashboard/supporter');
              }, 2000);
            }
          } catch (error: any) {
            console.error('Signup completion error:', error);
            setError(error.message || 'Failed to complete signup. Please try again.');
            hasProcessedOAuthRef.current = false;
          }
        } else if (!hasProcessedOAuthRef.current) {
          // User is already logged in, redirect to dashboard
          router.push('/dashboard');
        }
      }
    };

    handleOAuthReturn();
  }, [user, router, createUserProfile]);

  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'supporter') {
      // Supporters can sign up immediately
      handleGoogleSignIn(role);
    } else {
      // Creators need to fill additional details first
      setStep('creator-details');
    }
  };

  const handleGoogleSignIn = async (role: UserRole) => {
    try {
      setLoading(true);
      setError(null);
      setStep('auth-processing');
      
      // Store signup context
      localStorage.setItem('isSignupFlow', 'true');
      localStorage.setItem('signupRole', role);
      
      console.log('Starting Google OAuth for role:', role);
      
      const { data, error } = await signInWithGoogle();
      
      console.log('OAuth response:', { data, error });
      
      if (error) {
        console.error('OAuth error:', error);
        setError(error.message || 'Failed to sign in with Google');
        localStorage.removeItem('isSignupFlow');
        localStorage.removeItem('signupRole');
        setStep('role-selection');
        setLoading(false);
        return;
      }
      
      // If we get here without an error, OAuth should have redirected
      // If we're still here, something went wrong
      console.log('OAuth initiated, should redirect to Google...');
      
      // Don't set loading to false here - let the redirect happen
      // setLoading(false) will be called if there's an error
      
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to create account. Please try again.');
      localStorage.removeItem('isSignupFlow');
      localStorage.removeItem('signupRole');
      setStep('role-selection');
      setLoading(false);
    }
  };

  const handleCreatorSignup = async () => {
    if (!creatorData.category) {
      setError('Please select a category');
      return;
    }

    // Start Google OAuth for creator
    await handleGoogleSignIn('creator');
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
      
      // Clean up and complete
      localStorage.removeItem('signupRole');
      localStorage.removeItem('isSignupFlow');
      setStep('complete');
      
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
          
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Already have an account? Sign in
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-4xl"
        >
          {/* Role Selection Step */}
          {step === 'role-selection' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-12">
                <Badge className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-full mb-4">
                  Join Creators Nepal
                </Badge>
                
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Choose Your Journey
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                  Are you here to create content or support amazing creators?
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-6 max-w-md mx-auto"
                >
                  <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                </motion.div>
              )}

              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Creator Option */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className="p-8 cursor-pointer border-2 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300"
                    onClick={() => handleRoleSelection('creator')}
                  >
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <Crown className="w-10 h-10 text-white" />
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                        I'm a Creator
                      </h3>
                      
                      <div className="space-y-3 text-left mb-8">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          Share your creative content
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          Receive support from fans
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          Monetize your passion
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          Build your community
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        disabled={loading}
                      >
                        Continue as Creator
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>

                {/* Supporter Option */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className="p-8 cursor-pointer border-2 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300"
                    onClick={() => handleRoleSelection('supporter')}
                  >
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                        <User className="w-10 h-10 text-white" />
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                        I'm a Supporter
                      </h3>
                      
                      <div className="space-y-3 text-left mb-8">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          Support amazing creators
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          Access exclusive content
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          Join creator communities
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          Get supporter rewards
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                        disabled={loading}
                      >
                        {loading && selectedRole === 'supporter' ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating account...
                          </div>
                        ) : (
                          <>
                            Continue as Supporter
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Creator Details Step */}
          {step === 'creator-details' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <Badge className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-full mb-4">
                  Creator Setup
                </Badge>
                
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Tell us about yourself
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Help supporters discover what you create
                </p>
              </div>

              <Card className="p-8 max-w-2xl mx-auto">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-6"
                  >
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                  </motion.div>
                )}

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="category" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      What type of content do you create? *
                    </Label>
                    <select
                      id="category"
                      value={creatorData.category}
                      onChange={(e) => setCreatorData({ ...creatorData, category: e.target.value })}
                      className="mt-2 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="">Select a category</option>
                      {CREATOR_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="bio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tell supporters about yourself (optional)
                    </Label>
                    <Textarea
                      id="bio"
                      placeholder="I'm a passionate creator who loves to..."
                      value={creatorData.bio}
                      onChange={(e) => setCreatorData({ ...creatorData, bio: e.target.value })}
                      className="mt-2 min-h-[100px]"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setStep('role-selection')}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  
                  <Button
                    onClick={user ? handleCreatorSetup : handleCreatorSignup}
                    disabled={loading || !creatorData.category}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {user ? 'Setting up profile...' : 'Creating account...'}
                      </div>
                    ) : (
                      <>
                        <Chrome className="w-4 h-4 mr-2" />
                        {user ? 'Complete Setup' : 'Continue with Google'}
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Auth Processing Step */}
          {step === 'auth-processing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Creating your account...
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Please wait while we set up your {selectedRole} account
              </p>
            </motion.div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Welcome to Creators Nepal!
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Your {selectedRole} account has been created successfully
              </p>
              
              <p className="text-gray-500 dark:text-gray-400">
                Redirecting to your dashboard...
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 