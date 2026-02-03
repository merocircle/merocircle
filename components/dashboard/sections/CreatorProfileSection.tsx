'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  ShoppingBag,
  FileText,
  Info,
  Calendar,
  Loader2,
  Chrome,
  Heart,
  Users,
  CheckCircle2,
  Share2,
  Shield,
  Globe,
  Lock,
  Sparkles,
  Star,
  MessageCircle,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useDashboardViewSafe } from '@/contexts/dashboard-context';
import { useCreatorDetails, useSubscription } from '@/hooks/useCreatorDetails';
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard';
import { TierSelection } from '@/components/creator/TierSelection';
import { fadeInUp, staggerContainer } from '@/components/animations/variants';
import { slugifyDisplayName } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { SocialLinksCard } from '@/components/organisms/creator';
import { SupportBanner } from '@/components/creator/SupportBanner';

// Lazy load chat component
const StreamCommunitySection = dynamic(
  () => import('./StreamCommunitySection'),
  { loading: () => <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>, ssr: false }
);

// Lazy load PaymentGatewaySelector
const PaymentGatewaySelector = dynamic(
  () => import('@/components/payment/PaymentGatewaySelector').then(mod => ({ default: mod.PaymentGatewaySelector })),
  { loading: () => null, ssr: false }
);

interface CreatorProfileSectionProps {
  creatorId: string;
  initialHighlightedPostId?: string | null;
  defaultTab?: 'posts' | 'membership' | 'shop' | 'about' | 'chat';
}

