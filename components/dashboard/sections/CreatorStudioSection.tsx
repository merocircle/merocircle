'use client';

import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Crown,
  BarChart3,
  FileText,
  Users,
  Share2,
  Loader2,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import { useDashboardViewSafe } from '@/contexts/dashboard-context';
import { OnboardingBanner } from '@/components/dashboard/OnboardingBanner';
import { useCreatorAnalytics, useCreatorDashboardData, usePublishPost } from '@/hooks/useQueries';
import {
  StatsCards,
  AnalyticsCharts,
  TopSupporters,
  ToastMessages,
  PostCreationForm,
  RecentPostsList,
  SupportersList,
} from './creator-studio';

// Tab configuration
const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'supporters', label: 'Supporters', icon: Users }
];

const CreatorStudioSection = memo(function CreatorStudioSection() {
  const { user, userProfile } = useAuth();
  const { highlightedPostId, setHighlightedPostId } = useDashboardViewSafe();
  const [activeTab, setActiveTab] = useState('overview');
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState<string | null>(null);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const highlightedPostRef = useRef<HTMLDivElement | null>(null);
  const scrollAttemptedRef = useRef(false);

  const [newPostContent, setNewPostContent] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [postVisibility, setPostVisibility] = useState('public');
  const [postType, setPostType] = useState<'post' | 'poll'>('post');

  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [allowsMultipleAnswers, setAllowsMultipleAnswers] = useState(false);
  const [pollDuration, setPollDuration] = useState<number | null>(null);

  const { data: analyticsData, isLoading: analyticsLoading } = useCreatorAnalytics();
  const { data: dashboardData, isLoading: dashboardLoading } = useCreatorDashboardData();
  const { mutate: publishPost, isPending: isPublishing } = usePublishPost();

  useEffect(() => {
    if (!highlightedPostId || dashboardLoading) {
      scrollAttemptedRef.current = false;
      return;
    }

    scrollAttemptedRef.current = false;

    if (activeTab !== 'overview') {
      setActiveTab('overview');
    }

    // Normalize post ID (remove any whitespace, convert to lowercase for comparison)
    const normalizedPostId = String(highlightedPostId).trim().toLowerCase();

    // Function to attempt scrolling
    const attemptScroll = (attempt: number = 1) => {
      // Only scroll if we're on the overview tab
      if (activeTab !== 'overview') {
        if (attempt < 5) {
          setTimeout(() => attemptScroll(attempt + 1), 200);
        }
        return;
      }

      // Check if posts are loaded
      const posts = dashboardData?.posts || [];

      const matchingPost = posts.find((p: any) => {
        const postId = String(p.id || '').trim().toLowerCase();
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
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
              });
            } else {
              // Retry once more after a longer delay
              setTimeout(() => {
                if (highlightedPostRef.current) {
                  highlightedPostRef.current.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
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
  }, [highlightedPostId, dashboardLoading, dashboardData, activeTab, setHighlightedPostId]);

  const [shareCopied, setShareCopied] = useState(false);

  const handleShareProfile = useCallback(async () => {
    if (!user?.id || typeof window === 'undefined') return;
    // Use creator ID instead of username slug to avoid conflicts with duplicate names
    const url = `${window.location.origin}/creator/${user.id}`;
    try {
      // Always copy to clipboard
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
      
      // Also try native share if available
      if (navigator.share) {
        await navigator.share({
          title: `Support ${userProfile?.display_name || 'this creator'}`,
          url
        });
      }
    } catch {
      // Ignore share errors, but still show copied state
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  }, [user?.id, userProfile?.display_name]);

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

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 10) {
      showError('Maximum 10 images allowed per post.');
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'posts');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (result.success) {
          return result.url;
        } else {
          throw new Error(result.error || 'File upload failed.');
        }
      });

      const newUrls = await Promise.all(uploadPromises);
      setUploadedImages(prev => [...prev, ...newUrls]);
    } catch (error) {
      console.error('Upload error:', error);
      showError('File upload failed.');
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  }, [uploadedImages.length, showError]);

  const handlePublishPost = useCallback(() => {
    if (postType === 'poll') {
      if (!pollQuestion.trim()) {
        showError('Poll question is required.');
        return;
      }
      const validOptions = pollOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        showError('Poll must have at least 2 options.');
        return;
      }
    } else {
      if (!newPostContent.trim()) {
        showError('Caption is required.');
        return;
      }
    }

    const body: any = {
      title: postType === 'poll' ? pollQuestion.trim() : newPostContent.trim().slice(0, 100),
      content: postType === 'poll' ? pollQuestion.trim() : newPostContent.trim(),
      image_urls: uploadedImages.length > 0 ? uploadedImages : [],
      is_public: postVisibility === 'public',
      tier_required: postVisibility === 'public' ? 'free' : postVisibility,
      post_type: postType
    };

    if (postType === 'poll') {
      const validOptions = pollOptions.filter(opt => opt.trim());
      body.poll_data = {
        question: pollQuestion.trim(),
        options: validOptions,
        allows_multiple_answers: allowsMultipleAnswers,
        expires_at: pollDuration ? new Date(Date.now() + pollDuration * 24 * 60 * 60 * 1000).toISOString() : null
      };
    }

    publishPost(body, {
      onSuccess: () => {
        setNewPostContent('');
        setUploadedImages([]);
        setPollQuestion('');
        setPollOptions(['', '']);
        setAllowsMultipleAnswers(false);
        setPollDuration(null);
        setPostVisibility('public');
        setShowCreatePostModal(false);

        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      },
      onError: (error: any) => {
        showError(error.message || 'Failed to publish.');
      }
    });
  }, [postType, newPostContent, uploadedImages, postVisibility, pollQuestion, pollOptions, allowsMultipleAnswers, pollDuration, publishPost, showError]);

  const handlePostTypeChange = useCallback((type: 'post' | 'poll') => {
    setPostType(type);
    if (type === 'poll') {
      setNewPostContent('');
    } else {
      setPollQuestion('');
      setPollOptions(['', '']);
    }
  }, []);

  const addPollOption = useCallback(() => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, '']);
    }
  }, [pollOptions]);

  const removePollOption = useCallback((index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  }, [pollOptions]);

  const updatePollOption = useCallback((index: number, value: string) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  }, [pollOptions]);

  const stats = useMemo(() => analyticsData?.stats || {
    totalEarnings: 0,
    supporters: 0,
    posts: 0,
    likes: 0,
    currentMonthEarnings: 0,
    earningsGrowth: 0
  }, [analyticsData]);

  if (analyticsLoading || dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="py-6 px-4 md:px-6 max-w-7xl mx-auto overflow-y-auto h-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-orange-500/25">
            <Crown className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Creator Studio
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Welcome back, {userProfile?.display_name}!
            </p>
          </div>
        </div>
      </motion.div>

      {/* Modern Tab Navigation */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 p-1.5 bg-muted/50 rounded-2xl w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        {user?.id && (
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              className="gap-2 rounded-xl"
              onClick={() => setShowCreatePostModal(true)}
            >
              <Plus className="w-4 h-4" />
              Create Post
            </Button>
            <Button
              variant={shareCopied ? "default" : "outline"}
              className="gap-2 rounded-xl"
              onClick={handleShareProfile}
            >
              {shareCopied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Share your profile
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {showOnboardingBanner && user && (
              <OnboardingBanner
                creatorId={user.id}
                onDismiss={() => {
                  setShowOnboardingBanner(false);
                  setOnboardingCompleted(true);
                }}
              />
            )}

            <ToastMessages
              showSuccess={showSuccessMessage}
              showError={!!showErrorMessage}
              errorMessage={showErrorMessage}
            />

            <StatsCards stats={stats} />
            <AnalyticsCharts
              earningsData={analyticsData?.charts.earnings}
              supporterFlowData={analyticsData?.charts.supporterFlow}
            />
            <TopSupporters supporters={analyticsData?.topSupporters || []} />

            {/* Posts Section */}
            <div className="pt-6 border-t border-border/50">
              <RecentPostsList
                posts={dashboardData?.posts || []}
                highlightedPostId={highlightedPostId}
                currentUserId={user?.id}
                onboardingCompleted={onboardingCompleted}
                highlightedPostRef={highlightedPostRef}
              />
            </div>
          </motion.div>
        )}

        {/* Supporters Tab */}
        {activeTab === 'supporters' && (
          <motion.div
            key="supporters"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <SupportersList
              supporters={dashboardData?.supporters || []}
              totalCount={stats.supporters}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Post Modal */}
      <Dialog open={showCreatePostModal} onOpenChange={setShowCreatePostModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            <PostCreationForm
              postType={postType}
              newPostContent={newPostContent}
              uploadedImages={uploadedImages}
              isUploadingImage={isUploadingImage}
              postVisibility={postVisibility}
              pollQuestion={pollQuestion}
              pollOptions={pollOptions}
              onboardingCompleted={onboardingCompleted}
              isPublishing={isPublishing}
              onPostTypeChange={handlePostTypeChange}
              onContentChange={setNewPostContent}
              onVisibilityChange={setPostVisibility}
              onPollQuestionChange={setPollQuestion}
              onPollOptionChange={updatePollOption}
              onAddPollOption={addPollOption}
              onRemovePollOption={removePollOption}
              onImageUpload={handleImageUpload}
              onRemoveImage={(index) => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
              onPublish={handlePublishPost}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default CreatorStudioSection;
