'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentSuccessModal } from '@/components/payment/PaymentSuccessModal';
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
  TrendingUp,
  Camera,
  ImagePlus,
  Settings,
  Edit,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useDashboardViewSafe } from '@/contexts/dashboard-context';
import { signIn } from 'next-auth/react';
import { useCreatorDetails, useSubscription } from '@/hooks/useCreatorDetails';
import { useRealtimeCreatorPosts } from '@/hooks/useRealtimeFeed';
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard';
import { TimelineFeed, withTimeline } from '@/components/posts/TimelineFeed';
import { TierSelection } from '@/components/creator/TierSelection';
import { fadeInUp, staggerContainer } from '@/components/animations/variants';
import { cn, getValidAvatarUrl, slugifyDisplayName } from '@/lib/utils';
import { SocialLinksCard } from '@/components/organisms/creator';
import { SupportBanner } from '@/components/creator/SupportBanner';

const StreamCommunitySection = dynamic(
  () => import('./StreamCommunitySection'),
  { loading: () => <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>, ssr: false }
);

const PaymentGatewaySelector = dynamic(
  () => import('@/components/payment/PaymentGatewaySelector').then(mod => ({ default: mod.PaymentGatewaySelector })),
  { loading: () => null, ssr: false }
);

interface CreatorProfileSectionProps {
  creatorId: string;
  initialHighlightedPostId?: string | null;
  defaultTab?: 'posts' | 'membership' | 'shop' | 'about' | 'chat';
  renewFromUrl?: boolean;
  subscriptionIdFromUrl?: string | null;
}