export default function CreatorProfileSection({ creatorId, initialHighlightedPostId, defaultTab }: CreatorProfileSectionProps) {
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const { closeCreatorProfile, setActiveView, isWithinProvider, highlightedPostId: contextHighlightedPostId } = useDashboardViewSafe();
  const highlightedPostRef = useRef<HTMLDivElement>(null);

  // Use either the context highlighted post (for dashboard) or the prop (for public page)
  const [localHighlightedPostId, setLocalHighlightedPostId] = useState<string | null>(initialHighlightedPostId || null);
  const highlightedPostId = isWithinProvider ? contextHighlightedPostId : localHighlightedPostId;

  const [activeTab, setActiveTab] = useState(defaultTab || 'posts');

  useEffect(() => {
    if (initialHighlightedPostId && !isWithinProvider) {
      setLocalHighlightedPostId(initialHighlightedPostId);
      setActiveTab('posts');
    }
  }, [initialHighlightedPostId, isWithinProvider]);

  const {
    creatorDetails,
    subscriptionTiers,
    posts: recentPosts,
    loading,
    error,
    refreshCreatorDetails
  } = useCreatorDetails(creatorId);

  const { subscribe, unsubscribe } = useSubscription();

  const isSupporter = creatorDetails?.is_supporter || false;
  const hasActiveSubscription = creatorDetails?.current_subscription !== null;
  
  // Ensure posts tab is active when there's a highlighted post
  useEffect(() => {
    if (highlightedPostId && !isWithinProvider && activeTab !== 'posts') {
      setActiveTab('posts');
    }
  }, [highlightedPostId, isWithinProvider, activeTab]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showGatewaySelector, setShowGatewaySelector] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<{
    tierLevel: number;
    amount: number;
    message?: string;
  } | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [showTiers, setShowTiers] = useState(false);
  const [showSupportBanner, setShowSupportBanner] = useState(false);

  // Handle scroll for support banner
  useEffect(() => {
    if (activeTab !== 'posts' || isSupporter) {
      setShowSupportBanner(false);
      return;
    }

    const handleScroll = () => {
      const scrolled = window.scrollY > 400;
      setShowSupportBanner(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial scroll position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab, isSupporter]);

  // If viewing own profile, redirect to profile page
  const isOwnProfile = user && user.id === creatorId && isWithinProvider;
  useEffect(() => {
    if (isOwnProfile) {
      router.push('/profile');
    }
  }, [isOwnProfile, router]);

  const handlePayment = useCallback(async (tierLevel: number, amount: number, message?: string) => {
    if (!user) {
      if (typeof window !== 'undefined') {
        const redirectPath = isWithinProvider
          ? `${window.location.pathname}${window.location.search}`
          : `/creator/${creatorId}`;
        localStorage.setItem(
          'pendingSupport',
          JSON.stringify({ creatorId, tierLevel, amount, message })
        );
        localStorage.setItem(
          'postLoginRedirect',
          redirectPath
        );
      }
      setShowAuthModal(true);
      return;
    }

    setPendingPayment({ tierLevel, amount, message });
    setShowGatewaySelector(true);
  }, [user, creatorId, isWithinProvider]);

  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    const raw = localStorage.getItem('pendingSupport');
    if (!raw) return;
    try {
      const pending = JSON.parse(raw);
      if (pending.creatorId === creatorId) {
        setPendingPayment({
          tierLevel: pending.tierLevel,
          amount: pending.amount,
          message: pending.message
        });
        setShowGatewaySelector(true);
      }
    } catch {
      // Ignore invalid data
    } finally {
      localStorage.removeItem('pendingSupport');
    }
  }, [user, creatorId]);

  // Handle highlighted post - switch to posts tab and scroll to the post
  useEffect(() => {
    if (highlightedPostId && !loading && recentPosts.length > 0 && activeTab === 'posts') {
      const normalizedHighlightedId = String(highlightedPostId).toLowerCase().trim();
      const postExists = recentPosts.some((post: any) => {
        const normalizedPostId = String(post.id).toLowerCase().trim();
        return normalizedPostId === normalizedHighlightedId;
      });
      
      if (postExists) {
        const attemptScroll = (attempts = 0) => {
          const element = document.querySelector(`[data-post-id="${highlightedPostId}"]`) as HTMLElement ||
            highlightedPostRef.current;
          
          if (element) {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
            
            if (!isVisible || attempts === 0) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.style.scrollMarginTop = '20px';
            }
          } else if (attempts < 20) {
            setTimeout(() => attemptScroll(attempts + 1), 200 * (attempts + 1));
          }
        };

        // Start scrolling after ensuring tab is active and content is rendered
        const scrollTimer = setTimeout(() => {
          attemptScroll();
        }, 500);

        const backupTimer = setTimeout(() => {
          attemptScroll();
        }, 2000);

        // Clear the highlighted post after 5 seconds (for public page)
        const clearTimer = setTimeout(() => {
          if (!isWithinProvider) {
            setLocalHighlightedPostId(null);
          }
        }, 5000);

        return () => {
          clearTimeout(scrollTimer);
          clearTimeout(backupTimer);
          clearTimeout(clearTimer);
        };
      }
    }
  }, [highlightedPostId, loading, recentPosts, activeTab, isWithinProvider]);

  const handleGatewaySelection = useCallback(async (gateway: 'esewa' | 'khalti' | 'direct') => {
    if (!pendingPayment || !user) return;

    if (gateway === 'direct') {
      setShowGatewaySelector(false);
      setPaymentLoading(true);
      
      try {
        const { tierLevel, amount, message } = pendingPayment;
        
        const response = await fetch('/api/payment/direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            creatorId,
            supporterId: user.id,
            supporterMessage: message || '',
            tier_level: tierLevel,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Direct payment failed');
        }

        const result = await response.json();
        
        if (result.success && result.transaction) {
          // Redirect to payment success page with transaction details
          const transactionUuid = result.transaction.transaction_uuid;
          const totalAmount = result.transaction.amount;
          router.push(
            `/payment/success?transaction_uuid=${transactionUuid}&total_amount=${totalAmount}&product_code=DIRECT&creator_id=${creatorId}&gateway=direct`
          );
        } else {
          throw new Error(result.error || 'Payment failed');
        }
      } catch (error) {
        console.error('Direct payment error:', error);
        alert(error instanceof Error ? error.message : 'Failed to register support. Please try again.');
        setPaymentLoading(false);
      } finally {
        setPendingPayment(null);
      }
      return;
    }

    setShowGatewaySelector(false);
    setPaymentLoading(true);

    try {
      const { tierLevel, amount, message } = pendingPayment;

      if (gateway === 'khalti') {
        const response = await fetch('/api/payment/khalti/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            creatorId,
            supporterId: user.id,
            supporterMessage: message || '',
            tier_level: tierLevel,
          })
        });

        if (!response.ok) throw new Error('Khalti payment initiation failed');

        const result = await response.json();
        if (result.success && result.payment_url) {
          window.location.href = result.payment_url;
          return;
        }
        throw new Error(result.error || 'Invalid Khalti response');
      }

      // eSewa payment
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          creatorId,
          supporterId: user.id,
          supporterMessage: message || '',
          tier_level: tierLevel,
        })
      });

      if (!response.ok) throw new Error('Payment initiation failed');

      const result = await response.json();

      if (result.test_mode && result.redirect_url) {
        window.location.href = result.redirect_url;
        return;
      }

      if (result.success && result.esewaConfig) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = result.payment_url;

        Object.entries(result.esewaConfig).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else {
        throw new Error(result.error || 'Invalid payment response');
      }
    } catch (error: unknown) {
      console.error('[PAYMENT] Error:', error);
      alert(error instanceof Error ? error.message : 'Payment failed. Please try again.');
      setPaymentLoading(false);
      setPendingPayment(null);
    }
  }, [pendingPayment, user, creatorId, refreshCreatorDetails]);

  const handleSubscription = useCallback(async (tierId: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      if (hasActiveSubscription && creatorDetails?.current_subscription) {
        await unsubscribe(creatorId, creatorDetails.current_subscription.id);
        alert('Subscription cancelled successfully');
      } else {
        await subscribe(creatorId, tierId);
        alert('Subscribed successfully!');
      }
      refreshCreatorDetails();
    } catch {
      alert('Subscription failed. Please try again.');
    }
  }, [user, router, hasActiveSubscription, creatorDetails, creatorId, subscribe, unsubscribe, refreshCreatorDetails]);

  const handleAuthContinue = useCallback(async () => {
    try {
      setAuthLoading(true);
      setAuthError(null);
      const { error } = await signInWithGoogle();
      if (error) {
        setAuthError(error.message || 'Failed to sign in with Google');
      }
    } catch (error: unknown) {
      setAuthError(error instanceof Error ? error.message : 'Failed to sign in');
    } finally {
      setAuthLoading(false);
    }
  }, [signInWithGoogle]);

  const handleAuthModalChange = useCallback((open: boolean) => {
    setShowAuthModal(open);
    if (!open) {
      setAuthError(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pendingSupport');
        localStorage.removeItem('postLoginRedirect');
      }
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!creatorId || typeof window === 'undefined') return;
    // Use creator ID instead of username slug to avoid conflicts with duplicate names
    const url = `${window.location.origin}/creator/${creatorId}`;
    try {
      // Always copy to clipboard
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
      
      // Also try native share if available
      if (navigator.share) {
        await navigator.share({
          title: `Support ${creatorDetails?.display_name || 'this creator'}`,
          url
        });
      }
    } catch {
      // Ignore share errors, but still show copied state
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  }, [creatorId, creatorDetails?.display_name]);

  const handleBack = useCallback(() => {
    if (isWithinProvider) {
      closeCreatorProfile();
      return;
    }
    if (user) {
      router.push('/home');
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/');
  }, [closeCreatorProfile, isWithinProvider, router, user]);

  // Transform posts for EnhancedPostCard
  const transformPost = useCallback((post: Record<string, unknown>) => {
    const postId = String(post.id || '');
    const likes = post.likes as Array<Record<string, unknown>> | undefined;
    const comments = post.comments as Array<Record<string, unknown>> | undefined;

    return {
      id: postId,
      title: String(post.title || ''),
      content: String(post.content || ''),
      image_url: post.image_url ? String(post.image_url) : undefined,
      media_url: post.media_url ? String(post.media_url) : undefined,
      tier_required: String(post.tier_required || 'free'),
      post_type: String(post.post_type || 'post'),
      created_at: String(post.created_at || post.createdAt || ''),
      creator: (post.creator as Record<string, unknown>) || {
        id: creatorId,
        display_name: creatorDetails?.display_name || 'Unknown',
        photo_url: creatorDetails?.avatar_url,
        role: 'creator'
      },
      creator_profile: (post.creator_profile as Record<string, unknown>) || {
        category: creatorDetails?.category || undefined,
        is_verified: creatorDetails?.is_verified || false
      },
      poll: post.poll as Record<string, unknown> | undefined,
      likes_count: (post.likes_count as number) || (likes?.length || 0),
      comments_count: (post.comments_count as number) || (comments?.length || 0)
    };
  }, [creatorId, creatorDetails]);

  // Build tabs content
  const tabs = useMemo(() => [
    {
      value: 'home',
      label: 'Home',
      content: (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Tier Selection */}
          <motion.div variants={fadeInUp} className="flex justify-center">
            <div className="w-full max-w-2xl">
              <TierSelection
                tiers={subscriptionTiers}
                creatorName={creatorDetails?.display_name || ''}
                currentTierLevel={creatorDetails?.supporter_tier_level || 0}
                onSelectTier={handlePayment}
                loading={paymentLoading}
              />
            </div>
          </motion.div>

          {/* Recent Posts Preview */}
          {recentPosts.length > 0 && (
            <motion.div variants={fadeInUp} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Recent Posts</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('posts')}>
                  View All
                </Button>
              </div>
              {(recentPosts.slice(0, 3) as Array<Record<string, unknown>>).map((post) => (
                <motion.div key={String(post.id)} variants={fadeInUp}>
                  <EnhancedPostCard
                    post={transformPost(post)}
                    currentUserId={user?.id}
                    showActions={true}
                    isSupporter={isSupporter}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      )
    },
    {
      value: 'posts',
      label: 'Posts',
      content: (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {recentPosts.length > 0 ? (
            (recentPosts as Array<Record<string, unknown>>).map((post) => {
              const postId = String(post.id);
              const isHighlighted = highlightedPostId === postId;
              return (
                <motion.div
                  key={postId}
                  variants={fadeInUp}
                  ref={isHighlighted ? highlightedPostRef : undefined}
                  className={cn(
                    'transition-all duration-500',
                    isHighlighted && 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl'
                  )}
                >
                  <EnhancedPostCard
                    post={transformPost(post)}
                    currentUserId={user?.id}
                    showActions={true}
                    isSupporter={isSupporter}
                  />
                </motion.div>
              );
            })
          ) : (
            <motion.div variants={fadeInUp}>
              <Card className="p-12 text-center border-border">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Posts Yet</h3>
                <p className="text-muted-foreground">
                  This creator hasn&apos;t posted anything yet.
                </p>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )
    },
    {
      value: 'shop',
      label: 'Shop',
      icon: <ShoppingBag className="w-4 h-4" />,
      content: (
        <motion.div variants={fadeInUp} initial="hidden" animate="visible">
          <Card className="p-12 text-center border-border">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Shop Coming Soon</h3>
            <p className="text-muted-foreground">
              This creator will be able to sell products and merchandise here.
            </p>
          </Card>
        </motion.div>
      )
    },
    {
      value: 'about',
      label: 'About',
      icon: <Info className="w-4 h-4" />,
      content: (
        <motion.div variants={fadeInUp} initial="hidden" animate="visible">
          <Card className="p-6 border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">About</h3>
            <div className="space-y-4">
              {creatorDetails?.bio && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Bio</h4>
                  <p className="text-foreground">{creatorDetails.bio}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                {creatorDetails?.category && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Category</h4>
                    <Badge variant="outline">{creatorDetails.category}</Badge>
                  </div>
                )}

                {creatorDetails?.created_at && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Joined</h4>
                    <div className="flex items-center gap-2 text-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(creatorDetails.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long'
                      })}
                    </div>
                  </div>
                )}
              </div>

              {creatorDetails?.social_links && Object.keys(creatorDetails.social_links).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-3">Social Media</h4>
                    <SocialLinksCard
                      socialLinks={creatorDetails.social_links}
                      variant="inline"
                    />
                  </div>
                </>
              )}
            </div>
          </Card>
        </motion.div>
      )
    }
  ], [subscriptionTiers, creatorDetails, handlePayment, paymentLoading, recentPosts, transformPost, user?.id, isSupporter, highlightedPostId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/10">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
              <Loader2 className="w-12 h-12 animate-spin text-primary relative" />
            </div>
            <p className="text-sm text-muted-foreground">Loading creator profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // If viewing own profile, show loading while redirecting
  if (isOwnProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/10">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="flex flex-col items-center justify-center space-y-6">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !creatorDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/10 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-8 text-center border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4">Creator Not Found</h2>
            <p className="text-muted-foreground mb-6">
              This creator doesn&apos;t exist or has been removed
            </p>
            <Button onClick={handleBack}>Go Back</Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/5">
      {/* Professional Hero Section */}
      <div className="relative">
        {/* Cover Image */}
        <div className="relative h-80 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
          {creatorDetails.cover_image_url && (
            <>
              <Image
                src={creatorDetails.cover_image_url}
                alt="Cover"
                fill
                className="object-cover opacity-40"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            </>
          )}
          {!creatorDetails.cover_image_url && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-pink-500/5 to-purple-500/5" />
          )}
        </div>

        {/* Profile Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative -mt-20"
          >
            <div className="bg-background/95 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl p-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Avatar */}
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="flex-shrink-0"
                >
                  <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-background shadow-xl ring-4 ring-muted/20">
                      <AvatarImage src={creatorDetails.avatar_url} alt={creatorDetails.display_name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-primary-foreground text-4xl font-bold">
                        {creatorDetails.display_name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {creatorDetails.is_verified && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                        className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2 shadow-lg"
                      >
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Creator Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h1 className="text-3xl md:text-4xl font-bold text-foreground truncate">
                          {creatorDetails.display_name}
                        </h1>
                        {isSupporter ? (
                          <Badge className="gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Supported
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setActiveTab('membership')}
                            className="gap-2"
                          >
                            <Heart className="w-4 h-4" />
                            Support Him
                          </Button>
                        )}
                      </div>

                      {creatorDetails.bio && (
                        <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                          {creatorDetails.bio}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-6">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-2"
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-foreground">
                              {creatorDetails.supporter_count || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">Supporters</p>
                          </div>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-2"
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-500/10">
                            <FileText className="w-5 h-5 text-pink-500" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-foreground">
                              {creatorDetails.posts_count || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">Posts</p>
                          </div>
                        </motion.div>

                        {creatorDetails.category && (
                          <Badge variant="outline" className="gap-2 px-4 py-2 text-sm">
                            <Star className="w-4 h-4 text-amber-500" />
                            {creatorDetails.category}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      {isSupporter && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", delay: 0.2 }}
                        >
                          <Badge className="gap-2 px-4 py-2 bg-gradient-to-r from-primary to-pink-500">
                            <Heart className="w-4 h-4 fill-current" />
                            Supporter
                          </Badge>
                        </motion.div>
                      )}

                      <Button
                        variant={shareCopied ? "default" : "outline"}
                        size="icon"
                        onClick={handleShare}
                        className="hover:bg-muted/50 transition-colors"
                        title={shareCopied ? "Link copied!" : "Share creator profile"}
                      >
                        {shareCopied ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBack}
                        className="gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      {/* Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">

            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid h-12 bg-muted/50">
                  <TabsTrigger value="posts" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Posts
                  </TabsTrigger>
                  <TabsTrigger value="membership" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Membership
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="shop" className="gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Shop
                  </TabsTrigger>
                  <TabsTrigger value="about" className="gap-2">
                    <Info className="w-4 h-4" />
                    About
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="mt-6">
                  <div className="relative">
                    {isSupporter && (creatorDetails?.supporter_tier_level || 0) >= 2 ? (
                      <Card className="border-border/50 shadow-lg overflow-hidden">
                        <div className="h-[600px]">
                          <StreamCommunitySection creatorId={creatorId} />
                        </div>
                      </Card>
                    ) : (
                      /* Blurred Chat Preview */
                      <div className="relative">
                        <Card className="border-border/50 overflow-hidden">
                          <div className="h-[600px] relative">
                            {/* Blurred Preview */}
                            <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                              <div className="absolute inset-0 opacity-20 blur-xl">
                                <div className="p-4 space-y-4">
                                  <div className="h-12 bg-foreground/20 rounded" />
                                  <div className="h-20 bg-foreground/10 rounded" />
                                  <div className="h-16 bg-foreground/10 rounded" />
                                  <div className="h-24 bg-foreground/10 rounded" />
                                </div>
                              </div>
                              
                              {/* Lock Overlay */}
                              <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-background/80">
                                <div className="text-center p-8 max-w-md space-y-6">
                                  <div className="flex justify-center">
                                    <div className="p-4 bg-background rounded-2xl shadow-xl border border-border">
                                      <MessageCircle className="w-12 h-12 text-primary" />
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h3 className="text-2xl font-bold text-foreground mb-2">
                                      Chat Access Locked
                                    </h3>
                                    <p className="text-muted-foreground">
                                      Upgrade to Inner Circle or Core Member tier to access exclusive chat with {creatorDetails.display_name}
                                    </p>
                                  </div>
                                  
                                  <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                      <span>Direct messages with creator</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                      <span>Private community channels</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                      <span>Priority support</span>
                                    </div>
                                  </div>
                                  
                                  <Button 
                                    size="lg" 
                                    className="w-full shadow-lg" 
                                    onClick={() => setActiveTab('membership')}
                                  >
                                    <span>View Membership Tiers</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="membership" className="mt-6">
                  <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-foreground mb-3">
                        Support {creatorDetails.display_name}
                      </h2>
                      <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        {creatorDetails.bio || `Join ${creatorDetails.supporter_count || 0} supporters and get exclusive content, early access, and more.`}
                      </p>
                      {creatorDetails.supporter_count > 0 && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span><span className="font-semibold text-foreground">{creatorDetails.supporter_count}</span> supporters</span>
                        </div>
                      )}
                    </div>
                    
                    {isSupporter ? (
                      /* Supporter View */
                      <div>
                        <Card className="border-border/50 p-6 mb-6">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 border-2 border-green-500/20">
                              <CheckCircle2 className="w-7 h-7 text-green-500" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">You're supporting at</p>
                              <p className="text-2xl font-bold text-foreground">
                                {creatorDetails?.supporter_tier_level === 1 && 'Supporter'}
                                {creatorDetails?.supporter_tier_level === 2 && 'Inner Circle'}
                                {creatorDetails?.supporter_tier_level === 3 && 'Core Member'}
                              </p>
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            onClick={() => setShowTiers(!showTiers)}
                            className="w-full"
                          >
                            {showTiers ? 'Hide' : 'View'} All Membership Tiers
                          </Button>
                        </Card>
                        
                        {showTiers && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <TierSelection
                              tiers={subscriptionTiers}
                              creatorName={creatorDetails.display_name || ''}
                              currentTierLevel={creatorDetails.supporter_tier_level || 0}
                              onSelectTier={handlePayment}
                              loading={paymentLoading}
                            />
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      /* Non-Supporter View */
                      <TierSelection
                        tiers={subscriptionTiers}
                        creatorName={creatorDetails.display_name || ''}
                        currentTierLevel={creatorDetails.supporter_tier_level || 0}
                        onSelectTier={handlePayment}
                        loading={paymentLoading}
                      />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="posts" className="mt-6 space-y-6">
                  {recentPosts.length > 0 ? (
                    <>
                      {(recentPosts as Array<Record<string, unknown>>).map((post) => {
                        const postId = String(post.id);
                        const isHighlighted = highlightedPostId === postId;
                        return (
                          <motion.div
                            key={postId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            ref={isHighlighted ? highlightedPostRef : undefined}
                            data-post-id={postId}
                            className={cn(
                              'transition-all duration-500',
                              isHighlighted && 'ring-2 ring-primary ring-offset-4 ring-offset-background rounded-xl'
                            )}
                          >
                            <EnhancedPostCard
                              post={transformPost(post)}
                              currentUserId={user?.id}
                              showActions={true}
                              isSupporter={isSupporter}
                            />
                          </motion.div>
                        );
                      })}
                      {/* Bottom padding when banner is visible */}
                      {showSupportBanner && <div className="h-24" />}
                    </>
                  ) : (
                    <Card className="p-16 text-center border-dashed border-2 border-border/50">
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">No Posts Yet</h3>
                          <p className="text-muted-foreground">
                            This creator hasn&apos;t shared any content yet. Check back soon!
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="shop" className="mt-6">
                  <Card className="p-16 text-center border-border/50">
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                        <ShoppingBag className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">Shop Coming Soon</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          This creator will soon be able to sell products and merchandise directly to their supporters.
                        </p>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="about" className="mt-6">
                  <Card className="border-border/50 shadow-lg">
                    <div className="p-6 space-y-6">
                      {creatorDetails.bio && (
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-primary" />
                            About
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {creatorDetails.bio}
                          </p>
                        </div>
                      )}

                      <Separator />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {creatorDetails.category && (
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-3">Category</h4>
                            <Badge variant="outline" className="gap-2 px-3 py-1.5">
                              <Star className="w-4 h-4 text-amber-500" />
                              {creatorDetails.category}
                            </Badge>
                          </div>
                        )}

                        {creatorDetails.created_at && (
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-3">Member Since</h4>
                            <div className="flex items-center gap-2 text-foreground">
                              <Calendar className="w-4 h-4 text-primary" />
                              <span className="font-medium">
                                {new Date(creatorDetails.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {creatorDetails.social_links && Object.keys(creatorDetails.social_links).length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-4 flex items-center gap-2">
                              <Globe className="w-4 h-4 text-primary" />
                              Connect with {creatorDetails.display_name}
                            </h4>
                            <SocialLinksCard
                              socialLinks={creatorDetails.social_links}
                              variant="inline"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Payment Gateway Selector Modal */}
      {pendingPayment && user && (
        <PaymentGatewaySelector
          open={showGatewaySelector}
          onClose={() => {
            setShowGatewaySelector(false);
            setPendingPayment(null);
          }}
          onSelectGateway={handleGatewaySelection}
          amount={pendingPayment.amount}
          tierLevel={pendingPayment.tierLevel}
          creatorId={creatorId}
          supporterId={user.id}
          supporterMessage={pendingPayment.message}
        />
      )}

      {/* Auth Modal for Support Action */}
      <Dialog open={showAuthModal} onOpenChange={handleAuthModalChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Sign in to Support</DialogTitle>
            <DialogDescription className="text-sm">
              Continue with Google to support this creator and unlock exclusive content.
            </DialogDescription>
          </DialogHeader>

          {authError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {authError}
            </div>
          )}

          <Button
            onClick={handleAuthContinue}
            disabled={authLoading}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {authLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Redirecting...
              </div>
            ) : (
              <div className="flex items-center">
                <Chrome className="w-5 h-5 mr-2" />
                Continue with Google
              </div>
            )}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Support Banner - Only for non-supporters in Posts tab */}
      {!isSupporter && activeTab === 'posts' && (
        <SupportBanner
          creatorName={creatorDetails.display_name}
          creatorAvatar={creatorDetails.avatar_url}
          supporterCount={creatorDetails.supporter_count || 0}
          onJoinClick={() => setActiveTab('membership')}
          show={showSupportBanner}
        />
      )}
    </div>
  );
}
