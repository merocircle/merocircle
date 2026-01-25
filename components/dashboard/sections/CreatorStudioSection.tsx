'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Crown,
  DollarSign,
  Users,
  Heart,
  TrendingUp,
  TrendingDown,
  FileText,
  Upload,
  Target,
  Activity,
  BarChart3,
  ArrowUpRight,
  MessageCircle,
  Eye,
  Plus,
  X,
  BarChart2,
  Loader2,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/supabase-auth-context';
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard';
import { OnboardingBanner } from '@/components/dashboard/OnboardingBanner';
import { cn } from '@/lib/utils';
import { useCreatorAnalytics, useCreatorDashboardData, usePublishPost } from '@/hooks/useQueries';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};

// Tab configuration
const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'supporters', label: 'Supporters', icon: Users }
];

const CreatorStudioSection = memo(function CreatorStudioSection() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState<string | null>(null);

  const [newPostContent, setNewPostContent] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
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
    if (dashboardData) {
      const isCompleted = dashboardData.onboardingCompleted || false;
      setOnboardingCompleted(isCompleted);
      setShowOnboardingBanner(!isCompleted);
    }
  }, [dashboardData]);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'posts');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setUploadedImageUrl(result.url);
      } else {
        setShowErrorMessage(result.error || 'File upload failed.');
        setTimeout(() => setShowErrorMessage(null), 3000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setShowErrorMessage('File upload failed.');
      setTimeout(() => setShowErrorMessage(null), 3000);
    } finally {
      setIsUploadingImage(false);
    }
  }, []);

  const handlePublishPost = useCallback(() => {
    if (postType === 'poll') {
      if (!pollQuestion.trim()) {
        setShowErrorMessage('Poll question is required.');
        setTimeout(() => setShowErrorMessage(null), 3000);
        return;
      }
      const validOptions = pollOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        setShowErrorMessage('Poll must have at least 2 options.');
        setTimeout(() => setShowErrorMessage(null), 3000);
        return;
      }
    } else {
      if (!newPostContent.trim()) {
        setShowErrorMessage('Caption is required.');
        setTimeout(() => setShowErrorMessage(null), 3000);
        return;
      }
    }

    const body: any = {
      title: postType === 'poll' ? pollQuestion.trim() : newPostContent.trim().slice(0, 100),
      content: postType === 'poll' ? pollQuestion.trim() : newPostContent.trim(),
      image_url: uploadedImageUrl || null,
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
        setUploadedImageUrl('');
        setPollQuestion('');
        setPollOptions(['', '']);
        setAllowsMultipleAnswers(false);
        setPollDuration(null);
        setPostVisibility('public');

        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      },
      onError: (error: any) => {
        setShowErrorMessage(error.message || 'Failed to publish.');
        setTimeout(() => setShowErrorMessage(null), 3000);
      }
    });
  }, [postType, newPostContent, uploadedImageUrl, postVisibility, pollQuestion, pollOptions, allowsMultipleAnswers, pollDuration, publishPost]);

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
      <div className="mb-8">
        <div className="flex gap-2 p-1.5 bg-muted/50 rounded-2xl w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            );
          })}
        </div>
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

            {/* Stats Grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <motion.div variants={itemVariants}>
                <Card className="p-5 h-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:border-blue-500/40 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-blue-500/20">
                      <DollarSign className="w-5 h-5 text-blue-500" />
                    </div>
                    <Badge
                      variant={stats.earningsGrowth >= 0 ? 'default' : 'destructive'}
                      className={cn(
                        'text-xs',
                        stats.earningsGrowth >= 0
                          ? 'bg-green-500/20 text-green-600 hover:bg-green-500/30'
                          : 'bg-red-500/20 text-red-600 hover:bg-red-500/30'
                      )}
                    >
                      {stats.earningsGrowth >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {Math.abs(stats.earningsGrowth)}%
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    NPR {stats.currentMonthEarnings.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    Total: NPR {stats.totalEarnings.toLocaleString()}
                  </p>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="p-5 h-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-500/40 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-purple-500/20">
                      <Users className="w-5 h-5 text-purple-500" />
                    </div>
                    <Activity className="w-4 h-4 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.supporters}</p>
                  <p className="text-sm text-muted-foreground">Total Supporters</p>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="p-5 h-full bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 hover:border-green-500/40 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-green-500/20">
                      <FileText className="w-5 h-5 text-green-500" />
                    </div>
                    <Eye className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.posts}</p>
                  <p className="text-sm text-muted-foreground">Total Posts</p>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="p-5 h-full bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20 hover:border-red-500/40 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-red-500/20">
                      <Heart className="w-5 h-5 text-red-500" />
                    </div>
                    <MessageCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.likes}</p>
                  <p className="text-sm text-muted-foreground">Total Engagement</p>
                </Card>
              </motion.div>
            </motion.div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 border-border/50">
                <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/20">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </div>
                  Monthly Earnings
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={analyticsData?.charts.earnings || []}>
                    <defs>
                      <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
                    <XAxis dataKey="month" className="text-muted-foreground" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis className="text-muted-foreground" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                      }}
                    />
                    <Area type="monotone" dataKey="earnings" stroke="#3B82F6" strokeWidth={2} fill="url(#earningsGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6 border-border/50">
                <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/20">
                    <Users className="w-4 h-4 text-purple-500" />
                  </div>
                  Supporter Flow
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={analyticsData?.charts.supporterFlow || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
                    <XAxis dataKey="date" className="text-muted-foreground" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis className="text-muted-foreground" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                      }}
                    />
                    <Line type="monotone" dataKey="supporters" stroke="#A855F7" strokeWidth={2} dot={{ fill: '#A855F7', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Top Supporters */}
            <Card className="p-6 border-border/50">
              <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-yellow-500/20">
                  <Target className="w-4 h-4 text-yellow-500" />
                </div>
                Top Supporters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {analyticsData?.topSupporters.slice(0, 6).map((supporter: any, index: number) => (
                  <motion.div
                    key={supporter.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                      index === 0 && 'bg-yellow-500/20 text-yellow-600',
                      index === 1 && 'bg-gray-300/30 text-gray-500',
                      index === 2 && 'bg-amber-600/20 text-amber-600',
                      index > 2 && 'bg-muted text-muted-foreground'
                    )}>
                      {index + 1}
                    </div>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={supporter.photo_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-primary-foreground text-sm">
                        {supporter.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{supporter.name}</p>
                      <p className="text-xs text-muted-foreground">NPR {supporter.total_amount.toLocaleString()}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <motion.div
            key="posts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Toast Messages */}
            <AnimatePresence>
              {showSuccessMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-green-500 text-white px-5 py-3 rounded-2xl shadow-lg"
                >
                  <Sparkles className="w-5 h-5" />
                  Post published!
                </motion.div>
              )}
              {showErrorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-red-500 text-white px-5 py-3 rounded-2xl shadow-lg"
                >
                  <X className="w-5 h-5" />
                  {showErrorMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Post Creation */}
            <Card className={cn(
              "p-6 transition-all border-border/50",
              onboardingCompleted ? "hover:border-primary/30" : "opacity-60"
            )}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    {postType === 'post' ? <FileText className="w-5 h-5 text-primary" /> : <BarChart2 className="w-5 h-5 text-primary" />}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Create {postType === 'post' ? 'Post' : 'Poll'}</h3>
                </div>

                <div className={cn("flex gap-1 p-1 bg-muted/50 rounded-xl", !onboardingCompleted && "opacity-50 pointer-events-none")}>
                  <button
                    onClick={() => handlePostTypeChange('post')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      postType === 'post' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                    )}
                  >
                    <FileText className="w-4 h-4" />
                    Post
                  </button>
                  <button
                    onClick={() => handlePostTypeChange('poll')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      postType === 'poll' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                    )}
                  >
                    <BarChart2 className="w-4 h-4" />
                    Poll
                  </button>
                </div>
              </div>

              <div className={cn("space-y-4", !onboardingCompleted && "opacity-50 pointer-events-none")}>
                {postType === 'post' && (
                  <Textarea
                    placeholder="Write a caption..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={4}
                    className="resize-none border-border rounded-xl"
                  />
                )}

                {postType === 'poll' && (
                  <div className="space-y-3 p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
                    <Input
                      placeholder="Poll question..."
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      className="border-border rounded-xl"
                    />
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => updatePollOption(index, e.target.value)}
                          className="flex-1 border-border rounded-xl"
                        />
                        {pollOptions.length > 2 && (
                          <Button variant="ghost" size="icon" onClick={() => removePollOption(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 10 && (
                      <Button variant="outline" size="sm" onClick={addPollOption} className="w-full border-dashed">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Option
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  {postType === 'post' && (
                    <div>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                      <label htmlFor="image-upload">
                        <Button variant="outline" size="sm" className="rounded-xl" asChild>
                          <span>
                            {isUploadingImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                            {isUploadingImage ? 'Uploading...' : 'Add Image'}
                          </span>
                        </Button>
                      </label>
                    </div>
                  )}
                  <Button
                    onClick={handlePublishPost}
                    disabled={!onboardingCompleted || isPublishing}
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl"
                  >
                    {isPublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUpRight className="w-4 h-4 mr-2" />}
                    Publish
                  </Button>
                </div>
              </div>
            </Card>

            {/* Recent Posts */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Recent Posts</h3>
              {dashboardData?.posts?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.posts.map((post: any) => (
                    <EnhancedPostCard key={post.id} post={post} currentUserId={user?.id} showActions={onboardingCompleted} />
                  ))}
                </div>
              ) : (
                <Card className="p-10 text-center border-dashed border-2">
                  <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No posts yet. Create your first post!</p>
                </Card>
              )}
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
            <Card className="p-6 border-border/50">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-purple-500/10">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">All Supporters</h3>
                  <p className="text-sm text-muted-foreground">{stats.supporters} total</p>
                </div>
              </div>

              <div className="space-y-3">
                {dashboardData?.supporters?.map((supporter: any, index: number) => (
                  <motion.div
                    key={supporter.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={supporter.avatar || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-primary-foreground">
                        {supporter.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{supporter.name}</p>
                      <p className="text-sm text-muted-foreground">NPR {supporter.amount.toLocaleString()}</p>
                    </div>
                    {supporter.joined && (
                      <Badge variant="secondary" className="text-xs">
                        {new Date(supporter.joined).toLocaleDateString()}
                      </Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default CreatorStudioSection;