export default function CreatorProfileSection({ creatorId, initialHighlightedPostId, defaultTab, renewFromUrl, subscriptionIdFromUrl }: CreatorProfileSectionProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { closeCreatorProfile, setActiveView, isWithinProvider, highlightedPostId: contextHighlightedPostId } = useDashboardViewSafe();
  const highlightedPostRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [localHighlightedPostId, setLocalHighlightedPostId] = useState<string | null>(initialHighlightedPostId || null);
  const [tempHighlightPostId, setTempHighlightPostId] = useState<string | null>(null);
  const highlightedPostId = isWithinProvider ? contextHighlightedPostId : localHighlightedPostId;

  const [activeTab, setActiveTab] = useState(defaultTab || 'posts');

  const [paymentSuccess, setPaymentSuccess] = useState<{
    transactionUuid: string;
    totalAmount: number;
    gateway: string;
  } | null>(null);

  const [showRenewAlreadyActiveDialog, setShowRenewAlreadyActiveDialog] = useState(false);

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
    refreshCreatorDetails,
    updateSupporterTier
  } = useCreatorDetails(creatorId);

  const creatorPostIds = useMemo(() => recentPosts.map((p) => String(p.id)), [recentPosts]);
  useRealtimeCreatorPosts(creatorPostIds, refreshCreatorDetails);

  const renewHandledRef = useRef(false);
  useEffect(() => {
    if (!renewFromUrl || !user || !creatorId || renewHandledRef.current) return;

    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const subId = subscriptionIdFromUrl ?? params.get('subscription_id') ?? '';

    (async () => {
      renewHandledRef.current = true;
      try {
        const res = await fetch(
          `/api/subscriptions/renewal-info?creatorId=${encodeURIComponent(creatorId)}${subId ? `&subscription_id=${encodeURIComponent(subId)}` : ''}`
        );
        if (!res.ok) {
          if (res.status === 404) return;
          throw new Error('Failed to get renewal info');
        }
        const data = await res.json();
        if (!data.success) return;

        const cleanUrl = () => {
          const u = new URL(window.location.href);
          u.searchParams.delete('renew');
          u.searchParams.delete('subscription_id');
          window.history.replaceState({}, '', u.pathname + u.search);
        };

        if (data.alreadyActive) {
          cleanUrl();
          setShowRenewAlreadyActiveDialog(true);
          return;
        }

        if (!data.renewal) return;

        const { gateway, tierLevel, amount } = data.renewal;
        const cleanUrlForPayment = () => {
          const u = new URL(window.location.href);
          u.searchParams.delete('renew');
          u.searchParams.delete('subscription_id');
          window.history.replaceState({}, '', u.pathname + u.search);
        };

        if (gateway === 'direct') {
          const payRes = await fetch('/api/payment/direct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount,
              creatorId,
              supporterId: user.id,
              supporterMessage: '',
              tier_level: tierLevel ?? 1,
            }),
          });
          const payData = await payRes.json();
          cleanUrlForPayment();
          if (payRes.ok && payData.success && payData.transaction) {
            setPaymentSuccess({
              transactionUuid: payData.transaction.transaction_uuid,
              totalAmount: payData.transaction.amount,
              gateway: 'direct',
            });
            refreshCreatorDetails();
          } else {
            setActiveTab('membership');
          }
          return;
        }

        if (gateway === 'esewa') {
          const payRes = await fetch('/api/payment/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount,
              creatorId,
              supporterId: user.id,
              supporterMessage: '',
              tier_level: tierLevel ?? 1,
            }),
          });
          const payData = await payRes.json();
          cleanUrlForPayment();
          if (payRes.ok && payData.redirect_url) {
            window.location.href = payData.redirect_url;
            return;
          }
          if (payRes.ok && payData.payment_url && payData.esewaConfig) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = payData.payment_url;
            Object.entries(payData.esewaConfig).forEach(([k, v]) => {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = k;
              input.value = String(v);
              form.appendChild(input);
            });
            document.body.appendChild(form);
            form.submit();
            return;
          }
          setActiveTab('membership');
          return;
        }

        if (gateway === 'khalti') {
          const payRes = await fetch('/api/payment/khalti/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount,
              creatorId,
              supporterId: user.id,
              supporterMessage: '',
              tier_level: tierLevel ?? 1,
            }),
          });
          const payData = await payRes.json();
          cleanUrlForPayment();
          if (payRes.ok && payData.payment_url) {
            window.location.href = payData.payment_url;
            return;
          }
          setActiveTab('membership');
          return;
        }

        if (gateway === 'dodo') {
          const payRes = await fetch('/api/payment/dodo/subscription/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount,
              creatorId,
              supporterId: user.id,
              supporterMessage: '',
              tier_level: tierLevel ?? 1,
            }),
          });
          const payData = await payRes.json();
          cleanUrlForPayment();
          const redirectUrl = payData.payment_url || payData.checkout_url;
          if (payRes.ok && redirectUrl) {
            window.location.href = redirectUrl;
            return;
          }
          setActiveTab('membership');
          return;
        }

        setActiveTab('membership');
      } catch {
        renewHandledRef.current = false;
        setActiveTab('membership');
      }
    })();
  }, [renewFromUrl, subscriptionIdFromUrl, user, creatorId, refreshCreatorDetails]);

  const { subscribe, unsubscribe } = useSubscription();

  const isSupporter = creatorDetails?.is_supporter || false;
  const hasActiveSubscription = creatorDetails?.current_subscription !== null;

  const handlePaymentSuccess = useCallback((tierLevel: number, navigateToTab?: 'posts' | 'chat') => {
    updateSupporterTier(tierLevel);
    
    if (navigateToTab) {
      setActiveTab(navigateToTab);
      
      if (navigateToTab === 'posts') {
        setTimeout(() => {
          if (recentPosts.length > 0) {
            const firstPostId = String(recentPosts[0].id);
            setTempHighlightPostId(firstPostId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => setTempHighlightPostId(null), 3000);
          }
        }, 100);
      } else if (navigateToTab === 'chat') {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    }
  }, [updateSupporterTier, recentPosts]);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('refresh') || urlParams.has('payment_complete')) {
      refreshCreatorDetails();
    }
  }, [refreshCreatorDetails]);
  
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
  const [showConfirmFreeSupport, setShowConfirmFreeSupport] = useState<{ message?: string } | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // Own-profile edit states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [showTiers, setShowTiers] = useState(false);
  const [showSupportBanner, setShowSupportBanner] = useState(false);

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
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab, isSupporter]);

  const isOwnProfile = user && user.id === creatorId;

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

    // Free tier (Supporter): confirm modal then direct payment with amount 0
    if (tierLevel === 1 && amount === 0) {
      setShowConfirmFreeSupport({ message });
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
        if (pending.tierLevel === 1 && pending.amount === 0) {
          setShowConfirmFreeSupport({ message: pending.message });
        } else {
          setPendingPayment({
            tierLevel: pending.tierLevel,
            amount: pending.amount,
            message: pending.message
          });
          setShowGatewaySelector(true);
        }
      }
    } catch {
    } finally {
      localStorage.removeItem('pendingSupport');
    }
  }, [user, creatorId]);

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

        const scrollTimer = setTimeout(() => {
          attemptScroll();
        }, 500);

        const backupTimer = setTimeout(() => {
          attemptScroll();
        }, 2000);

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

  const setPostRef = useCallback(
    (postId: string, el: HTMLDivElement | null) => {
      if (el) {
        postRefs.current.set(postId, el);
      } else {
        postRefs.current.delete(postId);
      }
    },
    [],
  );

  const scrollToPost = useCallback((postId: string) => {
    const el = postRefs.current.get(postId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'box-shadow 0.3s ease';
      el.style.boxShadow = '0 0 0 2px hsl(var(--primary))';
      setTimeout(() => {
        el.style.boxShadow = '';
      }, 1000);
    }
  }, []);

  const handleGatewaySelection = useCallback(async (gateway: 'esewa' | 'khalti' | 'dodo' | 'direct') => {
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
          setPaymentSuccess({
            transactionUuid: result.transaction.transaction_uuid,
            totalAmount: result.transaction.amount,
            gateway: 'direct',
          });
          setPaymentLoading(false);

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

      if (gateway === 'dodo') {
        const response = await fetch('/api/payment/dodo/subscription/initiate', {
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

        if (!response.ok) throw new Error('Dodo subscription initiation failed');

        const result = await response.json();

        if (result.success && result.transaction) {
          setPaymentSuccess({
            transactionUuid: result.transaction.transaction_uuid,
            totalAmount: result.transaction.amount,
            gateway: 'dodo',
          });
        } else throw new Error(result.error || 'Dodo payment failed');
      }

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

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.error || 'Khalti payment initiation failed');
        }

        const result = await response.json();
        // Khalti API returns payment_url – redirect user to Khalti to complete payment
        if (result.success && result.payment_url) {
          window.location.href = result.payment_url;
          return;
        }
        throw new Error(result.error || 'Khalti payment failed');
      }

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

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || 'Payment initiation failed');
      }

      const result = await response.json();

      // eSewa: redirect via URL if provided (e.g. test mode)
      if (result.test_mode && result.redirect_url) {
        window.location.href = result.redirect_url;
        return;
      }

      // eSewa: API returns payment_url + esewaConfig — submit form to redirect user to eSewa
      if (result.success && result.payment_url && result.esewaConfig) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = result.payment_url;
        Object.entries(result.esewaConfig).forEach(([k, v]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = k;
          input.value = String(v);
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }

      // Unexpected response shape
      throw new Error(result.error || 'eSewa payment failed');
    } catch (error: unknown) {
      console.error('[PAYMENT] Error:', error);
      alert(error instanceof Error ? error.message : 'Payment failed. Please try again.');
      setPaymentLoading(false);
      setPendingPayment(null);
    }
  }, [pendingPayment, user, creatorId, refreshCreatorDetails]);

  const handleConfirmFreeSupport = useCallback(async () => {
    if (!user || !showConfirmFreeSupport) return;
    setPaymentLoading(true);
    try {
      const response = await fetch('/api/payment/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 0,
          creatorId,
          supporterId: user.id,
          supporterMessage: showConfirmFreeSupport.message || '',
          tier_level: 1,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to join as supporter');
      }
      const result = await response.json();
      if (result.success && result.transaction) {
        updateSupporterTier(1);
        refreshCreatorDetails();
        setPaymentSuccess({
          transactionUuid: result.transaction.transaction_uuid,
          totalAmount: Number(result.transaction.amount ?? 0),
          gateway: 'direct',
        });
        setShowConfirmFreeSupport(null);
      } else {
        throw new Error(result.error || 'Failed to join');
      }
    } catch (error) {
      console.error('Free support error:', error);
      alert(error instanceof Error ? error.message : 'Could not join as supporter. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  }, [user, creatorId, showConfirmFreeSupport, refreshCreatorDetails, updateSupporterTier]);

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
      const callbackUrl = typeof window !== 'undefined' ? window.location.href : '/home';
      const result = await signIn('google', { callbackUrl });
      if (result?.error) {
        setAuthError(result.error || 'Failed to sign in with Google');
        setAuthLoading(false);
      }
    } catch (error: unknown) {
      setAuthError(error instanceof Error ? error.message : 'Failed to sign in');
      setAuthLoading(false);
    }
  }, []);

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
    const slug = creatorDetails?.username || creatorId;
    const path = `/creator/${slug}`;
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
      if (navigator.share) {
        await navigator.share({
          title: `Support ${creatorDetails?.display_name || 'this creator'}`,
          url,
        });
      }
    } catch {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  }, [creatorId, creatorDetails?.display_name, creatorDetails?.username]);

  const handleBack = useCallback(() => {
    router.back();
  }, [closeCreatorProfile, isWithinProvider, router, user]);

  // ── Own-profile upload handlers ──
  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwnProfile) return;
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'avatars');
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (uploadData.success) {
        await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo_url: uploadData.url }),
        });
        refreshCreatorDetails();
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [isOwnProfile, refreshCreatorDetails]);

  const handleCoverUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwnProfile) return;
    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'covers');
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (uploadData.success) {
        await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cover_image_url: uploadData.url }),
        });
        refreshCreatorDetails();
      }
    } catch (err) {
      console.error('Cover upload error:', err);
    } finally {
      setIsUploadingCover(false);
    }
  }, [isOwnProfile, refreshCreatorDetails]);

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
      is_public: typeof post.is_public === 'boolean' ? post.is_public : true,
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

  const renderTimelinePosts = useMemo(() => {
    if (recentPosts.length === 0) return [];

    const result: React.ReactNode[] = [];
    let lastDate: string | null = null;

    recentPosts.forEach((post: any, index: number) => {
      const postDate = new Date(post.created_at).toDateString();
      const showDate = postDate !== lastDate;
      lastDate = postDate;

      const isLast = index === recentPosts.length - 1;
      const postId = String(post.id);
      const isHighlighted = highlightedPostId === postId || tempHighlightPostId === postId;

      result.push(
        <div
          key={postId}
          ref={(el) => setPostRef(postId, el)}
          className="relative"
        >
          <div className="hidden sm:flex gap-4">
            <div className="flex flex-col items-center flex-shrink-0 w-12">
              <button
                onClick={() => scrollToPost(postId)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all hover:scale-125 hover:bg-primary cursor-pointer",
                  "bg-border dark:bg-border focus:outline-none focus:ring-2 focus:ring-primary/50",
                )}
                aria-label={`Jump to post from ${new Date(post.created_at).toLocaleDateString()}`}
              />

              {showDate && (
                <span className="mt-1.5 text-[9px] font-medium text-muted-foreground text-center max-w-[4rem] leading-tight">
                  {(() => {
                    const d = new Date(post.created_at);
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    if (d.toDateString() === today.toDateString())
                      return "Today";
                    if (d.toDateString() === yesterday.toDateString())
                      return "Yesterday";
                    return d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  })()}
                </span>
              )}

              {!isLast && (
                <div className="flex-1 min-h-[16px] w-[2px] mt-1.5 bg-border/50" />
              )}
            </div>

            <div className="flex-1 min-w-0 pb-3 sm:pb-4">
              <div
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
                  showAuthor={true}
                  onNavigateToMembership={() => setActiveTab('membership')}
                  creatorSlug={creatorDetails?.username ?? undefined}
                />
              </div>
            </div>
          </div>

          <div className="sm:hidden">
            {showDate && (
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-border/30" />
                <span className="text-[11px] font-medium text-muted-foreground px-3 py-1 bg-card rounded-full border border-border/40 shadow-xs">
                  {(() => {
                    const d = new Date(post.created_at);
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    if (d.toDateString() === today.toDateString())
                      return "Today";
                    if (d.toDateString() === yesterday.toDateString())
                      return "Yesterday";
                    return d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  })()}
                </span>
                <div className="h-px flex-1 bg-border/30" />
              </div>
            )}
            <div className="pb-3">
              <div
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
                  showAuthor={false}
                  onNavigateToMembership={() => setActiveTab('membership')}
                  creatorSlug={creatorDetails?.username ?? undefined}
                />
              </div>
            </div>
          </div>
        </div>,
      );
    });

    return result;
  }, [recentPosts, highlightedPostId, tempHighlightPostId, scrollToPost, setPostRef, transformPost, user?.id, isSupporter, creatorDetails?.username]);

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
                    showAuthor={true}
                    creatorSlug={creatorDetails?.username ?? undefined}
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
            <TimelineFeed>
              {renderTimelinePosts}
            </TimelineFeed>
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
  ], [subscriptionTiers, creatorDetails, handlePayment, paymentLoading, recentPosts, renderTimelinePosts, transformPost, user?.id, isSupporter]);

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
      {/* Profile Header */}
      <div className="relative bg-card overflow-hidden">
        {/* Cover Image */}
        <div className="relative h-36 sm:h-44 md:h-52 overflow-hidden">
          {creatorDetails.cover_image_url ? (
            <Image
              src={creatorDetails.cover_image_url}
              alt="Cover"
              fill
              className="object-cover"
              priority
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-pink-500/20" />
              {/* Decorative circles for default cover */}
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full border border-white/10" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full border border-white/10" />
              <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full border border-white/5" />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />

          {/* Floating buttons on cover */}
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between z-10">
            {!isOwnProfile ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md h-9 w-9 border border-white/10"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            ) : (
              <div /> /* spacer */
            )}

            <div className="flex items-center gap-2">
              {isOwnProfile && (
                <>
                  <label htmlFor="cover-upload-profile" className="cursor-pointer">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white text-xs font-medium backdrop-blur-md border border-white/10 transition-colors">
                      {isUploadingCover ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ImagePlus className="w-3.5 h-3.5" />
                      )}
                      {creatorDetails.cover_image_url ? 'Change Cover' : 'Add Cover'}
                    </div>
                  </label>
                  <input
                    type="file"
                    id="cover-upload-profile"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                    disabled={isUploadingCover}
                  />
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md h-9 w-9 border border-white/10"
              >
                {shareCopied ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Profile info */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-4">
          <div className="relative -mt-12 sm:-mt-14">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="relative inline-block mb-2"
            >
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-[3px] border-background shadow-xl ring-2 ring-background">
                <AvatarImage src={getValidAvatarUrl(creatorDetails.avatar_url)} alt={creatorDetails.display_name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-3xl font-bold">
                  {creatorDetails.display_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <>
                  <label htmlFor="avatar-upload-profile" className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg border-2 border-background z-10">
                    {isUploadingAvatar ? (
                      <Loader2 className="w-3.5 h-3.5 text-primary-foreground animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 text-primary-foreground" />
                    )}
                  </label>
                  <input
                    type="file"
                    id="avatar-upload-profile"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  />
                </>
              )}
              {!isOwnProfile && creatorDetails.is_verified && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="absolute -bottom-0.5 -right-0.5 bg-primary rounded-full p-1.5 shadow-lg border-2 border-background"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </motion.div>

            {/* Name, username, bio */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap mb-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight tracking-tight">
                    {creatorDetails.display_name}
                  </h1>
                  {creatorDetails.category && (
                    <Badge variant="outline" className="px-2 py-0.5 text-[10px] text-primary border-primary/30 bg-primary/5 rounded-full font-medium">
                      {creatorDetails.category}
                    </Badge>
                  )}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2">
                  {isOwnProfile ? (
                    <Button variant="outline" size="sm" asChild className="rounded-full h-9 gap-1.5">
                      <a href="/settings">
                        <Settings className="w-3.5 h-3.5" />
                        Settings
                      </a>
                    </Button>
                  ) : isSupporter ? (
                    <Badge className="gap-1.5 px-3.5 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 text-sm font-medium rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      In the Circle
                    </Badge>
                  ) : (
                    <Button
                      onClick={() => setActiveTab('membership')}
                      className="gap-2 px-5 h-9 text-sm font-semibold shadow-md shadow-primary/15"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Join Circle
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1.5">
                @{creatorDetails.username}
              </p>

              {creatorDetails.bio && (
                <p className="text-[13px] text-muted-foreground/80 max-w-lg mb-3 leading-relaxed">
                  {creatorDetails.bio}
                </p>
              )}

              {/* Stats + CTA / Actions row */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground tabular-nums">{creatorDetails.supporter_count || 0}</span>{' '}
                    <span className="text-xs">supporters</span>
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground tabular-nums">{creatorDetails.posts_count || 0}</span>{' '}
                    <span className="text-xs">posts</span>
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/30 -mx-4 p-4">
            <TabsList className="w-full h-11 bg-muted border-0 shadow-none p-1 gap-0 justify-start overflow-x-auto scrollbar-hide rounded-md">
              <TabsTrigger value="posts" className="data-[state=active]:bg-card data-[state=active]:shadow-none  data-[state=active]:text-primary rounded-sm px-3 sm:px-4 py-2.5 text-[13px] font-medium whitespace-nowrap">
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Posts
              </TabsTrigger>
              {!isOwnProfile && (
              <TabsTrigger value="membership" className="data-[state=active]:bg-card data-[state=active]:shadow-none  data-[state=active]:text-primary rounded-md px-3 sm:px-4 py-2.5 text-[13px] font-medium whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Membership
              </TabsTrigger>
              )}
              <TabsTrigger value="chat" className="data-[state=active]:bg-card data-[state=active]:shadow-none  data-[state=active]:text-primary rounded-md px-3 sm:px-4 py-2.5 text-[13px] font-medium whitespace-nowrap">
                <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="shop" className="data-[state=active]:bg-card data-[state=active]:shadow-none  data-[state=active]:text-primary rounded-md px-3 sm:px-4 py-2.5 text-[13px] font-medium whitespace-nowrap">
                <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                Shop
              </TabsTrigger>
              <TabsTrigger value="about" className="data-[state=active]:bg-card data-[state=active]:shadow-none  data-[state=active]:text-primary rounded-md px-3 sm:px-4 py-2.5 text-[13px] font-medium whitespace-nowrap">
                <Info className="w-3.5 h-3.5 mr-1.5" />
                About
              </TabsTrigger>
            </TabsList>
          </div>

              <TabsContent value="chat" className="mt-3">
                <div className="relative">
                  {isSupporter ? (
                    <Card className="border-border/50 shadow-lg overflow-hidden">
                      <div className="h-[600px]">
                        <StreamCommunitySection creatorId={creatorId} />
                      </div>
                    </Card>
                  ) : (
                    <div className="relative">
                      <Card className="border-border/50 overflow-hidden">
                        <div className="h-[600px] relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                            <div className="absolute inset-0 opacity-20 blur-xl">
                              <div className="p-4 space-y-4">
                                <div className="h-12 bg-foreground/20 rounded" />
                                <div className="h-20 bg-foreground/10 rounded" />
                                <div className="h-16 bg-foreground/10 rounded" />
                                <div className="h-24 bg-foreground/10 rounded" />
                              </div>
                            </div>
                            
                            <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-background/80">
                              <div className="text-center p-8 max-w-md space-y-6">
                                <div className="flex justify-center">
                                  <div className="p-4 bg-background rounded-2xl shadow-xl border border-border">
                                    <MessageCircle className="w-12 h-12 text-primary" />
                                  </div>
                                </div>
                                
                                <div>
                                  <h3 className="text-xl font-bold text-foreground mb-1.5">
                                    This is for the inner circle
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    Join {creatorDetails.display_name}&apos;s circle to chat directly and connect
                                  </p>
                                </div>
                                
                                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-primary" />
                                    <span>Private conversations</span>
                                  </div>
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-primary" />
                                    <span>Circle-only channels</span>
                                  </div>
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-primary" />
                                    <span>Direct access to the creator</span>
                                  </div>
                                </div>
                                
                                <Button 
                                  size="lg" 
                                  className="w-full shadow-lg shadow-primary/20 rounded-full" 
                                  onClick={() => setActiveTab('membership')}
                                >
                                  <span>Join the Circle</span>
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

              <TabsContent value="membership" className="mt-3">
                <div className="max-w-4xl mx-auto">
                  {isOwnProfile ? (
                    <Card className="border-border/50 p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                          <Shield className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">This is your own profile</h3>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            You can&apos;t subscribe to yourself. Visit your settings to manage your membership tiers and pricing.
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild className="rounded-full mt-2 gap-1.5">
                          <a href="/settings">
                            <Settings className="w-3.5 h-3.5" />
                            Manage Tiers
                          </a>
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                      Join {creatorDetails.display_name}&apos;s Circle
                    </h2>
                    <p className="text-muted-foreground text-base max-w-xl mx-auto">
                      {creatorDetails.bio || `Be part of an inner circle of ${creatorDetails.supporter_count || 0} people who get closer access, exclusive content, and a direct line.`}
                    </p>
                    {creatorDetails.supporter_count > 0 && (
                      <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span><span className="font-semibold text-foreground">{creatorDetails.supporter_count}</span> in the circle</span>
                      </div>
                    )}
                  </div>
                  
                  {isSupporter ? (
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
                      </Card>
                      
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
                    </div>
                  ) : (
                    <TierSelection
                      tiers={subscriptionTiers}
                      creatorName={creatorDetails.display_name || ''}
                      currentTierLevel={creatorDetails.supporter_tier_level || 0}
                      onSelectTier={handlePayment}
                      loading={paymentLoading}
                    />
                  )}
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="posts" className="mt-3">
                {isOwnProfile && (
                  <Link href="/create-post" className="block mb-4">
                    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Share something with your circle</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">Create a post, poll, or share media</p>
                      </div>
                    </div>
                  </Link>
                )}
                {recentPosts.length > 0 ? (
                  <>
                    <TimelineFeed
                      emptyMessage="This creator hasn't shared any content yet. Check back soon!"
                      onRefresh={refreshCreatorDetails}
                    >
                      {renderTimelinePosts}
                    </TimelineFeed>
                    {showSupportBanner && <div className="h-24" />}
                  </>
                ) : (
                  <Card className="p-8 sm:p-12 text-center border-dashed border-2 border-border/50">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                        <FileText className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground mb-1">No Posts Yet</h3>
                        <p className="text-muted-foreground">
                          This creator hasn&apos;t shared any content yet. Check back soon!
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="shop" className="mt-3">
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

              <TabsContent value="about" className="mt-3">
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
      </div>

      {pendingPayment && user && (
        <PaymentGatewaySelector
          open={showGatewaySelector}
          onClose={() => {
            setShowGatewaySelector(false);
            setPendingPayment(null);
          }}
          onPaymentSuccess={handlePaymentSuccess} 
          onSelectGateway={handleGatewaySelection}
          amount={pendingPayment.amount}
          tierLevel={pendingPayment.tierLevel}
          creatorId={creatorId}
          creatorName={creatorDetails.display_name}
          supporterId={user.id}
          supporterMessage={pendingPayment.message}
        />
      )}

      <Dialog open={!!showConfirmFreeSupport} onOpenChange={(open) => !open && setShowConfirmFreeSupport(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Join as Supporter (Free)</DialogTitle>
            <DialogDescription>
              You&apos;ll get access to community chat and posts. No payment required.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirmFreeSupport(null)} disabled={paymentLoading}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleConfirmFreeSupport} disabled={paymentLoading}>
              {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      {!isSupporter && !isOwnProfile && activeTab === 'posts' && (
        <SupportBanner
          creatorName={creatorDetails.display_name}
          creatorAvatar={getValidAvatarUrl(creatorDetails.avatar_url) || ''}
          supporterCount={creatorDetails.supporter_count || 0}
          onJoinClick={() => setActiveTab('membership')}
          show={showSupportBanner}
        />
      )}
      
      {paymentSuccess && (
        <PaymentSuccessModal
          open={!!paymentSuccess}
          onClose={() => setPaymentSuccess(null)}
          onViewPosts={() => {
            refreshCreatorDetails();
            setActiveTab('posts');
            setPaymentSuccess(null);
          }}
          onViewChat={() => {
            refreshCreatorDetails();
            setActiveTab('chat');
            setPaymentSuccess(null);
          }}
          transactionUuid={paymentSuccess.transactionUuid}
          totalAmount={paymentSuccess.totalAmount}
          creatorName={creatorDetails?.display_name ?? ''}
        />
      )}

      <Dialog open={showRenewAlreadyActiveDialog} onOpenChange={setShowRenewAlreadyActiveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subscription active</DialogTitle>
            <DialogDescription>
              Your subscription is still active. No need to renew right now.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowRenewAlreadyActiveDialog(false)} className="w-full">
            OK
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}