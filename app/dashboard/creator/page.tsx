"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
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
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/common/PageLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  Share2,
  Plus,
  X,
  BarChart2,
  Loader2,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/supabase-auth-context';
import { LoadingSpinner } from '@/components/dashboard/LoadingSpinner';
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard';
import { OnboardingBanner } from '@/components/dashboard/OnboardingBanner';
import { cn, slugifyDisplayName } from '@/lib/utils';
import { useCreatorAnalytics, useCreatorDashboardData, usePublishPost } from '@/hooks/useQueries';
import { ShareButton } from '@/components/atoms/buttons/ShareButton';

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

const StatsCard = memo(({ children }: { children: React.ReactNode }) => children);

export default function EnhancedCreatorDashboard() {
  const { user, userProfile, isAuthenticated, loading, isCreator } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState<string | null>(null);

  const [newPostTitle, setNewPostTitle] = useState('');
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

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined' || !userProfile?.display_name) {
      return '';
    }
    return `${window.location.origin}/${slugifyDisplayName(userProfile.display_name)}`;
  }, [userProfile?.display_name]);

  const handleShareProfile = useCallback(async () => {
    if (!shareUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Support ${userProfile?.display_name || 'this creator'}`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      // Ignore share errors
    }
  }, [shareUrl, userProfile?.display_name]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/auth');
      return;
    }

    if (!isCreator && userProfile?.role !== 'creator') {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, user, isCreator, userProfile, router]);

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
      if (validOptions.length > 10) {
        setShowErrorMessage('Poll cannot have more than 10 options.');
        setTimeout(() => setShowErrorMessage(null), 3000);
        return;
      }
    } else {
      if (!newPostTitle || !newPostContent) {
        setShowErrorMessage('Title and content are required.');
        setTimeout(() => setShowErrorMessage(null), 3000);
        return;
      }
    }

    const body: any = {
      title: postType === 'poll' ? pollQuestion.trim() : newPostTitle,
      content: postType === 'poll' ? pollQuestion.trim() : newPostContent,
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
        setNewPostTitle('');
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
  }, [postType, newPostTitle, newPostContent, uploadedImageUrl, postVisibility, pollQuestion, pollOptions, allowsMultipleAnswers, pollDuration, publishPost]);

  const handlePostTypeChange = useCallback((type: 'post' | 'poll') => {
    setPostType(type);
    if (type === 'poll') {
      setNewPostTitle('');
      setNewPostContent('');
    } else {
      setPollQuestion('');
      setPollOptions(['', '']);
      setAllowsMultipleAnswers(false);
      setPollDuration(null);
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

  if (loading || analyticsLoading || dashboardLoading) {
    return <PageLayout loading />;
  }

  return (
    <PageLayout hideRightPanel fullWidth>
      <div className="py-6 px-4 md:px-6 max-w-7xl mx-auto">
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

          {shareUrl && (
            <Button
              variant="outline"
              className="gap-2 rounded-xl"
              onClick={handleShareProfile}
            >
              <Share2 className="w-4 h-4" />
              Share your profile
            </Button>
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

              {shareUrl && (
                <Card className="p-5 border-border/50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        Share your creator page
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {shareUrl}
                      </p>
                    </div>
                    <ShareButton
                      url={shareUrl}
                      title={`Support ${userProfile?.display_name || 'this creator'}`}
                      size="lg"
                      className="self-start sm:self-center"
                    />
                  </div>
                </Card>
              )}

              {/* Stats Grid */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {/* Earnings Card */}
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

                {/* Supporters Card */}
                <motion.div variants={itemVariants}>
                  <Card className="p-5 h-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-500/40 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-xl bg-purple-500/20">
                        <Users className="w-5 h-5 text-purple-500" />
                      </div>
                      <Activity className="w-4 h-4 text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.supporters}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Supporters</p>
                  </Card>
                </motion.div>

                {/* Posts Card */}
                <motion.div variants={itemVariants}>
                  <Card className="p-5 h-full bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 hover:border-green-500/40 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-xl bg-green-500/20">
                        <FileText className="w-5 h-5 text-green-500" />
                      </div>
                      <Eye className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.posts}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Posts</p>
                  </Card>
                </motion.div>

                {/* Engagement Card */}
                <motion.div variants={itemVariants}>
                  <Card className="p-5 h-full bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20 hover:border-red-500/40 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-xl bg-red-500/20">
                        <Heart className="w-5 h-5 text-red-500" />
                      </div>
                      <MessageCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.likes}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Engagement</p>
                  </Card>
                </motion.div>
              </motion.div>

              {/* Charts Row */}
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
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="earnings"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fill="url(#earningsGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-6 border-border/50">
                  <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/20">
                      <Users className="w-4 h-4 text-purple-500" />
                    </div>
                    Supporter Flow (Last 30 Days)
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
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="supporters"
                        stroke="#A855F7"
                        strokeWidth={2}
                        dot={{ fill: '#A855F7', r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Engagement & Top Supporters */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 lg:col-span-2 border-border/50">
                  <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-green-500/20">
                      <Activity className="w-4 h-4 text-green-500" />
                    </div>
                    Engagement Metrics (Last 30 Days)
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={analyticsData?.charts.engagement || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
                      <XAxis dataKey="date" className="text-muted-foreground" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis className="text-muted-foreground" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      <Bar dataKey="likes" fill="#10B981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="comments" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-6 border-border/50">
                  <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-yellow-500/20">
                      <Target className="w-4 h-4 text-yellow-500" />
                    </div>
                    Top Supporters
                  </h3>
                  <div className="space-y-3">
                    {analyticsData?.topSupporters.slice(0, 5).map((supporter: any, index: number) => (
                      <motion.div
                        key={supporter.id}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                          index === 0 && 'bg-yellow-500/20 text-yellow-600',
                          index === 1 && 'bg-gray-300/30 text-gray-500',
                          index === 2 && 'bg-amber-600/20 text-amber-600',
                          index > 2 && 'bg-muted text-muted-foreground'
                        )}>
                          {index + 1}
                        </div>
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={supporter.photo_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-primary-foreground text-xs">
                            {supporter.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {supporter.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            NPR {supporter.total_amount.toLocaleString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </div>
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
                    className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-green-500 text-white px-5 py-3 rounded-2xl shadow-lg shadow-green-500/25"
                  >
                    <Sparkles className="w-5 h-5" />
                    {postType === 'poll' ? 'Poll published successfully!' : 'Post published successfully!'}
                  </motion.div>
                )}
                {showErrorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-red-500 text-white px-5 py-3 rounded-2xl shadow-lg shadow-red-500/25"
                  >
                    <X className="w-5 h-5" />
                    {showErrorMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hero Banner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 md:p-8"
              >
                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                        Share Your Story
                      </h2>
                      <p className="text-white/85 text-sm mb-4 max-w-xl">
                        Connect with your supporters by sharing updates, behind-the-scenes content, or exclusive previews.
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-white/70 text-xs">
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                          <Heart className="w-3.5 h-3.5" />
                          {stats.likes} Likes
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                          <MessageCircle className="w-3.5 h-3.5" />
                          Engage
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                          <Eye className="w-3.5 h-3.5" />
                          Build audience
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
              </motion.div>

              {/* Onboarding Warning */}
              {!onboardingCompleted && (
                <Card className="p-5 border-2 border-yellow-500/30 bg-yellow-500/10">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-yellow-500/20 rounded-xl">
                      <X className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-foreground mb-1">
                        Complete Onboarding to Create Posts
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Please complete your onboarding by booking a call or clicking "Already Done" in the Overview tab to unlock post creation.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Post Creation Card */}
              <Card className={cn(
                "p-6 transition-all border-border/50",
                onboardingCompleted
                  ? "hover:border-primary/30"
                  : "opacity-60"
              )}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
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

                  {/* Post Type Toggle */}
                  <div className={cn(
                    "flex gap-1 p-1 bg-muted/50 rounded-xl",
                    !onboardingCompleted && "opacity-50 pointer-events-none"
                  )}>
                    <button
                      onClick={() => handlePostTypeChange('post')}
                      disabled={!onboardingCompleted}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        postType === 'post'
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                        !onboardingCompleted && "cursor-not-allowed"
                      )}
                    >
                      <FileText className="w-4 h-4" />
                      Post
                    </button>
                    <button
                      onClick={() => handlePostTypeChange('poll')}
                      disabled={!onboardingCompleted}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        postType === 'poll'
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                        !onboardingCompleted && "cursor-not-allowed"
                      )}
                    >
                      <BarChart2 className="w-4 h-4" />
                      Poll
                    </button>
                  </div>
                </div>

                <div className={cn(
                  "space-y-5",
                  !onboardingCompleted && "opacity-50 pointer-events-none"
                )}>
                  {/* Visibility Selector */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Visibility
                    </label>
                    <div className="relative">
                      <select
                        value={postVisibility}
                        onChange={(e) => setPostVisibility(e.target.value)}
                        disabled={!onboardingCompleted}
                        className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-sm font-medium hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors appearance-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="public">🌍 Public</option>
                        <option value="supporters">👥 Supporters Only</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Post Form */}
                  {postType === 'post' && (
                    <>
                      <div>
                        <Input
                          placeholder="Give your post an engaging title..."
                          value={newPostTitle}
                          onChange={(e) => setNewPostTitle(e.target.value)}
                          disabled={!onboardingCompleted}
                          className="text-base font-medium border-border rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary"
                        />
                      </div>

                      <div>
                        <Textarea
                          placeholder="Share your story, updates, or thoughts...

💡 Paste YouTube links to embed videos automatically"
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          disabled={!onboardingCompleted}
                          rows={6}
                          className="resize-none border-border rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary"
                        />
                      </div>
                    </>
                  )}

                  {/* Poll Form */}
                  {postType === 'poll' && (
                    <div className="space-y-4 p-5 bg-blue-500/5 rounded-2xl border border-blue-500/20">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Poll Question *
                        </label>
                        <Input
                          placeholder="What would you like to ask your supporters?"
                          value={pollQuestion}
                          onChange={(e) => setPollQuestion(e.target.value)}
                          disabled={!onboardingCompleted}
                          className="text-base font-medium border-border rounded-xl focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Options * (2-10)
                        </label>
                        <div className="space-y-2">
                          {pollOptions.map((option, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                placeholder={`Option ${index + 1}`}
                                value={option}
                                onChange={(e) => updatePollOption(index, e.target.value)}
                                disabled={!onboardingCompleted}
                                className="flex-1 border-border rounded-xl focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                              />
                              {pollOptions.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removePollOption(index)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                        {pollOptions.length < 10 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addPollOption}
                            disabled={!onboardingCompleted}
                            className="mt-3 w-full border-dashed border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-xl"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Option
                          </Button>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="multiple-answers"
                            checked={allowsMultipleAnswers}
                            onChange={(e) => setAllowsMultipleAnswers(e.target.checked)}
                            disabled={!onboardingCompleted}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="multiple-answers" className="text-sm text-muted-foreground">
                            Allow multiple answers
                          </label>
                        </div>

                        <div className="flex items-center gap-2">
                          <label htmlFor="poll-duration" className="text-sm text-muted-foreground">
                            Duration:
                          </label>
                          <select
                            id="poll-duration"
                            value={pollDuration || ''}
                            onChange={(e) => setPollDuration(e.target.value ? parseInt(e.target.value) : null)}
                            disabled={!onboardingCompleted}
                            className="px-3 py-1.5 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-blue-500/20"
                          >
                            <option value="">No expiration</option>
                            <option value="1">1 day</option>
                            <option value="3">3 days</option>
                            <option value="7">1 week</option>
                            <option value="14">2 weeks</option>
                            <option value="30">1 month</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Image Preview */}
                  {uploadedImageUrl && postType === 'post' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative rounded-2xl overflow-hidden"
                    >
                      <img
                        src={uploadedImageUrl}
                        alt="Upload preview"
                        className="w-full h-56 object-cover"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setUploadedImageUrl('')}
                        className="absolute top-3 right-3 shadow-lg bg-background/80 backdrop-blur-sm hover:bg-background rounded-xl"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <p className="text-white text-sm font-medium flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Image ready
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Actions Row */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-5 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      {postType === 'post' && (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                            disabled={isUploadingImage}
                          />
                          <label htmlFor="image-upload" className="flex-1 sm:flex-none">
                            <Button
                              variant="outline"
                              size="default"
                              disabled={isUploadingImage || !onboardingCompleted}
                              className="w-full sm:w-auto rounded-xl hover:border-primary/50 hover:bg-primary/5"
                              asChild
                            >
                              <span className={cn(
                                "cursor-pointer",
                                !onboardingCompleted && "cursor-not-allowed"
                              )}>
                                {isUploadingImage ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <ImageIcon className="w-4 h-4 mr-2" />
                                    Add Image
                                  </>
                                )}
                              </span>
                            </Button>
                          </label>
                        </>
                      )}
                    </div>

                    <Button
                      onClick={handlePublishPost}
                      disabled={
                        !onboardingCompleted ||
                        isPublishing ||
                        (postType === 'post' && (!newPostTitle.trim() || !newPostContent.trim())) ||
                        (postType === 'poll' && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2))
                      }
                      size="lg"
                      className={cn(
                        "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl transition-all rounded-xl",
                        !onboardingCompleted && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-4 h-4 mr-2" />
                          Publish {postType === 'post' ? 'Post' : 'Poll'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Recent Posts Section */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Your Recent Posts
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {dashboardData?.posts.length || 0} posts published
                      </p>
                    </div>
                  </div>
                </div>

                {dashboardData?.posts && dashboardData.posts.length > 0 ? (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className={cn(
                      "space-y-4",
                      !onboardingCompleted && "opacity-60"
                    )}
                  >
                    {dashboardData.posts.map((post: any, index: number) => (
                      <motion.div key={post.id} variants={itemVariants}>
                        <EnhancedPostCard
                          post={post}
                          currentUserId={user?.id}
                          showActions={onboardingCompleted}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <Card className="p-10 text-center border-dashed border-2 border-border/50">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-primary/10 rounded-2xl">
                        <FileText className="w-10 h-10 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground mb-1">
                          No posts yet
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                          Start sharing your journey! Create your first post to connect with your supporters.
                        </p>
                      </div>
                    </div>
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
                    <h3 className="text-lg font-semibold text-foreground">
                      All Supporters
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {stats.supporters} total supporters
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {dashboardData?.supporters.map((supporter: any, index: number) => (
                    <motion.div
                      key={supporter.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={supporter.avatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-primary-foreground">
                          {supporter.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{supporter.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Supported: NPR {supporter.amount.toLocaleString()}
                        </p>
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
    </PageLayout>
  );
}
