'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  BarChart2,
  Globe,
  Lock,
  Plus,
  X,
  Image as ImageIcon,
  ArrowUpRight,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Clock,
  UsersRound,
  BarChart3,
  Circle,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { usePublishPost, useCreatorDashboardData } from '@/hooks/useQueries';
import { formatDistanceToNow } from 'date-fns';
import { PageLayout } from '@/components/common/PageLayout';

// Preview Post Component - 1:1 match with EnhancedPostCard
interface PreviewPostProps {
  title: string;
  content: string;
  images: string[];
  visibility: string;
  userProfile: any;
  postType: 'post' | 'poll';
  pollQuestion: string;
  pollOptions: string[];
}

function PreviewPost({
  title,
  content,
  images,
  visibility,
  userProfile,
  postType,
  pollQuestion,
  pollOptions,
}: PreviewPostProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllPollOptions, setShowAllPollOptions] = useState(false);

  const isSupportersOnly = visibility === 'supporters';
  const validPollOptions = pollOptions.filter((opt) => opt.trim());
  const displayPollOptions = showAllPollOptions
    ? validPollOptions
    : validPollOptions.slice(0, 5);
  const hasMorePollOptions = validPollOptions.length > 5;

  return (
    <div className="sticky top-4 w-full min-w-0 max-w-full overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-muted-foreground shrink-0" />
        <h3 className="text-sm font-medium text-muted-foreground">Live Preview</h3>
      </div>

      <div
        className={cn(
          'rounded-md transition-all duration-300 w-full min-w-0 max-w-full',
          isSupportersOnly &&
            'p-[3px] bg-gradient-to-br from-orange-400 via-red-400 to-red-500 shadow-[0_0_16px_rgba(234,88,12,0.22),0_0_40px_rgba(234,88,12,0.12),0_0_72px_rgba(234,88,12,0.06)]'
        )}
      >
        <div
          className={cn(
            'bg-card overflow-hidden transition-all duration-300 relative w-full min-w-0',
            isSupportersOnly ? 'rounded-[10px]' : 'rounded-md border border-border/50 hover:border-border/80'
          )}
        >
          {/* Supporters only badge – top right */}
          {isSupportersOnly && (
            <div className="absolute top-3 right-3 z-10">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold',
                  'border-2 border-orange-400/60 dark:border-orange-500/50',
                  'bg-gradient-to-r from-orange-400/15 via-red-400/10 to-red-500/15',
                  'text-orange-800 dark:text-orange-200',
                  'shadow-[0_0_12px_rgba(234,88,12,0.15)]'
                )}
              >
                <UsersRound className="w-3.5 h-3.5" />
                Supporters only
              </span>
            </div>
          )}

          {/* Author Header */}
          <div className="px-4 sm:px-5 pt-4 sm:pt-5">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={userProfile?.photo_url || undefined}
                  alt={userProfile?.display_name || 'Creator'}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {(userProfile?.display_name || 'C').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {userProfile?.display_name || 'Your Name'}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Just now
                  </span>
                </div>
              </div>
            </div>
          </div>


          {/* Images - Always show in preview so creator can see how it looks */}
          {postType !== 'poll' && images.length > 0 && (
            <div className="px-4 sm:px-5 pt-4">
              <div className="relative w-full bg-muted/30 select-none cursor-pointer rounded-lg overflow-hidden">
                <div className="relative w-full aspect-[16/10] sm:aspect-[16/9]">
                  <img
                    src={images[currentImageIndex]}
                    alt={`Preview - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {images.length > 1 && (
                  <div>
                    {currentImageIndex > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((i) => i - 1);
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-card/80 hover:bg-card text-foreground shadow-lg transition-all z-10 backdrop-blur-sm rounded-sm"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}
                    {currentImageIndex < images.length - 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((i) => i + 1);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-card/80 hover:bg-card text-foreground shadow-lg transition-all z-10 backdrop-blur-sm rounded-sm"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-4 sm:p-5 pt-4">
            {postType === 'post' && title && (
              <h2 className="text-lg sm:text-xl font-bold text-foreground leading-tight mb-3">
                {title}
              </h2>
            )}

            {/* Poll Preview - 1:1 match with PollCard */}
            {postType === 'poll' && (
              <div className="mb-3">
                <div className="p-5 rounded-md border border-border/50 bg-card">
                  {/* Poll Question */}
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-foreground mb-1.5">
                      {pollQuestion || 'Poll Question'}
                    </h3>
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap">
                      <span className="font-medium">0 votes</span>
                    </div>
                  </div>

                  {/* Poll Options */}
                  <div className="space-y-2">
                    {validPollOptions.length > 0 ? (
                      <>
                        {displayPollOptions.map((option, index) => (
                          <div
                            key={index}
                            className="w-full p-3 rounded-lg border border-border/50 bg-background flex items-center gap-2.5"
                          >
                            <Circle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                            <span className="text-sm font-medium">{option}</span>
                          </div>
                        ))}
                        {hasMorePollOptions && (
                          <button
                            onClick={() => setShowAllPollOptions(!showAllPollOptions)}
                            className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors rounded-lg hover:bg-primary/5"
                          >
                            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showAllPollOptions && "rotate-180")} />
                            {showAllPollOptions ? 'Show less' : `Show ${validPollOptions.length - 5} more`}
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-full p-3 rounded-lg border border-border/50 bg-background flex items-center gap-2.5">
                          <Circle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                          <span className="text-sm font-medium text-muted-foreground">Option 1</span>
                        </div>
                        <div className="w-full p-3 rounded-lg border border-border/50 bg-background flex items-center gap-2.5">
                          <Circle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                          <span className="text-sm font-medium text-muted-foreground">Option 2</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Creator message */}
                  <p className="mt-3 text-xs text-center text-muted-foreground">
                    You cannot vote in your own poll
                  </p>
                </div>
              </div>
            )}
            {postType !== 'poll' && content && (
              <div className="min-w-0 overflow-hidden">
                <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-[15px] break-words">
                  {content.length > 300 ? content.slice(0, 300) + '...' : content}
                </p>
                {content.length > 300 && (
                  <span className="text-sm text-primary font-medium mt-2 inline-block">
                    Show more
                  </span>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div
              className="flex items-center justify-between pt-3 border-t border-border/30"
            >
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-rose-500 transition-colors">
                  <Heart className="w-4 h-4" />
                  <span>Like</span>
                </button>

                <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span>Comment</span>
                </button>
              </div>

              {/* Post Type Badge */}
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
                  postType === 'poll'
                    ? 'text-violet-500 bg-violet-50 dark:bg-violet-950/30'
                    : images.length > 0
                      ? 'text-primary bg-primary/20'
                      : 'text-muted-foreground bg-muted/50'
                )}
              >
                {postType === 'poll' ? (
                  <BarChart3 className="w-3.5 h-3.5" />
                ) : images.length > 0 ? (
                  <ImageIcon className="w-3.5 h-3.5" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>
                  {postType === 'poll' ? 'Poll' : images.length > 0 ? 'Photo' : 'Post'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!title && !content && images.length === 0 && postType === 'post' && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Start typing to see preview</p>
        </div>
      )}
      {postType === 'poll' && !pollQuestion && validPollOptions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Add poll details to see preview</p>
        </div>
      )}
    </div>
  );
}

export default function CreatePostPage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { data: dashboardData } = useCreatorDashboardData();
  const { mutate: publishPost, isPending: isPublishing } = usePublishPost();

  const [postType, setPostType] = useState<'post' | 'poll'>('post');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const [showPreview, setShowPreview] = useState(true);

  // Poll states
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onboardingCompleted = dashboardData?.onboardingCompleted ?? false;

  const showError = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), 3000);
  }, []);

  const prepareFileForUpload = useCallback(async (file: File): Promise<File> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const isHeic =
      fileExt === 'heic' ||
      fileExt === 'heif' ||
      file.type?.toLowerCase().includes('heic') ||
      file.type?.toLowerCase().includes('heif');

    if (!isHeic) return file;

    try {
      const heic2anyModule = await import('heic2any');
      const heic2any = heic2anyModule.default || heic2anyModule;
      if (!heic2any) throw new Error('heic2any library not available');

      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.95,
      });

      const jpegBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      if (!jpegBlob) throw new Error('Conversion returned no blob');

      const typedBlob =
        jpegBlob instanceof Blob ? jpegBlob : new Blob([jpegBlob], { type: 'image/jpeg' });
      const jpegFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
      const jpegFile = new File([typedBlob], jpegFileName, {
        type: 'image/jpeg',
        lastModified: file.lastModified,
      });

      return jpegFile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to convert HEIC image: ${errorMessage}. Please convert it to JPEG or PNG before uploading.`
      );
    }
  }, []);

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      if (images.length + files.length > 10) {
        showError('Maximum 10 images allowed per post.');
        return;
      }

      const maxSize = 50 * 1024 * 1024;
      const oversizedFiles = Array.from(files).filter((file) => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        showError(`Some files are too large. Maximum file size is 50MB.`);
        return;
      }

      setIsUploading(true);
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
            throw new Error(result.error || `Upload failed with status ${response.status}`);
          }

          const result = await response.json();
          if (result.success) return result.url;
          throw new Error(result.error || 'File upload failed.');
        });

        const newUrls = await Promise.all(uploadPromises);
        setImages((prev) => [...prev, ...newUrls]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'File upload failed.';
        showError(errorMessage);
      } finally {
        setIsUploading(false);
        event.target.value = '';
      }
    },
    [images.length, showError, prepareFileForUpload]
  );

  const handlePublish = useCallback(() => {
    if (postType === 'poll') {
      if (!pollQuestion.trim()) {
        showError('Poll question is required.');
        return;
      }
      const validOptions = pollOptions.filter((opt) => opt.trim());
      if (validOptions.length < 2) {
        showError('Poll must have at least 2 options.');
        return;
      }
      const uniqueOptions = new Set(validOptions.map((opt) => opt.trim().toLowerCase()));
      if (uniqueOptions.size !== validOptions.length) {
        showError('Poll options must be unique.');
        return;
      }
    } else {
      if (!title.trim()) {
        showError('Title is required.');
        return;
      }
      if (!content.trim()) {
        showError('Description is required.');
        return;
      }
    }

    const body: any = {
      title: postType === 'poll' ? pollQuestion.trim() : title.trim(),
      content: postType === 'poll' ? pollQuestion.trim() : content.trim(),
      image_urls: images.length > 0 ? images : [],
      is_public: visibility === 'public',
      tier_required: visibility === 'public' ? 'free' : visibility,
      post_type: postType,
    };

    if (postType === 'poll') {
      const validOptions = pollOptions.filter((opt) => opt.trim());
      body.poll_data = {
        question: pollQuestion.trim(),
        options: validOptions,
        allows_multiple_answers: false,
        expires_at: null,
      };
    }

    publishPost(body, {
      onSuccess: () => {
        setSuccess(true);
        setTimeout(() => {
          router.push('/creator-studio');
        }, 1500);
      },
      onError: (error: any) => {
        showError(error.message || 'Failed to publish.');
      },
    });
  }, [
    postType,
    title,
    content,
    images,
    visibility,
    pollQuestion,
    pollOptions,
    publishPost,
    showError,
    router,
  ]);

  const addPollOption = useCallback(() => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, '']);
    }
  }, [pollOptions]);

  const removePollOption = useCallback(
    (index: number) => {
      if (pollOptions.length > 2) {
        setPollOptions(pollOptions.filter((_, i) => i !== index));
      }
    },
    [pollOptions]
  );

  const updatePollOption = useCallback(
    (index: number, value: string) => {
      const trimmedValue = value.trim();
      if (trimmedValue) {
        const isDuplicate = pollOptions.some(
          (opt, i) => i !== index && opt.trim().toLowerCase() === trimmedValue.toLowerCase()
        );
        if (isDuplicate) {
          showError('This option already exists');
          return;
        }
      }
      const updated = [...pollOptions];
      updated[index] = value;
      setPollOptions(updated);
    },
    [pollOptions, showError]
  );

  // Redirect if not logged in
  if (!user) {
    return (
      <PageLayout fullWidth>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-muted-foreground">Please sign in to create posts</p>
          <Button asChild>
            <Link href="/auth">Sign In</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout fullWidth>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                  <Link href="/creator-studio">
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Create Post</h1>
                  <p className="text-sm text-muted-foreground hidden sm:block">
                    Craft something amazing for your supporters
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile Preview Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden rounded-full"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>

                <Button
                  onClick={handlePublish}
                  disabled={!onboardingCompleted || isPublishing || isUploading}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-full px-6"
                >
                  {isPublishing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                  )}
                  Publish
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full px-4 sm:px-6 lg:px-8 mt-4"
          >
            <div className="bg-green-500/10 border border-green-500/20 text-green-600 px-4 py-3 rounded-md flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Post published successfully! Redirecting...</span>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full px-4 sm:px-6 lg:px-8 mt-4"
          >
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-md flex items-center gap-2">
              <X className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="w-full max-w-full min-w-0 px-4 sm:px-6 lg:px-8 py-6 flex flex-col items-center overflow-x-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 w-full max-w-full min-w-0">
            {/* Form Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6 w-full min-w-0"
            >
              <Card className="p-5 sm:p-6">
                {/* Post Type Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-md bg-primary/10">
                      {postType === 'post' ? (
                        <FileText className="w-5 h-5 text-primary" />
                      ) : (
                        <BarChart2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Create {postType === 'post' ? 'Post' : 'Poll'}
                    </h3>
                  </div>

                  <div className="flex gap-1 p-1 bg-muted rounded-md">
                    <button
                      onClick={() => setPostType('post')}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        postType === 'post'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground'
                      )}
                    >
                      <FileText className="w-4 h-4" />
                      Post
                    </button>
                    <button
                      onClick={() => setPostType('poll')}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        postType === 'poll'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground'
                      )}
                    >
                      <BarChart2 className="w-4 h-4" />
                      Poll
                    </button>
                  </div>
                </div>

                {/* Visibility Selector */}
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-md mb-6">
                  <span className="text-sm font-medium text-muted-foreground">Visibility:</span>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setVisibility('public')}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                        visibility === 'public'
                          ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                          : 'bg-background text-muted-foreground hover:text-foreground border border-border'
                      )}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Public
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility('supporters')}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                        visibility === 'supporters'
                          ? 'bg-purple-500/20 text-purple-600 border border-purple-500/30'
                          : 'bg-background text-muted-foreground hover:text-foreground border border-border'
                      )}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Supporters Only
                    </button>
                  </div>
                </div>

                {/* Post Form Fields */}
                {postType === 'post' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="Enter post title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="border-border rounded-md bg-muted"
                        maxLength={200}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {title.length}/200 characters
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        placeholder="Write a detailed description..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={8}
                        className="bg-muted resize-none border-border rounded-md"
                        maxLength={20000}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {content.length}/20000 characters
                      </p>
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Images
                      </label>

                      {images.length > 0 && (
                        <div className="p-3 rounded-md border border-border bg-muted/30 mb-3">
                          <div className="flex items-center gap-2 mb-3">
                            <ImageIcon className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-foreground">
                              {images.length} {images.length === 1 ? 'image' : 'images'} added
                            </span>
                            {images.length < 10 && (
                              <span className="text-xs text-muted-foreground">(max 10)</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {images.map((url, index) => (
                              <div key={index} className="relative group">
                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                                  <img
                                    src={url}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setImages((prev) => prev.filter((_, i) => i !== index))
                                  }
                                  className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload">
                          <Button
                            variant="outline"
                            className="rounded-md w-full sm:w-auto"
                            asChild
                            disabled={images.length >= 10 || isUploading}
                          >
                            <span>
                              {isUploading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <ImageIcon className="w-4 h-4 mr-2" />
                              )}
                              {isUploading
                                ? 'Uploading...'
                                : images.length > 0
                                  ? 'Add More Images'
                                  : 'Add Images'}
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Poll Form Fields */
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Poll Question <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="Ask a question..."
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        className="border-border rounded-md"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground block">Options</label>
                      {pollOptions.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => updatePollOption(index, e.target.value)}
                            className="flex-1 border-border rounded-md"
                          />
                          {pollOptions.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePollOption(index)}
                              className="shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {pollOptions.length < 10 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addPollOption}
                          className="w-full border-dashed rounded-md"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Option
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Onboarding Warning */}
                {!onboardingCompleted && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800">
                      Complete your onboarding to publish posts.{' '}
                      <Link href="/creator-studio" className="underline font-medium">
                        Go to Creator Studio
                      </Link>
                    </p>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Preview Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn('lg:block w-full min-w-0 max-w-full', showPreview ? 'block' : 'hidden')}
            >
              <div className="w-full min-w-0 max-w-full lg:max-w-xl">
                <Card className="p-4 sm:p-5 lg:p-6 bg-muted/30 w-full min-w-0 overflow-hidden">
                  <PreviewPost
                    title={title}
                    content={content}
                    images={images}
                    visibility={visibility}
                    userProfile={userProfile}
                    postType={postType}
                    pollQuestion={pollQuestion}
                    pollOptions={pollOptions}
                  />
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
