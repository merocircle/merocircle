"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  TrendingUp,
  Camera,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useSession, signIn } from 'next-auth/react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

import { Logo } from '@/components/ui/logo';
import { CREATOR_CATEGORIES } from '@/lib/constants';

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
    username: '',
    bio: '',
    category: '',
    socialLinks: {} as Record<string, string>
  });
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [tierPrices, setTierPrices] = useState({
    tier1: '0',
    tier2: '2000',
    tier3: '5000'
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
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [socialLinkErrors, setSocialLinkErrors] = useState<Record<string, string>>({});
  const [addedSocialPlatforms, setAddedSocialPlatforms] = useState<string[]>([]);
  const [selectedPlatformToAdd, setSelectedPlatformToAdd] = useState<string>('');
  const lastAddedLinkInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user, userProfile, createCreatorProfile } = useAuth();

  const DRAFT_KEY = 'creator-signup-draft';

  // Restore draft when component mounts (user may have gone back or refreshed)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        step?: string;
        creatorData?: typeof creatorData;
        tierPrices?: typeof tierPrices;
        tierExtraPerks?: typeof tierExtraPerks;
        estimatedSupporters?: typeof estimatedSupporters;
        profilePhotoUrl?: string | null;
        addedSocialPlatforms?: string[];
      };
      if (draft.step && draft.step !== 'signup') {
        if (draft.creatorData) setCreatorData(draft.creatorData);
        if (draft.tierPrices) setTierPrices(draft.tierPrices);
        if (draft.tierExtraPerks) setTierExtraPerks(draft.tierExtraPerks);
        if (draft.estimatedSupporters) setEstimatedSupporters(draft.estimatedSupporters);
        if (draft.profilePhotoUrl !== undefined) setProfilePhotoUrl(draft.profilePhotoUrl);
        if (draft.addedSocialPlatforms) setAddedSocialPlatforms(draft.addedSocialPlatforms);
        if (draft.step === 'creator-details' || draft.step === 'tier-pricing') setStep(draft.step as any);
      }
    } catch (_) {}
  }, []);

  // Persist draft whenever we're on creator-details or tier-pricing and key state changes
  useEffect(() => {
    if (typeof window === 'undefined' || step === 'signup' || step === 'complete') return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
        step,
        creatorData,
        tierPrices,
        tierExtraPerks,
        estimatedSupporters,
        profilePhotoUrl,
        addedSocialPlatforms,
      }));
    } catch (_) {}
  }, [step, creatorData, tierPrices, tierExtraPerks, estimatedSupporters, profilePhotoUrl, addedSocialPlatforms]);

  // Focus the newly added social link input when a platform is added
  useEffect(() => {
    if (addedSocialPlatforms.length === 0) return;
    const t = setTimeout(() => lastAddedLinkInputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [addedSocialPlatforms.length]);

  /** Vanity username: 3–30 chars, lowercase letters, numbers, underscores only */
  const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;
  const validateUsernameFormat = (value: string): boolean =>
    value.trim().length >= 3 && value.trim().length <= 30 && USERNAME_REGEX.test(value.trim().toLowerCase());

  const checkUsernameAvailability = async (value: string): Promise<boolean> => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || !USERNAME_REGEX.test(trimmed)) return false;
    setUsernameChecking(true);
    setUsernameError(null);
    try {
      const res = await fetch(`/api/creator/check-username?username=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        setUsernameError(data.error || 'Invalid username');
        return false;
      }
      if (!data.available) {
        setUsernameError('Choose a new username. This one is already taken.');
        return false;
      }
      setUsernameError(null);
      return true;
    } catch {
      setUsernameError('Could not check availability');
      return false;
    } finally {
      setUsernameChecking(false);
    }
  };

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

  const handleAddSocialPlatform = () => {
    if (!selectedPlatformToAdd) return;
    
    // Check if platform is already added
    if (addedSocialPlatforms.includes(selectedPlatformToAdd)) {
      return;
    }

    // Add platform to the list
    setAddedSocialPlatforms([...addedSocialPlatforms, selectedPlatformToAdd]);
    setSelectedPlatformToAdd('');
  };

  // Auto-add platform when selected from dropdown
  const handlePlatformSelect = (platformId: string) => {
    if (!platformId) return;
    
    // Check if platform is already added
    if (addedSocialPlatforms.includes(platformId)) {
      setSelectedPlatformToAdd('');
      return;
    }

    // Automatically add the platform when selected
    setAddedSocialPlatforms([...addedSocialPlatforms, platformId]);
    setSelectedPlatformToAdd('');
  };

  const handleRemoveSocialPlatform = (platformId: string) => {
    // Remove from added list
    setAddedSocialPlatforms(addedSocialPlatforms.filter(id => id !== platformId));
    
    // Remove from social links
    const newSocialLinks = { ...creatorData.socialLinks };
    delete newSocialLinks[platformId];
    setCreatorData({
      ...creatorData,
      socialLinks: newSocialLinks
    });

    // Remove error if exists
    const newErrors = { ...socialLinkErrors };
    delete newErrors[platformId];
    setSocialLinkErrors(newErrors);
  };

  // Get available platforms (not yet added)
  const getAvailablePlatforms = () => {
    return SOCIAL_PLATFORMS.filter(platform => !addedSocialPlatforms.includes(platform.id));
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

  // Calculate estimated monthly income (tier 1 is always free → 0)
  const calculateMonthlyIncome = () => {
    const tier1Income = 0; // 1★ Supporter is free; supporter count does not affect income
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
          const { data: creatorProfile } = await supabase
            .from('creator_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (!creatorProfile) {
            // Creator profile doesn't exist: only move to creator-details if we're still on signup (don't overwrite restored draft step)
            setStep((s) => (s === 'signup' ? 'creator-details' : s));
          } else {
            // Creator profile exists - check if it's complete (has required fields)
            const isComplete = creatorProfile.vanity_username && creatorProfile.category;
            
            if (isComplete) {
              // Profile is complete - redirect to Creator Studio
              router.push('/creator-studio');
            } else {
              // Profile is incomplete - load existing data and allow completion
              setCreatorData({
                username: creatorProfile.vanity_username || '',
                bio: creatorProfile.bio || '',
                category: creatorProfile.category || '',
                socialLinks: creatorProfile.social_links || {}
              });
              
              // Load existing social platforms
              if (creatorProfile.social_links) {
                const platforms = Object.keys(creatorProfile.social_links);
                setAddedSocialPlatforms(platforms);
              }
              
              // Load existing profile photo
              if (userProfile.photo_url) {
                setProfilePhotoUrl(userProfile.photo_url);
              }
              
              // Load existing tier data
              const { data: tierData } = await supabase
                .from('subscription_tiers')
                .select('*')
                .eq('creator_id', user.id)
                .order('tier_level', { ascending: true });
                
              if (tierData && tierData.length > 0) {
                const newTierPrices = { ...tierPrices };
                const newTierExtraPerks = { ...tierExtraPerks };
                
                tierData.forEach(tier => {
                  if (tier.tier_level === 1) {
                    newTierExtraPerks[1] = tier.extra_perks || [];
                  } else if (tier.tier_level === 2) {
                    newTierPrices.tier2 = tier.price.toString();
                    newTierExtraPerks[2] = tier.extra_perks || [];
                  } else if (tier.tier_level === 3) {
                    newTierPrices.tier3 = tier.price.toString();
                    newTierExtraPerks[3] = tier.extra_perks || [];
                  }
                });
                
                setTierPrices(newTierPrices);
                setTierExtraPerks(newTierExtraPerks);
              }
              
              // Set to creator-details step to complete the profile
              setStep('creator-details');
            }
          }
        };

        checkCreatorProfile();
      } else {
        // User is a supporter wanting to become a creator - only set step if still on signup
        setStep((s) => (s === 'signup' ? 'creator-details' : s));
      }
    }
  }, [user, userProfile, router]);

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    setUploadingPhoto(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'avatars');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();
      setProfilePhotoUrl(data.url);

      // Also update the user's photo_url in the database
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: data.url }),
      });
    } catch (err) {
      logger.error('Photo upload error', 'CREATOR_SIGNUP', { error: err instanceof Error ? err.message : String(err) });
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mark this as creator signup flow
      localStorage.setItem('isCreatorSignupFlow', 'true');
      
      await signIn('google', { callbackUrl: '/signup/creator' });
      
      // After OAuth redirect, the useEffect will handle the rest
    } catch (error: unknown) {
      logger.error('Creator signup error', 'CREATOR_SIGNUP', { error: error instanceof Error ? error.message : String(error) });
      setError(error instanceof Error ? error.message : 'Failed to create account. Please try again.');
      localStorage.removeItem('isCreatorSignupFlow');
      setLoading(false);
    }
  };

  const handleCreatorSetup = async () => {
    if (!user || !creatorData.category) return;

    const trimmedUsername = creatorData.username.trim().toLowerCase();
    if (!trimmedUsername) {
      setError('Please choose a username for your creator page');
      return;
    }
    if (!validateUsernameFormat(creatorData.username)) {
      setUsernameError('3–30 characters, only letters, numbers, and underscores');
      setError('Please enter a valid username');
      return;
    }
    const available = await checkUsernameAvailability(creatorData.username);
    if (!available) {
      setError('Choose a new username. This one is already taken.');
      return;
    }

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

      logger.info('Creating creator profile', 'CREATOR_SIGNUP', { userId: user.id });

      // Filter out empty social links
      const filteredSocialLinks = Object.fromEntries(
        Object.entries(creatorData.socialLinks).filter(([_, url]) => url.trim() !== '')
      );

      // Create creator profile (vanity username for /creator/[slug])
      const vanityUsername = creatorData.username.trim().toLowerCase() || undefined;
      const { error } = await createCreatorProfile(creatorData.bio, creatorData.category, filteredSocialLinks, vanityUsername);

      if (error) {
        logger.error('Creator profile creation failed', 'CREATOR_SIGNUP', { error: error instanceof Error ? error.message : String(error) });
        setError(error.message || 'Failed to set up creator profile');
        return;
      }

      logger.info('Creator profile created successfully', 'CREATOR_SIGNUP', { userId: user.id });

      // Wait a moment for the database trigger to create default tiers
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update tier prices - the trigger creates default tiers, so we update them
      const tierData = [
        { 
          tier_level: 1, 
          price: 0,
          tier_name: 'Supporter',
          description: 'Access to supporter posts',
          benefits: ['Access to exclusive posts', 'Community chat'],
          extra_perks: tierExtraPerks[1].filter(p => p.trim() !== '')
        },
        { 
          tier_level: 2, 
          price: parseFloat(tierPrices.tier2),
          tier_name: 'Inner Circle',
          description: 'Posts + Community chat access',
          benefits: ['Access to exclusive posts', 'Community chat'],
          extra_perks: tierExtraPerks[2].filter(p => p.trim() !== '')
        },
        { 
          tier_level: 3, 
          price: parseFloat(tierPrices.tier3),
          tier_name: 'Core Member',
          description: 'Posts + Chat + Special perks',
          benefits: ['Access to exclusive posts', 'Community chat', 'Special perks'],
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
        logger.error('Failed to update tier prices', 'CREATOR_SIGNUP', { errors });
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
          logger.error('Upsert tier failed', 'CREATOR_SIGNUP', { error: tierError instanceof Error ? tierError.message : String(tierError) });
          setError('Profile created but tier prices could not be updated. Please update them in your dashboard.');
        }
      } else {
        logger.info('Tier prices updated successfully', 'CREATOR_SIGNUP');
      }

      setStep('complete');
      try { sessionStorage.removeItem(DRAFT_KEY); } catch (_) {}

      // Redirect to Creator Studio
      setTimeout(() => {
        router.push('/creator-studio');
      }, 2000);
    } catch (error: unknown) {
      logger.error('Creator setup error', 'CREATOR_SIGNUP', { error: error instanceof Error ? error.message : String(error) });
      setError(error instanceof Error ? error.message : 'Failed to set up creator profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative z-10 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 top-0">
        <div className="w-full max-w-6xl mx-auto flex h-14 sm:h-16 items-center justify-between gap-3 px-4 sm:px-6 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link href="/profile" className="flex-shrink-0">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/" className="flex items-center gap-2 min-w-0 flex-shrink">
              <Logo className="w-6 h-6 text-primary object-contain flex-shrink-0"/>
              <span className="text-lg sm:text-xl font-bold text-foreground truncate">MeroCircle</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] items-start sm:items-center justify-center p-4 sm:p-6 md:p-8 overflow-x-hidden pb-[env(safe-area-inset-bottom)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`w-full min-w-0 ${step === 'tier-pricing' ? 'max-w-6xl xl:max-w-7xl' : 'max-w-3xl lg:max-w-4xl'}`}
        >
          {step === 'signup' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="min-w-0"
            >
              <div className="text-center mb-8 sm:mb-12">
                <Badge className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full mb-4">
                  Creator Signup
                </Badge>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
                  Share Your Creativity
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8">
                  Build your community and monetize your passion
                </p>
              </div>

              <Card className="p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
                <div className="text-center mb-6 sm:mb-8">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl bg-primary flex items-center justify-center">
                    <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">
                    Creator Account
                  </h2>
                  <div className="space-y-3 text-left max-w-md mx-auto">
                    <div className="flex items-center text-muted-foreground text-sm sm:text-base">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Build your creator profile
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm sm:text-base">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Receive support from fans
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm sm:text-base">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Monetize your content
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm sm:text-base">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      Track earnings in NPR
                    </div>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg mb-6"
                  >
                    <p className="text-destructive text-sm">{error}</p>
                  </motion.div>
                )}

                <Button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full h-12 sm:h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base sm:text-lg"
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
                <p className="text-sm text-muted-foreground">
                  Want to support creators?{' '}
                  <Link href="/auth" className="text-primary hover:underline font-medium">
                    Sign up as a Supporter
                  </Link>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary hover:underline font-medium">
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
              className="min-w-0"
            >
              <div className="text-center mb-6 sm:mb-8">
                {!user && (
                  <Badge className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full mb-4">
                    Step 2 of 2
                  </Badge>
                )}
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4">
                  {user ? 'Upgrade to Creator' : 'Complete Your Creator Profile'}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {user
                    ? 'Tell your supporters about yourself and what you create'
                    : 'Tell your future supporters about yourself and what you create'}
                </p>
              </div>

              <Card className="p-4 sm:p-6 md:p-8">
                <div className="space-y-6">
                  {/* Profile Picture Upload */}
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Profile Picture *</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Optional. Your supporters will see this photo — you can add or change it anytime in profile settings.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted border-2 border-dashed border-border flex-shrink-0">
                        {(profilePhotoUrl || user?.photo_url) ? (
                          <img
                            src={(profilePhotoUrl || user?.photo_url) ?? undefined}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/5">
                            <User className="w-8 h-8 text-muted-foreground/40" />
                          </div>
                        )}
                        {uploadingPhoto && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <div>
                        <input
                          type="file"
                          id="profile-photo-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfilePhotoUpload}
                          disabled={uploadingPhoto}
                        />
                        <label htmlFor="profile-photo-upload">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            asChild
                            disabled={uploadingPhoto}
                          >
                            <span className="cursor-pointer">
                              <Camera className="w-4 h-4 mr-2" />
                              {profilePhotoUrl || user?.photo_url ? 'Change Photo' : 'Upload Photo'}
                            </span>
                          </Button>
                        </label>
                        <p className="text-[11px] text-muted-foreground mt-1.5">JPG, PNG. Max 5MB.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">1. Creator page URL (username)</p>
                    <Label htmlFor="username" className="text-sm font-medium">
                      Username *
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-2 break-words">
                      Your creator page URL: /creator/{creatorData.username || 'your_username'}. Must be unique.
                    </p>
                    <input
                      id="username"
                      autoComplete="off"
                      type="text"
                      value={creatorData.username}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().slice(0, 30);
                        setCreatorData({ ...creatorData, username: v });
                        setUsernameError(null);
                      }}
                      onBlur={async () => {
                        if (!creatorData.username.trim()) return;
                        if (!validateUsernameFormat(creatorData.username)) {
                          setUsernameError('3–30 characters, only letters, numbers, and underscores');
                          return;
                        }
                        await checkUsernameAvailability(creatorData.username);
                      }}
                      placeholder="your_username"
                      className={`mt-1 w-full min-w-0 rounded-lg border bg-background px-3 sm:px-4 py-2.5 sm:py-3 text-foreground focus:ring-2 focus:ring-ring focus:border-primary ${
                        usernameError ? 'border-destructive' : 'border-input'
                      }`}
                      maxLength={30}
                      required
                    />
                    {usernameChecking && (
                      <p className="text-xs text-muted-foreground mt-1">Checking availability...</p>
                    )}
                    {usernameError && (
                      <p className="text-xs text-destructive mt-1">{usernameError}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-sm font-medium">
                      Category *
                    </Label>
                    <select
                      id="category"
                      value={creatorData.category}
                      onChange={(e) => setCreatorData({ ...creatorData, category: e.target.value })}
                      className="mt-2 w-full min-w-0 rounded-lg border border-input bg-background px-3 sm:px-4 py-2.5 sm:py-3 text-foreground focus:ring-2 focus:ring-ring focus:border-primary cursor-pointer"
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
                      className="mt-2 min-h-[100px] sm:min-h-[120px] resize-none border-input bg-background focus:ring-2 focus:ring-ring"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {creatorData.bio.length}/500 characters (optional)
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-3 block">
                      Social Media Platforms <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mb-4">
                      Add your social media profiles to help supporters find you across platforms
                    </p>
                    
                    {/* Added Social Platforms */}
                    <div className="space-y-3 mb-4">
                      {addedSocialPlatforms.map((platformId, index) => {
                        const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId);
                        if (!platform) return null;
                        const isLast = index === addedSocialPlatforms.length - 1;
                        return (
                          <div key={platform.id} className="flex items-center gap-3">
                            <span className="text-2xl flex-shrink-0">{platform.icon}</span>
                            <div className="flex-1">
                              <input
                                ref={isLast ? lastAddedLinkInputRef : undefined}
                                type="url"
                                placeholder={`${platform.name} profile URL (e.g., https://facebook.com/yourpage)`}
                                value={creatorData.socialLinks[platform.id] || ''}
                                onChange={(e) => handleSocialLinkChange(platform.id, e.target.value)}
                                className={`w-full min-w-0 rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring ${
                                  socialLinkErrors[platform.id] ? 'border-destructive' : 'border-input'
                                }`}
                              />
                              {socialLinkErrors[platform.id] && (
                                <p className="text-xs text-destructive mt-1">{socialLinkErrors[platform.id]}</p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSocialPlatform(platform.id)}
                              className="h-10 w-10 flex-shrink-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add More Social Platform */}
                    {getAvailablePlatforms().length > 0 && (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedPlatformToAdd}
                          onChange={(e) => handlePlatformSelect(e.target.value)}
                          className="flex-1 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring"
                        >
                          <option value="">Select a platform to add...</option>
                          {getAvailablePlatforms().map((platform) => (
                            <option key={platform.id} value={platform.id}>
                              {platform.icon} {platform.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {addedSocialPlatforms.length === 0 && (
                      <p className="text-xs text-muted-foreground italic text-center py-2">
                        No social media platforms added yet. Use the dropdown above to add one.
                      </p>
                    )}
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg"
                    >
                      <p className="text-destructive text-sm">{error}</p>
                    </motion.div>
                  )}

                  <Button
                    onClick={handleCreatorSetup}
                    disabled={!creatorData.category || loading}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
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
              className="min-w-0 overflow-hidden"
            >
              <div className="text-center mb-6 sm:mb-8">
                <Badge className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full mb-4">
                  Step 3 of 3
                </Badge>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4">
                  Set Your Support Tiers
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  The first tier (Supporter) is always free. Set the <strong className="text-foreground">base price per month</strong> (NPR) for Inner Circle and Core Member below.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-start">
                {/* Left Column: Tier Setup */}
                <Card className="p-4 sm:p-6 md:p-8 min-w-0">
                  <div className="space-y-4 sm:space-y-6">
                    {/* Tier 1 - Supporter (free) */}
                    <div className="p-4 sm:p-6 border-2 border-border rounded-xl bg-card">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Check className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                            <h3 className="text-lg sm:text-xl font-bold text-foreground">Supporter (Free)</h3>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">Access to community chat and posts</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Price</Label>
                          <div className="mt-2 w-full rounded-lg border border-border bg-muted/50 px-3 sm:px-4 py-2.5 sm:py-3 text-muted-foreground text-sm sm:text-base">
                            Free — no payment required
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 font-medium">Included: Access to posts, Community chat</p>
                          <Label className="text-sm font-medium">Extra perks</Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Add more perks for your free tier (e.g., early access to posts, newsletter)
                          </p>
                          <div className="space-y-2">
                            {tierExtraPerks[1].map((perk, index) => (
                              <div key={index} className="flex gap-2 min-w-0">
                                <input
                                  type="text"
                                  value={perk}
                                  onChange={(e) => updateExtraPerk(1, index, e.target.value)}
                                  placeholder="e.g., Early access to posts, Newsletter..."
                                  className="flex-1 min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring"
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
                    <div className="p-4 sm:p-6 border-2 border-border rounded-xl bg-accent/30">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-foreground">Inner Circle</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">Posts + Community chat access</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="tier2" className="text-sm font-medium">Base price per month (NPR)</Label>
                          <div className="mt-2 flex items-center gap-2 min-w-0">
                            <input
                              id="tier2"
                              type="number"
                              min={Math.max(1, (parseInt(tierPrices.tier1) || 0) + 1)}
                              value={tierPrices.tier2}
                              onChange={(e) => setTierPrices({ ...tierPrices, tier2: e.target.value })}
                              className="flex-1 min-w-0 rounded-lg border border-input bg-background px-3 sm:px-4 py-2.5 sm:py-3 text-foreground focus:ring-2 focus:ring-ring"
                            />
                            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">per month</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 font-medium">Included: Access to posts, Community chat</p>
                          <Label className="text-sm font-medium">Extra perks</Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Add custom perks for this tier
                          </p>
                          <div className="space-y-2">
                            {tierExtraPerks[2].map((perk, index) => (
                              <div key={index} className="flex gap-2 min-w-0">
                                <input
                                  type="text"
                                  value={perk}
                                  onChange={(e) => updateExtraPerk(2, index, e.target.value)}
                                  placeholder="e.g., Direct messaging, Priority support..."
                                  className="flex-1 min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring"
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
                    <div className="p-4 sm:p-6 border-2 border-primary/30 rounded-xl bg-primary/5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                          <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Check className="w-5 h-5 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                            <Check className="w-5 h-5 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                            <Check className="w-5 h-5 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                            <h3 className="text-lg sm:text-xl font-bold text-foreground">Core Member</h3>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">Posts + Chat + Special perks</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="tier3" className="text-sm font-medium">Base price per month (NPR)</Label>
                          <div className="mt-2 flex items-center gap-2 min-w-0">
                            <input
                              id="tier3"
                              type="number"
                              min={parseInt(tierPrices.tier2) + 1}
                              value={tierPrices.tier3}
                              onChange={(e) => setTierPrices({ ...tierPrices, tier3: e.target.value })}
                              className="flex-1 min-w-0 rounded-lg border border-input bg-background px-3 sm:px-4 py-2.5 sm:py-3 text-foreground focus:ring-2 focus:ring-ring"
                            />
                            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">per month</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 font-medium">Included: Access to posts, Community chat, Special perks</p>
                          <Label className="text-sm font-medium">Extra perks</Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Add custom perks for this tier
                          </p>
                          <div className="space-y-2">
                            {tierExtraPerks[3].map((perk, index) => (
                              <div key={index} className="flex gap-2 min-w-0">
                                <input
                                  type="text"
                                  value={perk}
                                  onChange={(e) => updateExtraPerk(3, index, e.target.value)}
                                  placeholder="e.g., Monthly 1-on-1 call, Exclusive merchandise..."
                                  className="flex-1 min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring"
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
                <Card className="p-4 sm:p-6 md:p-8 min-w-0">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-foreground">Income Calculator</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Estimate your monthly earnings</p>
                    </div>
                  </div>
                  <div className="space-y-4 sm:space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="estTier1" className="text-sm font-medium">Estimated Supporters (free tier)</Label>
                        <input
                          id="estTier1"
                          type="number"
                          min="0"
                          value={estimatedSupporters.tier1}
                          onChange={(e) => setEstimatedSupporters({ ...estimatedSupporters, tier1: e.target.value })}
                          className="mt-2 w-full min-w-0 rounded-lg border border-input bg-background px-3 sm:px-4 py-2.5 sm:py-3 text-foreground focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <Label htmlFor="estTier2" className="text-sm font-medium">Estimated Inner Circle supporters</Label>
                        <input
                          id="estTier2"
                          type="number"
                          min="0"
                          value={estimatedSupporters.tier2}
                          onChange={(e) => setEstimatedSupporters({ ...estimatedSupporters, tier2: e.target.value })}
                          className="mt-2 w-full min-w-0 rounded-lg border border-input bg-background px-3 sm:px-4 py-2.5 sm:py-3 text-foreground focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <Label htmlFor="estTier3" className="text-sm font-medium">Estimated Core Member supporters</Label>
                        <input
                          id="estTier3"
                          type="number"
                          min="0"
                          value={estimatedSupporters.tier3}
                          onChange={(e) => setEstimatedSupporters({ ...estimatedSupporters, tier3: e.target.value })}
                          className="mt-2 w-full min-w-0 rounded-lg border border-input bg-background px-3 sm:px-4 py-2.5 sm:py-3 text-foreground focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                    <div className="p-4 sm:p-6 bg-muted/50 rounded-xl border-2 border-border">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-primary flex-shrink-0" />
                        <h4 className="font-semibold text-foreground">Estimated Monthly Income</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-sm text-muted-foreground">Supporter (free):</span>
                          <span className="font-medium text-foreground">NPR 0</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-sm text-muted-foreground">Inner Circle:</span>
                          <span className="font-medium text-foreground">
                            NPR {((parseFloat(tierPrices.tier2) || 0) * (parseFloat(estimatedSupporters.tier2) || 0)).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-sm text-muted-foreground">Core Member:</span>
                          <span className="font-medium text-foreground">
                            NPR {((parseFloat(tierPrices.tier3) || 0) * (parseFloat(estimatedSupporters.tier3) || 0)).toLocaleString()}
                          </span>
                        </div>
                        <div className="border-t border-border pt-3 mt-3">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-base sm:text-lg font-semibold text-foreground">Total Monthly:</span>
                            <span className="text-xl sm:text-2xl font-bold text-primary">
                              NPR {calculateMonthlyIncome().toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-4 sm:p-6 mt-4 sm:mt-6 min-w-0">
                <div className="space-y-4">
                  <div className="p-4 bg-accent/50 border border-border rounded-lg">
                    <p className="text-sm text-foreground">
                      💡 <strong>Tip:</strong> You can change these prices and perks anytime from your creator dashboard.
                    </p>
                  </div>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg"
                    >
                      <p className="text-destructive text-sm">{error}</p>
                    </motion.div>
                  )}
                  <div className="flex flex-col-reverse sm:flex-row gap-3">
                    <Button
                      onClick={() => setStep('creator-details')}
                      variant="outline"
                      className="flex-1 min-w-0"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleCompleteTierSetup}
                      disabled={loading}
                      className="flex-1 min-w-0 bg-primary hover:bg-primary/90 text-primary-foreground"
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
                className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
              >
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
              </motion.div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">
                Welcome to MeroCircle! 🎉
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 px-2">
                Your creator profile has been set up successfully. Redirecting to your dashboard...
              </p>
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 
