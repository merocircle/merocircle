'use client';

import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import {
  Crown,
  BarChart3,
  FileText,
  Users,
  Share2,
  Loader2,
  CheckCircle2,
  Plus,
  MessageCircle,
  ExternalLink,
  Pencil,
  Inbox,
  TrendingUp,
  Eye,
  Heart,
  MessageSquare,
  Bell,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useDashboardViewSafe } from '@/contexts/dashboard-context';
import { OnboardingBanner } from '@/components/dashboard/OnboardingBanner';
import { useQueryClient } from '@tanstack/react-query';
import { useCreatorAnalytics, useCreatorDashboardData, usePublishPost, useNotificationsData } from '@/hooks/useQueries';
import {
  StatsCards,
  AnalyticsCharts,
  TopSupporters,
  ToastMessages,
  PostCreationForm,
  RecentPostsList,
  SupportersList,
} from './creator-studio';
import { EditProfilePricingModal } from './EditProfilePricingModal';
import { formatDistanceToNow } from 'date-fns';

// Tab configuration
const tabs = [
  { id: "posts", label: "Posts", icon: FileText },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "supporters", label: "Supporters", icon: Users },
  { id: "inbox", label: "Inbox", icon: Inbox },
];

const CreatorStudioSection = memo(function CreatorStudioSection() {
  const { user, userProfile, creatorProfile } = useAuth();
  const dashboardView = useDashboardViewSafe();
  const { highlightedPostId, setHighlightedPostId } = dashboardView;
  const [activeTab, setActiveTab] = useState('posts');
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showErrorMessage, setShowErrorMessage] = useState<string | null>(null);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showEditProfilePricingModal, setShowEditProfilePricingModal] = useState(false);
  const highlightedPostRef = useRef<HTMLDivElement | null>(null);
  const scrollAttemptedRef = useRef(false);

  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostDescription, setNewPostDescription] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [postVisibility, setPostVisibility] = useState('public');
  const [postType, setPostType] = useState<'post' | 'poll'>('post');
  const [notifyByEmail, setNotifyByEmail] = useState(true);

  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [allowsMultipleAnswers, setAllowsMultipleAnswers] = useState(false);
  const [pollDuration, setPollDuration] = useState<number | null>(null);

  const { data: analyticsData, isLoading: analyticsLoading } = useCreatorAnalytics();
  const { data: dashboardData, isLoading: dashboardLoading } = useCreatorDashboardData();
  const { data: notificationsData } = useNotificationsData();
  const queryClient = useQueryClient();
  const { mutate: publishPost, isPending: isPublishing } = usePublishPost();

  useEffect(() => {
    if (!highlightedPostId || dashboardLoading) {
      scrollAttemptedRef.current = false;
      return;
    }

    scrollAttemptedRef.current = false;

    if (activeTab !== "posts") {
      setActiveTab("posts");
    }

    // Normalize post ID (remove any whitespace, convert to lowercase for comparison)
    const normalizedPostId = String(highlightedPostId).trim().toLowerCase();

    // Function to attempt scrolling
    const attemptScroll = (attempt: number = 1) => {
      // Only scroll if we're on the posts tab
      if (activeTab !== "posts") {
        if (attempt < 5) {
          setTimeout(() => attemptScroll(attempt + 1), 200);
        }
        return;
      }

      // Check if posts are loaded
      const posts = dashboardData?.posts || [];

      const matchingPost = posts.find((p: any) => {
        const postId = String(p.id || "")
          .trim()
          .toLowerCase();
        return postId === normalizedPostId;
      });

      if (!matchingPost && attempt < 10) {
        // Post not found yet, retry after delay
        setTimeout(() => attemptScroll(attempt + 1), 200 * attempt);
        return;
      }

      if (matchingPost && !scrollAttemptedRef.current) {
        scrollAttemptedRef.current = true;

        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (highlightedPostRef.current) {
              highlightedPostRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest",
              });
            } else {
              // Retry once more after a longer delay
              setTimeout(() => {
                if (highlightedPostRef.current) {
                  highlightedPostRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "nearest",
                  });
                }
              }, 500);
            }
          });
        });
      }
    };

    // Start scrolling attempts with increasing delays (wait for tab switch and data load)
    const scrollTimer1 = setTimeout(() => attemptScroll(), 300);
    const scrollTimer2 = setTimeout(() => attemptScroll(), 800);
    const scrollTimer3 = setTimeout(() => attemptScroll(), 1500);
    const scrollTimer4 = setTimeout(() => attemptScroll(), 2500);

    // Clear highlight after 5 seconds
    const clearTimer = setTimeout(() => {
      setHighlightedPostId(null);
      scrollAttemptedRef.current = false;
    }, 5000);

    return () => {
      clearTimeout(scrollTimer1);
      clearTimeout(scrollTimer2);
      clearTimeout(scrollTimer3);
      clearTimeout(scrollTimer4);
      clearTimeout(clearTimer);
    };
  }, [
    highlightedPostId,
    dashboardLoading,
    dashboardData,
    activeTab,
    setHighlightedPostId,
  ]);

  const [shareCopied, setShareCopied] = useState(false);

  const handleShareProfile = useCallback(async () => {
    if (!user?.id || typeof window === "undefined") return;
    // Prefer vanity URL: creator_profiles.vanity_username, else users.username (email prefix), else id
    const slug =
      creatorProfile?.vanity_username?.trim() ||
      userProfile?.username ||
      user.id;
    const path = `/creator/${slug}`;
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
      if (navigator.share) {
        await navigator.share({
          title: `Support ${userProfile?.display_name || "this creator"}`,
          url,
        });
      }
    } catch {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  }, [
    user?.id,
    userProfile?.display_name,
    userProfile?.username,
    creatorProfile?.vanity_username,
  ]);

  useEffect(() => {
    if (dashboardData) {
      const isCompleted = dashboardData.onboardingCompleted || false;
      setOnboardingCompleted(isCompleted);
      setShowOnboardingBanner(!isCompleted);
    }
  }, [dashboardData]);

  const showError = useCallback((message: string) => {
    setShowErrorMessage(message);
    setTimeout(() => setShowErrorMessage(null), 3000);
  }, []);

  const prepareFileForUpload = useCallback(
    async (file: File): Promise<File> => {
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const isHeic =
        fileExt === "heic" ||
        fileExt === "heif" ||
        file.type?.toLowerCase().includes("heic") ||
        file.type?.toLowerCase().includes("heif");

      if (!isHeic) {
        return file;
      }

      try {
        const heic2anyModule = await import("heic2any");
        const heic2any = heic2anyModule.default || heic2anyModule;

        if (!heic2any) {
          throw new Error("heic2any library not available");
        }

        const convertedBlob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.95,
        });

        const jpegBlob = Array.isArray(convertedBlob)
          ? convertedBlob[0]
          : convertedBlob;

        if (!jpegBlob) {
          throw new Error("Conversion returned no blob");
        }

        const typedBlob =
          jpegBlob instanceof Blob
            ? jpegBlob
            : new Blob([jpegBlob], { type: "image/jpeg" });
        const jpegFileName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
        const jpegFile = new File([typedBlob], jpegFileName, {
          type: "image/jpeg",
          lastModified: file.lastModified,
        });

        return jpegFile;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        throw new Error(
          `Failed to convert HEIC image: ${errorMessage}. Please convert it to JPEG or PNG before uploading.`,
        );
      }
    },
    [],
  );

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      if (uploadedImages.length + files.length > 10) {
        showError("Maximum 10 images allowed per post.");
        return;
      }

      const maxSize = 50 * 1024 * 1024;
      const oversizedFiles = Array.from(files).filter(
        (file) => file.size > maxSize,
      );
      if (oversizedFiles.length > 0) {
        showError(`Some files are too large. Maximum file size is 50MB.`);
        return;
      }

      setIsUploadingImage(true);
      try {
        const uploadPromises = Array.from(files).map(async (file) => {
          const fileToUpload = await prepareFileForUpload(file);

          const formData = new FormData();
          formData.append("file", fileToUpload, fileToUpload.name);
          formData.append("folder", "posts");

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const result = await response
              .json()
              .catch(() => ({ error: "Upload failed" }));
            const errorMsg =
              result.error || `Upload failed with status ${response.status}`;
            throw new Error(errorMsg);
          }

          const result = await response.json();
          if (result.success) {
            return result.url;
          } else {
            throw new Error(result.error || "File upload failed.");
          }
        });

        const newUrls = await Promise.all(uploadPromises);
        setUploadedImages((prev) => [...prev, ...newUrls]);
      } catch (error) {
        logger.error("Upload error", "CREATOR_STUDIO_SECTION", { error: error instanceof Error ? error.message : String(error) });
        const errorMessage =
          error instanceof Error ? error.message : "File upload failed.";
        showError(errorMessage);
      } finally {
        setIsUploadingImage(false);
        event.target.value = "";
      }
    },
    [uploadedImages.length, showError, prepareFileForUpload],
  );

  const handlePublishPost = useCallback(() => {
    if (postType === "poll") {
      if (!pollQuestion.trim()) {
        showError("Poll question is required.");
        return;
      }
      const validOptions = pollOptions.filter((opt) => opt.trim());
      if (validOptions.length < 2) {
        showError("Poll must have at least 2 options.");
        return;
      }
    } else {
      if (!newPostTitle.trim()) {
        showError("Title is required.");
        return;
      }
      if (!newPostDescription.trim()) {
        showError("Description is required.");
        return;
      }
    }

    const body: any = {
      title: postType === "poll" ? pollQuestion.trim() : newPostTitle.trim(),
      content:
        postType === "poll" ? pollQuestion.trim() : newPostDescription.trim(),
      image_urls: uploadedImages.length > 0 ? uploadedImages : [],
      is_public: postVisibility === 'public',
      tier_required: postVisibility === 'public' ? 'free' : postVisibility,
      post_type: postType,
      sendNotifications: notifyByEmail,
    };

    if (postType === "poll") {
      const validOptions = pollOptions.filter((opt) => opt.trim());
      body.poll_data = {
        question: pollQuestion.trim(),
        options: validOptions,
        allows_multiple_answers: allowsMultipleAnswers,
        expires_at: pollDuration
          ? new Date(
              Date.now() + pollDuration * 24 * 60 * 60 * 1000,
            ).toISOString()
          : null,
      };
    }

    publishPost(body, {
      onSuccess: (createdPost: any) => {
        // Reset form state
        setNewPostTitle('');
        setNewPostDescription('');
        setUploadedImages([]);
        setPollQuestion("");
        setPollOptions(["", ""]);
        setAllowsMultipleAnswers(false);
        setPollDuration(null);
        setPostVisibility('public');
        setNotifyByEmail(true);
        setShowCreatePostModal(false);

        setSuccessMessage('Post published!');
        setTimeout(() => setSuccessMessage(null), 3000);

        // Ensure we're on the posts tab, then scroll to the new post
        setActiveTab('posts');
        // Reset scroll state so the effect can trigger
        scrollAttemptedRef.current = false;
        // Set the highlighted post ID after a brief delay to allow tab switch
        setTimeout(() => {
          setHighlightedPostId(createdPost?.id);
        }, 100);
      },
      onError: (error: any) => {
        showError(error.message || "Failed to publish.");
      },
    });
  }, [postType, newPostTitle, newPostDescription, uploadedImages, postVisibility, pollQuestion, pollOptions, allowsMultipleAnswers, pollDuration, notifyByEmail, publishPost, showError]);

  const handlePostTypeChange = useCallback((type: 'post' | 'poll') => {
    setPostType(type);
    if (type === "poll") {
      setNewPostTitle("");
      setNewPostDescription("");
    } else {
      setPollQuestion("");
      setPollOptions(["", ""]);
    }
  }, []);

  const addPollOption = useCallback(() => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, ""]);
    }
  }, [pollOptions]);

  const removePollOption = useCallback(
    (index: number) => {
      if (pollOptions.length > 2) {
        setPollOptions(pollOptions.filter((_, i) => i !== index));
      }
    },
    [pollOptions],
  );

  const updatePollOption = useCallback(
    (index: number, value: string) => {
      const updated = [...pollOptions];
      updated[index] = value;
      setPollOptions(updated);
    },
    [pollOptions],
  );

  const stats = useMemo(
    () =>
      analyticsData?.stats || {
        totalEarnings: 0,
        supporters: 0,
        posts: 0,
        likes: 0,
        currentMonthEarnings: 0,
        earningsGrowth: 0,
      },
    [analyticsData],
  );

  if (analyticsLoading || dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const creatorSlug = creatorProfile?.vanity_username?.trim() || userProfile?.username || user?.id;

  return (
    <div className="py-4 sm:py-6 px-3 sm:px-4 md:px-6 max-w-7xl mx-auto h-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                Creator Studio
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Welcome back, {userProfile?.display_name}
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            <Button
              variant="default"
              size="sm"
              className="gap-1.5 rounded-lg h-10 min-w-[44px] text-xs sm:h-10 sm:text-sm sm:min-w-[80px]"
              asChild
            >
              <Link href="/create-post">
                <Plus className="w-3.5 h-3.5" />
                <span className="inline">Create Post</span>
              </Link>
            </Button>
            <Button
              variant={shareCopied ? "default" : "outline"}
              size="sm"
              className="gap-1.5 rounded-lg h-10 min-w-[44px] text-xs sm:h-10 sm:text-sm sm:min-w-[80px] shrink-0"
              onClick={handleShareProfile}
            >
              {shareCopied ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{shareCopied ? 'Copied!' : 'Share'}</span>
              <span className="sm:hidden">{shareCopied ? '✓' : 'Share'}</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5 rounded-lg h-10 min-w-[44px] text-xs sm:h-10 sm:text-sm sm:min-w-[80px] shrink-0" 
              asChild
            >
              <a href={`/creator/${creatorSlug}`}>
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">View</span>
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg h-10 min-w-[44px] text-xs sm:h-10 sm:text-sm sm:min-w-[80px] shrink-0"
              onClick={() => setShowEditProfilePricingModal(true)}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5 rounded-lg h-10 min-w-[44px] text-xs sm:h-10 sm:text-sm sm:min-w-[80px] shrink-0" 
              asChild
            >
              <Link href="/chat">
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chat</span>
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>

      <EditProfilePricingModal
        open={showEditProfilePricingModal}
        onOpenChange={setShowEditProfilePricingModal}
        profile={{
          ...(dashboardData?.profile ?? { bio: null, category: null, social_links: {}, vanity_username: null }),
          display_name: user?.display_name ?? dashboardData?.profile?.display_name ?? null,
        }}
        tiers={dashboardData?.tiers ?? []}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['creator', 'dashboard', user?.id] });
          setSuccessMessage('Profile & pricing updated!');
          setTimeout(() => setSuccessMessage(null), 3000);
        }}
      />

      {showOnboardingBanner && user && (
        <div className="mb-5">
          <OnboardingBanner
            creatorId={user.id}
            onDismiss={() => {
              setShowOnboardingBanner(false);
              setOnboardingCompleted(true);
            }}
          />
        </div>
      )}

      <ToastMessages
        showSuccess={!!successMessage}
        successMessage={successMessage ?? undefined}
        showError={!!showErrorMessage}
        errorMessage={showErrorMessage}
      />

      {/* Tab Navigation */}
      <div className="mb-5">
        <div className="flex gap-1 p-0.5 bg-muted/40 rounded-lg border border-border/30 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActiveTab = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap',
                  isActiveTab
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.id === 'inbox' && notificationsData?.unreadCount > 0 && (
                  <span className="ml-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1">
                    {notificationsData.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <motion.div
            key="posts"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Quick Stats Row */}
            <div className="flex items-center gap-4 mb-5 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span className="font-medium text-foreground">{stats.posts}</span> posts
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Heart className="w-4 h-4" />
                <span className="font-medium text-foreground">{stats.likes}</span> likes
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span className="font-medium text-foreground">{stats.supporters}</span> supporters
              </div>
            </div>

            {/* Create Post CTA */}
            <Link href="/create-post" className="block mb-5">
              <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Share something with your circle</p>
                  <p className="text-xs text-muted-foreground">Create a post, poll, or share media</p>
                </div>
              </div>
            </Link>

            <RecentPostsList
              posts={dashboardData?.posts || []}
              highlightedPostId={highlightedPostId}
              currentUserId={user?.id}
              onboardingCompleted={onboardingCompleted}
              highlightedPostRef={highlightedPostRef}
              creatorSlug={creatorSlug || undefined}
            />
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Stats Cards */}
            <StatsCards stats={stats} />

            {/* Charts & Top Supporters */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-5">
                <AnalyticsCharts
                  earningsData={analyticsData?.charts.earnings}
                  supporterFlowData={analyticsData?.charts.supporterFlow}
                />
              </div>
              <div className="space-y-5">
                <TopSupporters supporters={analyticsData?.topSupporters || []} />
              </div>
            </div>

            {/* Engagement breakdown */}
            {analyticsData?.charts?.engagement && (
              <div className="rounded-xl border border-border/40 bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Engagement (Last 30 Days)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(() => {
                    const engagementData = analyticsData.charts.engagement || [];
                    const totalLikes = engagementData.reduce((sum: number, d: any) => sum + (d.likes || 0), 0);
                    const totalComments = engagementData.reduce((sum: number, d: any) => sum + (d.comments || 0), 0);
                    return (
                      <>
                        <div className="text-center p-3 rounded-lg bg-muted/30">
                          <p className="text-2xl font-bold text-foreground">{totalLikes + totalComments}</p>
                          <p className="text-xs text-muted-foreground mt-1">Total interactions</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/30">
                          <p className="text-2xl font-bold text-rose-500">{totalLikes}</p>
                          <p className="text-xs text-muted-foreground mt-1">Likes</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/30">
                          <p className="text-2xl font-bold text-blue-500">{totalComments}</p>
                          <p className="text-xs text-muted-foreground mt-1">Comments</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/30">
                          <p className="text-2xl font-bold text-foreground">
                            {engagementData.length > 0 ? Math.round((totalLikes + totalComments) / engagementData.length) : 0}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Daily average</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Supporters Tab */}
        {activeTab === 'supporters' && (
          <motion.div
            key="supporters"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <SupportersList
              supporters={dashboardData?.supporters || []}
              totalCount={stats.supporters}
            />
          </motion.div>
        )}

        {/* Inbox Tab */}
        {activeTab === 'inbox' && (
          <motion.div
            key="inbox"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Recent Notifications */}
            <div className="rounded-xl border border-border/40 bg-card">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Recent Activity
                </h3>
                <Link href="/notifications" className="text-xs text-primary hover:underline">
                  View all
                </Link>
              </div>
              <div className="divide-y divide-border/30">
                {notificationsData?.notifications?.length > 0 ? (
                  notificationsData.notifications.slice(0, 8).map((notif: any) => (
                    <div key={notif.id} className={cn(
                      "px-5 py-3 flex items-start gap-3 text-sm",
                      !notif.read && "bg-primary/5"
                    )}>
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        !notif.read ? "bg-primary" : "bg-transparent"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground line-clamp-2">
                          <span className="font-medium">{notif.actor?.display_name || 'Someone'}</span>{' '}
                          {notif.type === 'like' && 'liked your post'}
                          {notif.type === 'comment' && 'commented on your post'}
                          {notif.type === 'follow' && 'started following you'}
                          {notif.type === 'payment' && 'joined your circle'}
                          {notif.type === 'mention' && 'mentioned you'}
                          {!['like', 'comment', 'follow', 'payment', 'mention'].includes(notif.type) && notif.type}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No recent activity
                  </div>
                )}
              </div>
            </div>

            {/* Quick Chat Access */}
            <div className="rounded-xl border border-border/40 bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <MessageCircle className="w-4 h-4 text-primary" />
                Messages
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Chat with your supporters and manage community conversations.
              </p>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-lg" asChild>
                <Link href="/chat">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Open Chat
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Post Modal */}
      <Dialog open={showCreatePostModal} onOpenChange={setShowCreatePostModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-3">
            <DialogTitle className="text-lg">Create New Post</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            <PostCreationForm
              postType={postType}
              postTitle={newPostTitle}
              postDescription={newPostDescription}
              uploadedImages={uploadedImages}
              isUploadingImage={isUploadingImage}
              postVisibility={postVisibility}
              pollQuestion={pollQuestion}
              pollOptions={pollOptions}
              onboardingCompleted={onboardingCompleted}
              isPublishing={isPublishing}
              notifyByEmail={notifyByEmail}
              onPostTypeChange={handlePostTypeChange}
              onTitleChange={setNewPostTitle}
              onDescriptionChange={setNewPostDescription}
              onVisibilityChange={setPostVisibility}
              onPollQuestionChange={setPollQuestion}
              onPollOptionChange={updatePollOption}
              onAddPollOption={addPollOption}
              onRemovePollOption={removePollOption}
              onImageUpload={handleImageUpload}
              onRemoveImage={(index) =>
                setUploadedImages((prev) => prev.filter((_, i) => i !== index))
              }
              onPublish={handlePublishPost}
              onNotifyByEmailChange={setNotifyByEmail}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default CreatorStudioSection;
