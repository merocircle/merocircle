"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
import { SidebarNav } from '@/components/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/supabase-auth-context';
import { LoadingSpinner } from '@/components/dashboard/LoadingSpinner';
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard';
import { cn } from '@/lib/utils';

interface AnalyticsData {
  stats: {
    totalEarnings: number;
    supporters: number;
    posts: number;
    likes: number;
    currentMonthEarnings: number;
    earningsGrowth: number;
  };
  charts: {
    earnings: Array<{ month: string; earnings: number }>;
    supporterFlow: Array<{ date: string; supporters: number }>;
    engagement: Array<{ date: string; likes: number; comments: number }>;
  };
  topSupporters: Array<{
    id: string;
    name: string;
    photo_url: string | null;
    total_amount: number;
  }>;
}

interface DashboardData {
  stats: {
    monthlyEarnings: number;
    totalEarnings: number;
    supporters: number;
    posts: number;
  };
  posts: Array<any>;
  supporters: Array<any>;
}

export default function EnhancedCreatorDashboard() {
  const { user, userProfile, isAuthenticated, loading, isCreator } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Post creation states
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [postVisibility, setPostVisibility] = useState('public');
  const [postType, setPostType] = useState<'post' | 'poll'>('post');

  // Poll creation states
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [allowsMultipleAnswers, setAllowsMultipleAnswers] = useState(false);
  const [pollDuration, setPollDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/auth');
      return;
    }

    if (!isCreator && userProfile?.role !== 'creator') {
      router.push('/dashboard');
      return;
    }

    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [analyticsRes, dashboardRes] = await Promise.all([
          fetch('/api/creator/analytics'),
          fetch(`/api/creator/${user.id}/dashboard`)
        ]);

        if (analyticsRes.ok) {
          const analyticsJson = await analyticsRes.json();
          setAnalyticsData(analyticsJson);
        }

        if (dashboardRes.ok) {
          const dashboardJson = await dashboardRes.json();
          setDashboardData(dashboardJson);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user, isCreator, userProfile, router]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        alert(result.error || 'File upload failed.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('File upload failed.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handlePublishPost = async () => {
    // For polls, only validate poll fields
    if (postType === 'poll') {
      if (!pollQuestion.trim()) {
        alert('Poll question is required.');
        return;
      }
      const validOptions = pollOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        alert('Poll must have at least 2 options.');
        return;
      }
      if (validOptions.length > 10) {
        alert('Poll cannot have more than 10 options.');
        return;
      }
    } else {
      // For regular posts, validate title and content
      if (!newPostTitle || !newPostContent) {
        alert('Title and content are required.');
        return;
      }
    }

    setIsPublishing(true);
    try {
      const body: any = {
        // For polls, use the question as both title and content
        title: postType === 'poll' ? pollQuestion.trim() : newPostTitle,
        content: postType === 'poll' ? pollQuestion.trim() : newPostContent,
        image_url: uploadedImageUrl || null,
        is_public: postVisibility === 'public',
        tier_required: postVisibility === 'public' ? 'free' : postVisibility,
        post_type: postType
      };

      // Add poll data if it's a poll
      if (postType === 'poll') {
        const validOptions = pollOptions.filter(opt => opt.trim());
        body.poll_data = {
          question: pollQuestion.trim(),
          options: validOptions,
          allows_multiple_answers: allowsMultipleAnswers,
          expires_at: pollDuration ? new Date(Date.now() + pollDuration * 24 * 60 * 60 * 1000).toISOString() : null
        };
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setNewPostTitle('');
        setNewPostContent('');
        setUploadedImageUrl('');
        setPollQuestion('');
        setPollOptions(['', '']);
        setAllowsMultipleAnswers(false);
        setPollDuration(null);
        alert(postType === 'poll' ? 'Poll published successfully!' : 'Post published successfully!');
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to publish.');
      }
    } catch (error) {
      console.error('Publish error:', error);
      alert('Failed to publish.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePostTypeChange = (type: 'post' | 'poll') => {
    setPostType(type);
    // Clear fields when switching types
    if (type === 'poll') {
      setNewPostTitle('');
      setNewPostContent('');
    } else {
      setPollQuestion('');
      setPollOptions(['', '']);
      setAllowsMultipleAnswers(false);
      setPollDuration(null);
    }
  };

  const addPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
        <SidebarNav />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  const stats = analyticsData?.stats || {
    totalEarnings: 0,
    supporters: 0,
    posts: 0,
    likes: 0,
    currentMonthEarnings: 0,
    earningsGrowth: 0
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <SidebarNav />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-8 h-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Creator Dashboard
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, {userProfile?.display_name}! Here's your performance overview.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview & Analytics
              </TabsTrigger>
              <TabsTrigger value="posts" className="gap-2">
                <FileText className="w-4 h-4" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="supporters" className="gap-2">
                <Users className="w-4 h-4" />
                Supporters
              </TabsTrigger>
            </TabsList>

            {/* Overview & Analytics Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="p-6 h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-4">
                      <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <div className={cn(
                        "flex items-center gap-1 text-sm font-semibold",
                        stats.earningsGrowth >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {stats.earningsGrowth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Math.abs(stats.earningsGrowth)}%
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      NPR {stats.currentMonthEarnings.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Total: NPR {stats.totalEarnings.toLocaleString()}
                    </p>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="p-6 h-full bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-4">
                      <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.supporters}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Supporters</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 opacity-0">Placeholder</p>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="p-6 h-full bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-4">
                      <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
                      <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.posts}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Posts</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 opacity-0">Placeholder</p>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="p-6 h-full bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-between mb-4">
                      <Heart className="w-8 h-8 text-red-600 dark:text-red-400" />
                      <MessageCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.likes}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Engagement</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 opacity-0">Placeholder</p>
                  </Card>
                </motion.div>
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Earnings Chart */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Monthly Earnings
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData?.charts.earnings || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                      <YAxis stroke="#6B7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F3F4F6'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="earnings"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                {/* Supporter Flow Chart */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    Supporter Flow (Last 30 Days)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData?.charts.supporterFlow || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                      <YAxis stroke="#6B7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F3F4F6'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="supporters"
                        stroke="#A855F7"
                        strokeWidth={2}
                        dot={{ fill: '#A855F7', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Engagement Chart */}
                <Card className="p-6 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    Engagement Metrics (Last 30 Days)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData?.charts.engagement || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                      <YAxis stroke="#6B7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F3F4F6'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="likes" fill="#10B981" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="comments" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Top Supporters */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-yellow-600" />
                    Top Supporters
                  </h3>
                  <div className="space-y-3">
                    {analyticsData?.topSupporters.slice(0, 5).map((supporter, index) => (
                      <div key={supporter.id} className="flex items-center gap-3">
                        <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 w-6">
                          #{index + 1}
                        </div>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={supporter.photo_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                            {supporter.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {supporter.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            NPR {supporter.total_amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Posts Tab */}
            <TabsContent value="posts" className="space-y-6">
              {/* Welcome Banner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-8"
              >
                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-2">
                        Share Your Story
                      </h2>
                      <p className="text-white/90 text-sm mb-4 max-w-2xl">
                        Connect with your supporters by sharing updates, behind-the-scenes content, or exclusive previews.
                        Pro tip: Paste YouTube links to embed videos directly!
                      </p>
                      <div className="flex items-center gap-4 text-white/80 text-xs">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {stats.likes} Likes
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          Engage with fans
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          Build your audience
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
              </motion.div>

              {/* Create Post Card */}
              <Card className="p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      {postType === 'post' ? (
                        <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <BarChart2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Create New {postType === 'post' ? 'Post' : 'Poll'}
                    </h3>
                  </div>

                  {/* Post Type Toggle */}
                  <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button
                      onClick={() => handlePostTypeChange('post')}
                      className={cn(
                        "px-4 py-2 rounded-md text-sm font-medium transition-all",
                        postType === 'post'
                          ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      )}
                    >
                      <FileText className="w-4 h-4 inline mr-1" />
                      Post
                    </button>
                    <button
                      onClick={() => handlePostTypeChange('poll')}
                      className={cn(
                        "px-4 py-2 rounded-md text-sm font-medium transition-all",
                        postType === 'poll'
                          ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      )}
                    >
                      <BarChart2 className="w-4 h-4 inline mr-1" />
                      Poll
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Show title and content only for regular posts */}
                  {postType === 'post' && (
                    <>
                      <div>
                        <Input
                          placeholder="Give your post an engaging title..."
                          value={newPostTitle}
                          onChange={(e) => setNewPostTitle(e.target.value)}
                          className="text-lg font-semibold border-2 focus:border-purple-400 dark:focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <Textarea
                          placeholder={`Share your story, updates, or thoughts... ✨

💡 Tips:
• Paste YouTube links to embed videos automatically
• Share behind-the-scenes content
• Ask questions to engage your supporters
• Add images for visual appeal`}
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          rows={8}
                          className="resize-none border-2 focus:border-purple-400 dark:focus:border-purple-500"
                        />
                      </div>
                    </>
                  )}

                  {/* Poll Creation UI */}
                  {postType === 'poll' && (
                    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Poll Question *
                        </label>
                        <Input
                          placeholder="What would you like to ask your supporters?"
                          value={pollQuestion}
                          onChange={(e) => setPollQuestion(e.target.value)}
                          className="text-lg font-semibold border-2 focus:border-blue-400 dark:focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Options * (2-10)
                        </label>
                        <div className="space-y-2">
                          {pollOptions.map((option, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                placeholder={`Option ${index + 1}`}
                                value={option}
                                onChange={(e) => updatePollOption(index, e.target.value)}
                                className="flex-1 border-2 focus:border-blue-400 dark:focus:border-blue-500"
                              />
                              {pollOptions.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removePollOption(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
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
                            className="mt-2 w-full border-2 border-dashed border-blue-300 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-600"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Option
                          </Button>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="multiple-answers"
                            checked={allowsMultipleAnswers}
                            onChange={(e) => setAllowsMultipleAnswers(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="multiple-answers" className="text-sm text-gray-700 dark:text-gray-300">
                            Allow multiple answers
                          </label>
                        </div>

                        <div className="flex items-center gap-2">
                          <label htmlFor="poll-duration" className="text-sm text-gray-700 dark:text-gray-300">
                            Duration:
                          </label>
                          <select
                            id="poll-duration"
                            value={pollDuration || ''}
                            onChange={(e) => setPollDuration(e.target.value ? parseInt(e.target.value) : null)}
                            className="px-3 py-1 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
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

                  {uploadedImageUrl && postType === 'post' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative rounded-xl overflow-hidden"
                    >
                      <img
                        src={uploadedImageUrl}
                        alt="Upload preview"
                        className="w-full h-64 object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setUploadedImageUrl('')}
                        className="absolute top-3 right-3 shadow-lg"
                      >
                        Remove
                      </Button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <p className="text-white text-sm font-medium">Preview ready to post</p>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                              size="sm"
                              disabled={isUploadingImage}
                              className="w-full sm:w-auto border-2 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                              asChild
                            >
                              <span className="cursor-pointer">
                                <Upload className="w-4 h-4 mr-2" />
                                {isUploadingImage ? 'Uploading...' : 'Add Image'}
                              </span>
                            </Button>
                          </label>
                        </>
                      )}

                      <div className="relative">
                        <select
                          value={postVisibility}
                          onChange={(e) => setPostVisibility(e.target.value)}
                          className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium hover:border-purple-400 dark:hover:border-purple-500 transition-colors appearance-none pr-10"
                        >
                          <option value="public">🌍 Public</option>
                          <option value="supporters">👥 Supporters Only</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handlePublishPost}
                      disabled={
                        isPublishing ||
                        (postType === 'post' && (!newPostTitle.trim() || !newPostContent.trim())) ||
                        (postType === 'poll' && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2))
                      }
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
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
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-600" />
                      Your Recent Posts
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {dashboardData?.posts.length || 0} posts published
                    </p>
                  </div>
                </div>

                {dashboardData?.posts && dashboardData.posts.length > 0 ? (
                  dashboardData.posts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <EnhancedPostCard
                        post={post}
                        currentUserId={user?.id}
                        showActions={true}
                      />
                    </motion.div>
                  ))
                ) : (
                  <Card className="p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                        <FileText className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          No posts yet
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                          Start sharing your journey! Create your first post to connect with your supporters and build your community.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Supporters Tab */}
            <TabsContent value="supporters" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  All Supporters ({stats.supporters})
                </h3>
                <div className="space-y-3">
                  {dashboardData?.supporters.map((supporter) => (
                    <div key={supporter.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={supporter.avatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                          {supporter.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{supporter.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Supported: NPR {supporter.amount.toLocaleString()}
                        </p>
                      </div>
                      {supporter.joined && (
                        <p className="text-xs text-gray-400">
                          {new Date(supporter.joined).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
