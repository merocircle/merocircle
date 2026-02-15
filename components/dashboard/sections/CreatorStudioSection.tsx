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
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
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
  const { user, userProfile, creatorProfile } = useAuth();
  const dashboardView = useDashboardViewSafe();
  const { highlightedPostId, setHighlightedPostId } = dashboardView;
  const [activeTab, setActiveTab] = useState('overview');
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState<string | null>(null);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const highlightedPostRef = useRef<HTMLDivElement | null>(null);
  const scrollAttemptedRef = useRef(false);

  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostDescription, setNewPostDescription] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [postVisibility, setPostVisibility] = useState('public');
  const [postType, setPostType] = useState<'post' | 'poll'>('post');
  const [notifyByEmail, setNotifyByEmail] = useState(true);

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
    // Prefer vanity URL: creator_profiles.vanity_username, else users.username (email prefix), else id
    const slug = creatorProfile?.vanity_username?.trim() || userProfile?.username || user.id;
    const path = `/creator/${slug}`;
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
      if (navigator.share) {
        await navigator.share({
          title: `Support ${userProfile?.display_name || 'this creator'}`,
          url,
        });
      }
    } catch {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  }, [user?.id, userProfile?.display_name, userProfile?.username, creatorProfile?.vanity_username]);

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

  const prepareFileForUpload = useCallback(async (file: File): Promise<File> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const isHeic = fileExt === 'heic' || fileExt === 'heif' || 
                   file.type?.toLowerCase().includes('heic') || 
                   file.type?.toLowerCase().includes('heif');
    
    if (!isHeic) {
      return file;
    }

    try {
      const heic2anyModule = await import('heic2any');
      const heic2any = heic2anyModule.default || heic2anyModule;
      
      if (!heic2any) {
        throw new Error('heic2any library not available');
      }
      
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.95,
      });

      const jpegBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      
      if (!jpegBlob) {
        throw new Error('Conversion returned no blob');
      }
      
      const typedBlob = jpegBlob instanceof Blob ? jpegBlob : new Blob([jpegBlob], { type: 'image/jpeg' });
      const jpegFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
      const jpegFile = new File([typedBlob], jpegFileName, {
        type: 'image/jpeg',
        lastModified: file.lastModified,
      });
      
      return jpegFile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to convert HEIC image: ${errorMessage}. Please convert it to JPEG or PNG before uploading.`);
    }
  }, []);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 10) {
      showError('Maximum 10 images allowed per post.');
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    const oversizedFiles = Array.from(files).filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      showError(`Some files are too large. Maximum file size is 50MB.`);
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileToUpload = await prepareFileForUpload(file);
        
        const formData = new FormData();
        formData.append('file', fileToUpload, fileToUpload.name);
        formData.append('folder', 'posts');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({ error: 'Upload failed' }));
          const errorMsg = result.error || `Upload failed with status ${response.status}`;
          throw new Error(errorMsg);
        }

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
      const errorMessage = error instanceof Error ? error.message : 'File upload failed.';
      showError(errorMessage);
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  }, [uploadedImages.length, showError, prepareFileForUpload]);

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
      if (!newPostTitle.trim()) {
        showError('Title is required.');
        return;
      }
      if (!newPostDescription.trim()) {
        showError('Description is required.');
        return;
      }
    }

    const body: any = {
      title: postType === 'poll' ? pollQuestion.trim() : newPostTitle.trim(),
      content: postType === 'poll' ? pollQuestion.trim() : newPostDescription.trim(),
      image_urls: uploadedImages.length > 0 ? uploadedImages : [],
      is_public: postVisibility === 'public',
      tier_required: postVisibility === 'public' ? 'free' : postVisibility,
      post_type: postType,
      sendNotifications: notifyByEmail,
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
      onSuccess: (createdPost: any) => {
        // Reset form state
        setNewPostTitle('');
        setNewPostDescription('');
        setUploadedImages([]);
        setPollQuestion('');
        setPollOptions(['', '']);
        setAllowsMultipleAnswers(false);
        setPollDuration(null);
        setPostVisibility('public');
        setNotifyByEmail(true);
        setShowCreatePostModal(false);

        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);

        // Ensure we're on the overview tab, then scroll to the new post
        setActiveTab('overview');
        // Reset scroll state so the effect can trigger
        scrollAttemptedRef.current = false;
        // Set the highlighted post ID after a brief delay to allow tab switch
        setTimeout(() => {
          setHighlightedPostId(createdPost?.id);
        }, 100);
      },
      onError: (error: any) => {
        showError(error.message || 'Failed to publish.');
      }
    });
  }, [postType, newPostTitle, newPostDescription, uploadedImages, postVisibility, pollQuestion, pollOptions, allowsMultipleAnswers, pollDuration, notifyByEmail, publishPost, showError]);

  const handlePostTypeChange = useCallback((type: 'post' | 'poll') => {
    setPostType(type);
    if (type === 'poll') {
      setNewPostTitle('');
      setNewPostDescription('');
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

  const creatorSlug = creatorProfile?.vanity_username?.trim() || userProfile?.username || user?.id;

  return (
    <div className="py-4 sm:py-6 px-3 sm:px-4 md:px-6 max-w-7xl mx-auto overflow-y-auto h-full">
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
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Button
              size="sm"
              className="gap-1.5 rounded-lg h-8 text-xs sm:h-9 sm:text-sm shadow-sm shadow-primary/10 flex-shrink-0"
              onClick={() => setShowCreatePostModal(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              New Post
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-lg h-8 text-xs sm:h-9 sm:text-sm flex-shrink-0" asChild>
              <a href="/chat">
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chat</span>
              </a>
            </Button>
            <Button
              variant={shareCopied ? "default" : "outline"}
              size="sm"
              className="gap-1.5 rounded-lg h-8 text-xs sm:h-9 sm:text-sm flex-shrink-0"
              onClick={handleShareProfile}
            >
              {shareCopied ? (
                <><CheckCircle2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Copied!</span></>
              ) : (
                <><Share2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Share</span></>
              )}
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 rounded-lg h-8 text-xs sm:h-9 sm:text-sm flex-shrink-0" asChild>
              <a href={`/creator/${creatorSlug}`}>
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">View Profile</span>
              </a>
            </Button>
          </div>
        </div>
      </motion.div>

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
        showSuccess={showSuccessMessage}
        showError={!!showErrorMessage}
        errorMessage={showErrorMessage}
      />

      {/* Stats Cards */}
      <div className="mb-5">
        <StatsCards stats={stats} />
      </div>

      {/* Main Content: Two-column on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column - Charts & Analytics (wider) */}
        <div className="lg:col-span-2 space-y-5">
          <AnalyticsCharts
            earningsData={analyticsData?.charts.earnings}
            supporterFlowData={analyticsData?.charts.supporterFlow}
          />
        </div>

        {/* Right Column - Top Supporters */}
        <div className="space-y-5">
          <TopSupporters supporters={analyticsData?.topSupporters || []} />
        </div>
      </div>

      {/* Tab navigation for Posts / Supporters */}
      <div className="mt-6 border-t border-border/40 pt-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 p-0.5 bg-muted/40 rounded-lg border border-border/30">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActiveTab = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all',
                    isActiveTab
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
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
        </AnimatePresence>
      </div>

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
              onRemoveImage={(index) => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
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
