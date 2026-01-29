"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Plus,
  X,
  Calculator,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/supabase-auth-context';
import { supabase } from '@/lib/supabase';

const CREATOR_CATEGORIES = [
  'Technology', 'Education', 'Entertainment', 'Music', 'Art & Design',
  'Gaming', 'Photography', 'Writing', 'Business', 'Health & Fitness',
  'Lifestyle', 'Travel', 'Food & Cooking', 'Fashion & Beauty', 'Comedy',
  'Science', 'Sports', 'Politics & News', 'Religion & Spirituality', 'Other'
];

const SOCIAL_PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: '📘' },
  { id: 'youtube', name: 'YouTube', icon: '📺' },
  { id: 'instagram', name: 'Instagram', icon: '📷' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'twitter', name: 'Twitter (X)', icon: '🐦' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'website', name: 'Personal Website', icon: '🌐' },
  { id: 'other', name: 'Other', icon: '🔗' }
];

export default function CreatorSignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'signup' | 'creator-details' | 'tier-pricing' | 'complete'>('signup');
  const [creatorData, setCreatorData] = useState({
    bio: '',
    category: '',
    socialLinks: {} as Record<string, string>
  });
  const [tierPrices, setTierPrices] = useState({
    tier1: '100',
    tier2: '500',
    tier3: '1000'
  });
  const [tierExtraPerks, setTierExtraPerks] = useState<Record<number, string[]>>({
    1: [],
    2: [],
    3: []
  });
  const [estimatedSupporters, setEstimatedSupporters] = useState({
    tier1: '50',
    tier2: '20',
    tier3: '10'
  });
  const [socialLinkErrors, setSocialLinkErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const { user, userProfile, signInWithGoogle, createCreatorProfile } = useAuth();

  // Validate URL format
  const validateUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return true; // Empty is valid (optional field)
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSocialLinkChange = (platformId: string, value: string) => {
    // Update the value
    setCreatorData({
      ...creatorData,
      socialLinks: {
        ...creatorData.socialLinks,
        [platformId]: value
      }
    });

    // Validate URL
    if (value.trim() !== '' && !validateUrl(value)) {
      setSocialLinkErrors({
        ...socialLinkErrors,
        [platformId]: 'Please enter a valid URL (e.g., https://facebook.com/yourpage)'
      });
    } else {
      // Clear error for this platform
      const newErrors = { ...socialLinkErrors };
      delete newErrors[platformId];
      setSocialLinkErrors(newErrors);
    }
  };

  // Handle extra perks management
  const addExtraPerk = (tierLevel: number) => {
    setTierExtraPerks({
      ...tierExtraPerks,
      [tierLevel]: [...tierExtraPerks[tierLevel], '']
    });
  };

  const removeExtraPerk = (tierLevel: number, index: number) => {
    setTierExtraPerks({
      ...tierExtraPerks,
      [tierLevel]: tierExtraPerks[tierLevel].filter((_, i) => i !== index)
    });
  };

  const updateExtraPerk = (tierLevel: number, index: number, value: string) => {
    const updated = [...tierExtraPerks[tierLevel]];
    updated[index] = value;
    setTierExtraPerks({
      ...tierExtraPerks,
      [tierLevel]: updated
    });
  };

  // Calculate estimated monthly income
  const calculateMonthlyIncome = () => {
    const tier1Income = parseFloat(tierPrices.tier1) * parseFloat(estimatedSupporters.tier1 || '0');
    const tier2Income = parseFloat(tierPrices.tier2) * parseFloat(estimatedSupporters.tier2 || '0');
    const tier3Income = parseFloat(tierPrices.tier3) * parseFloat(estimatedSupporters.tier3 || '0');
    return tier1Income + tier2Income + tier3Income;
  };
  
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
            // Creator profile exists, redirect to Creator Studio
            router.push('/creator-studio');
          }
        };

        checkCreatorProfile();
      } else {
        // User is a supporter wanting to become a creator - show creator setup form
        setStep('creator-details');
      }
    }
  }, [user, userProfile, router]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mark this as creator signup flow
      localStorage.setItem('isCreatorSignupFlow', 'true');
      
      const { error } = await signInWithGoogle();
      
      if (error) {
        setError(error.message || 'Failed to sign in with Google');
        localStorage.removeItem('isCreatorSignupFlow');
        return;
      }
      
      // After OAuth redirect, the useEffect will handle the rest
    } catch (error: unknown) {
      console.error('Creator signup error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create account. Please try again.');
      localStorage.removeItem('isCreatorSignupFlow');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatorSetup = async () => {
    if (!user || !creatorData.category) return;

    // Validate all social links before proceeding
    const hasInvalidLinks = Object.entries(creatorData.socialLinks).some(([platformId, url]) => {
      if (url.trim() === '') return false; // Empty is fine
      return !validateUrl(url);
    });

    if (hasInvalidLinks) {
      setError('Please fix invalid social media URLs before continuing');
      return;
    }

    // Move to tier pricing step
    setStep('tier-pricing');
  };

  const handleCompleteTierSetup = async () => {
    if (!user || !creatorData.category) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Creating creator profile for user:', user.id);

      // Filter out empty social links
      const filteredSocialLinks = Object.fromEntries(
        Object.entries(creatorData.socialLinks).filter(([_, url]) => url.trim() !== '')
      );

      // Create creator profile
      const { error } = await createCreatorProfile(creatorData.bio, creatorData.category, filteredSocialLinks);

      if (error) {
        console.error('Creator profile creation failed:', error);
        setError(error.message || 'Failed to set up creator profile');
        return;
      }

      console.log('Creator profile created successfully');

      // Wait a moment for the database trigger to create default tiers
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update tier prices - the trigger creates default tiers, so we update them
      const tierData = [
        { 
          tier_level: 1, 
          price: parseFloat(tierPrices.tier1),
          tier_name: 'One Star Supporter',
          description: 'Access to supporter posts',
          benefits: ['Access to exclusive posts', 'Support the creator'],
          extra_perks: tierExtraPerks[1].filter(p => p.trim() !== '')
        },
        { 
          tier_level: 2, 
          price: parseFloat(tierPrices.tier2),
          tier_name: 'Two Star Supporter',
          description: 'Posts + Community chat access',
          benefits: ['Access to exclusive posts', 'Join community chat'],
          extra_perks: tierExtraPerks[2].filter(p => p.trim() !== '')
        },
        { 
          tier_level: 3, 
          price: parseFloat(tierPrices.tier3),
          tier_name: 'Three Star Supporter',
          description: 'Posts + Chat + Special perks',
          benefits: ['Access to exclusive posts', 'Join community chat'],
          extra_perks: tierExtraPerks[3].filter(p => p.trim() !== '')
        }
      ];

      // Update each tier with the user's custom prices and extra perks
      const updatePromises = tierData.map(tier => 
        supabase
          .from('subscription_tiers')
          .update({
            price: tier.price,
            tier_name: tier.tier_name,
            description: tier.description,
            benefits: tier.benefits,
            extra_perks: tier.extra_perks
          })
          .eq('creator_id', user.id)
          .eq('tier_level', tier.tier_level)
      );

      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        console.error('Failed to update tier prices:', errors);
        // Try upsert as fallback
        const { error: tierError } = await supabase
          .from('subscription_tiers')
          .upsert(
            tierData.map(tier => ({
              creator_id: user.id,
              tier_level: tier.tier_level,
              price: tier.price,
              tier_name: tier.tier_name,
              description: tier.description,
              benefits: tier.benefits,
              extra_perks: tier.extra_perks
            })),
            { onConflict: 'creator_id,tier_level' }
          );
        
        if (tierError) {
          console.error('Upsert also failed:', tierError);
          setError('Profile created but tier prices could not be updated. Please update them in your dashboard.');
        }
      } else {
        console.log('Tier prices updated successfully');
      }

      setStep('complete');

      // Redirect to Creator Studio
      setTimeout(() => {
        router.push('/creator-studio');
      }, 2000);
    } catch (error: unknown) {
      console.error('Creator setup error:', error);
      setError(error instanceof Error ? error.message : 'Failed to set up creator profile. Please try again.');
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
            <span className="text-xl font-bold">MeroCircle</span>
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
          className={step === 'tier-pricing' ? 'w-full max-w-6xl' : 'w-full max-w-2xl'}
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
                  <Link href="/auth" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
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
                {!user && (
                  <Badge className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-full mb-4">
                    Step 2 of 2
                  </Badge>
                )}

                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {user ? 'Upgrade to Creator' : 'Complete Your Creator Profile'}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {user
                    ? 'Tell your supporters about yourself and what you create'
                    : 'Tell your future supporters about yourself and what you create'}
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

                  <div>
                    <Label className="text-sm font-medium mb-3 block">
                      Social Media Platforms <span className="text-gray-500">(optional)</span>
                    </Label>
                    <p className="text-xs text-gray-500 mb-4">
                      Add your social media profiles to help supporters find you across platforms
                    </p>
                    <div className="space-y-3">
                      {SOCIAL_PLATFORMS.map((platform) => (
                        <div key={platform.id} className="flex items-center gap-3">
                          <span className="text-2xl">{platform.icon}</span>
                          <div className="flex-1">
                            <input
                              type="url"
                              placeholder={`${platform.name} profile URL (e.g., https://facebook.com/yourpage)`}
                              value={creatorData.socialLinks[platform.id] || ''}
                              onChange={(e) => handleSocialLinkChange(platform.id, e.target.value)}
                              className={`w-full rounded-md border ${
                                socialLinkErrors[platform.id] 
                                  ? 'border-red-500 dark:border-red-500' 
                                  : 'border-gray-300 dark:border-gray-600'
                              } bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:outline-none`}
                            />
                            {socialLinkErrors[platform.id] && (
                              <p className="text-xs text-red-500 mt-1">{socialLinkErrors[platform.id]}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
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

          {step === 'tier-pricing' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <Badge className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-full mb-4">
                  Step 3 of 3
                </Badge>

                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Set Your Support Tiers
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Choose the base price for each tier level. Supporters can add custom amounts.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
                {/* Left Column: Tier Setup */}
                <Card className="p-8">
                  <div className="space-y-6">
                    {/* Tier 1 */}
                    <div className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">One Star Supporter</h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Access to exclusive posts</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="tier1" className="text-sm font-medium">Base Price (NPR)</Label>
                          <input
                            id="tier1"
                            type="number"
                            min="10"
                            value={tierPrices.tier1}
                            onChange={(e) => setTierPrices({ ...tierPrices, tier1: e.target.value })}
                            className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Extra Perks (Optional)</Label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Add custom perks for this tier
                          </p>
                          <div className="space-y-2">
                            {tierExtraPerks[1].map((perk, index) => (
                              <div key={index} className="flex gap-2">
                                <input
                                  type="text"
                                  value={perk}
                                  onChange={(e) => updateExtraPerk(1, index, e.target.value)}
                                  placeholder="e.g., Monthly newsletter, Early access..."
                                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:outline-none"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeExtraPerk(1, index)}
                                  className="h-10 w-10"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addExtraPerk(1)}
                              className="w-full"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Perk
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tier 2 */}
                    <div className="p-6 border-2 border-yellow-300 dark:border-yellow-600 rounded-xl bg-yellow-50/50 dark:bg-yellow-900/10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            <Check className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Two Star Supporter</h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Posts + Community chat access</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="tier2" className="text-sm font-medium">Base Price (NPR)</Label>
                          <input
                            id="tier2"
                            type="number"
                            min={parseInt(tierPrices.tier1) + 1}
                            value={tierPrices.tier2}
                            onChange={(e) => setTierPrices({ ...tierPrices, tier2: e.target.value })}
                            className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Extra Perks (Recommended)</Label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Add custom perks for this tier
                          </p>
                          <div className="space-y-2">
                            {tierExtraPerks[2].map((perk, index) => (
                              <div key={index} className="flex gap-2">
                                <input
                                  type="text"
                                  value={perk}
                                  onChange={(e) => updateExtraPerk(2, index, e.target.value)}
                                  placeholder="e.g., Direct messaging, Priority support..."
                                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:outline-none"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeExtraPerk(2, index)}
                                  className="h-10 w-10"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addExtraPerk(2)}
                              className="w-full"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Perk
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tier 3 */}
                    <div className="p-6 border-2 border-purple-300 dark:border-purple-600 rounded-xl bg-purple-50/50 dark:bg-purple-900/10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                          <Crown className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            <Check className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            <Check className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Three Star Supporter</h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Posts + Chat + Special perks</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="tier3" className="text-sm font-medium">Base Price (NPR)</Label>
                          <input
                            id="tier3"
                            type="number"
                            min={parseInt(tierPrices.tier2) + 1}
                            value={tierPrices.tier3}
                            onChange={(e) => setTierPrices({ ...tierPrices, tier3: e.target.value })}
                            className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Extra Perks (Recommended)</Label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Add custom perks for this tier
                          </p>
                          <div className="space-y-2">
                            {tierExtraPerks[3].map((perk, index) => (
                              <div key={index} className="flex gap-2">
                                <input
                                  type="text"
                                  value={perk}
                                  onChange={(e) => updateExtraPerk(3, index, e.target.value)}
                                  placeholder="e.g., Monthly 1-on-1 call, Exclusive merchandise..."
                                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:outline-none"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeExtraPerk(3, index)}
                                  className="h-10 w-10"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addExtraPerk(3)}
                              className="w-full"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Perk
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Right Column: Income Calculator */}
                <Card className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <Calculator className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Income Calculator</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Estimate your monthly earnings</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Estimated Supporters Input */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="estTier1" className="text-sm font-medium">Estimated 1★ Supporters</Label>
                        <input
                          id="estTier1"
                          type="number"
                          min="0"
                          value={estimatedSupporters.tier1}
                          onChange={(e) => setEstimatedSupporters({ ...estimatedSupporters, tier1: e.target.value })}
                          className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-green-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <Label htmlFor="estTier2" className="text-sm font-medium">Estimated 2★ Supporters</Label>
                        <input
                          id="estTier2"
                          type="number"
                          min="0"
                          value={estimatedSupporters.tier2}
                          onChange={(e) => setEstimatedSupporters({ ...estimatedSupporters, tier2: e.target.value })}
                          className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-green-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <Label htmlFor="estTier3" className="text-sm font-medium">Estimated 3★ Supporters</Label>
                        <input
                          id="estTier3"
                          type="number"
                          min="0"
                          value={estimatedSupporters.tier3}
                          onChange={(e) => setEstimatedSupporters({ ...estimatedSupporters, tier3: e.target.value })}
                          className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-green-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Income Breakdown */}
                    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">Estimated Monthly Income</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">1★ Tier Income:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            NPR {((parseFloat(tierPrices.tier1) || 0) * (parseFloat(estimatedSupporters.tier1) || 0)).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">2★ Tier Income:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            NPR {((parseFloat(tierPrices.tier2) || 0) * (parseFloat(estimatedSupporters.tier2) || 0)).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">3★ Tier Income:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            NPR {((parseFloat(tierPrices.tier3) || 0) * (parseFloat(estimatedSupporters.tier3) || 0)).toLocaleString()}
                          </span>
                        </div>
                        <div className="border-t border-green-200 dark:border-green-800 pt-3 mt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total Monthly:</span>
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                              NPR {calculateMonthlyIncome().toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-6 mt-6">
                <div className="space-y-4">

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      💡 <strong>Tip:</strong> You can change these prices and perks anytime from your creator dashboard.
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

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setStep('creator-details')}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleCompleteTierSetup}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Setting up...
                        </div>
                      ) : (
                        'Complete Setup'
                      )}
                    </Button>
                  </div>
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
                Welcome to MeroCircle! 🎉
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
