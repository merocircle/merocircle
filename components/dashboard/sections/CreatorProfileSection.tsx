'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  ShoppingBag,
  FileText,
  Info,
  Calendar,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/supabase-auth-context';
import { useDashboardView } from '@/contexts/dashboard-context';
import { useCreatorDetails, useSubscription } from '@/hooks/useCreatorDetails';
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard';
import { TierSelection } from '@/components/creator/TierSelection';
import { fadeInUp, staggerContainer } from '@/components/animations/variants';

import {
  CreatorHero,
  CreatorTabs,
  CreatorStats,
  SocialLinksCard,
} from '@/components/organisms/creator';

// Lazy load PaymentGatewaySelector
const PaymentGatewaySelector = dynamic(
  () => import('@/components/payment/PaymentGatewaySelector').then(mod => ({ default: mod.PaymentGatewaySelector })),
  { loading: () => null, ssr: false }
);

interface CreatorProfileSectionProps {
  creatorId: string;
}

export default function CreatorProfileSection({ creatorId }: CreatorProfileSectionProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { closeCreatorProfile, setActiveView } = useDashboardView();

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

  const [activeTab, setActiveTab] = useState('home');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showGatewaySelector, setShowGatewaySelector] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    tierLevel: number;
    amount: number;
    message?: string;
  } | null>(null);

  // If viewing own profile, switch to profile view
  if (user && user.id === creatorId) {
    setActiveView('profile');
    return null;
  }

  const handlePayment = useCallback(async (tierLevel: number, amount: number, message?: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    setPendingPayment({ tierLevel, amount, message });
    setShowGatewaySelector(true);
  }, [user, router]);

  const handleGatewaySelection = useCallback(async (gateway: 'esewa' | 'khalti' | 'direct') => {
    if (!pendingPayment || !user) return;

    if (gateway === 'direct') {
      setShowGatewaySelector(false);
      setPendingPayment(null);
      refreshCreatorDetails();
      alert('Support registered successfully!');
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
            (recentPosts as Array<Record<string, unknown>>).map((post) => (
              <motion.div key={String(post.id)} variants={fadeInUp}>
                <EnhancedPostCard
                  post={transformPost(post)}
                  currentUserId={user?.id}
                  showActions={true}
                  isSupporter={isSupporter}
                />
              </motion.div>
            ))
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
  ], [subscriptionTiers, creatorDetails, handlePayment, paymentLoading, recentPosts, transformPost, user?.id, isSupporter]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error || !creatorDetails) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-8 text-center border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4">Creator Not Found</h2>
            <p className="text-muted-foreground mb-6">
              This creator doesn&apos;t exist or has been removed
            </p>
            <Button onClick={closeCreatorProfile}>Go Back</Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="-mx-4 md:mx-0"
    >
      {/* Back Button */}
      <div className="px-4 py-3 md:px-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={closeCreatorProfile}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Hero Section */}
      <CreatorHero
        displayName={creatorDetails.display_name}
        avatarUrl={creatorDetails.avatar_url}
        coverImageUrl={creatorDetails.cover_image_url}
        bio={creatorDetails.bio}
        category={creatorDetails.category}
        isVerified={creatorDetails.is_verified}
        supporterCount={creatorDetails.supporter_count || 0}
        postsCount={creatorDetails.posts_count || 0}
        isSupporter={isSupporter}
      />

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Main Content with Tabs */}
          <div className="lg:col-span-2">
            <CreatorTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabs={tabs}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-4 space-y-6">
              <CreatorStats
                supporterCount={creatorDetails.supporter_count || 0}
                postsCount={creatorDetails.posts_count || 0}
                category={creatorDetails.category}
              />

              <SocialLinksCard
                socialLinks={creatorDetails.social_links}
              />
            </div>
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
    </motion.div>
  );
}
