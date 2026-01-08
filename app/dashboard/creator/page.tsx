"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Crown, 
  DollarSign,
  Users,
  TrendingUp,
  Heart,
  MessageCircle,
  BarChart3,
  Settings,
  PlusCircle,
  Eye,
  Share2,
  Calendar,
  Gift,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Edit3,
  Video,
  FileText,
  Bell,
  CreditCard,
  Target,
  Upload,
  Bookmark,
  Download,
  Filter,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  Copy,
  Sparkles,
  Shield,
  Phone,
  Save,
  Camera,
  Play
} from 'lucide-react';
import { useAuth } from '@/contexts/supabase-auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { LoadingSpinner } from '@/components/dashboard/LoadingSpinner';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PostListItem } from '@/components/dashboard/PostListItem';
import { SupporterListItem } from '@/components/dashboard/SupporterListItem';
import PostCard from '@/components/posts/PostCard';
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard';
import { cn } from '@/lib/utils';
import { 
  common, 
  spacing, 
  typography, 
  layout, 
  responsive, 
  colors, 
  effects, 
  animations 
} from '@/lib/tailwind-utils';

export default function CreatorDashboard() {
  const { user, userProfile, creatorProfile, isAuthenticated, loading, createCreatorProfile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [postVisibility, setPostVisibility] = useState('public');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    bio: '',
    category: ''
  });
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [loading, isAuthenticated, router]);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      if (isAuthenticated && userProfile && creatorProfile) {
        setDataLoading(true);
        try {
          const response = await fetch(`/api/creator/${user?.id}/dashboard`);
          if (response.ok) {
            const data = await response.json();
            setDashboardData(data);
          }
        } catch (error) {
          console.error('Failed to fetch dashboard data:', error);
        } finally {
          setDataLoading(false);
        }
      } else if (isAuthenticated && userProfile && !creatorProfile) {
        setDataLoading(false);
      }
    };

    fetchDashboardData();
    
    const refreshInterval = setInterval(() => {
      if (isAuthenticated && userProfile && creatorProfile) {
        fetchDashboardData();
      }
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, userProfile, creatorProfile, user?.id]);

  const handleRegisterAsCreator = async () => {
    if (!registrationData.bio || !registrationData.category) {
      alert('Please fill in all fields');
      return;
    }

    setRegistrationLoading(true);
    try {
      const { error } = await createCreatorProfile(registrationData.bio, registrationData.category);
      if (error) {
        alert(error.message || 'Failed to create creator profile');
      } else {
        setIsRegistering(false);
      }
    } catch (error) {
      alert('Failed to register as creator');
    } finally {
      setRegistrationLoading(false);
    }
  };

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
      alert('File upload failed. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handlePublishPost = async () => {
    if (!newPostTitle || !newPostContent) {
      alert('Title and content are required for a post.');
      return;
    }

    setIsPublishing(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostContent,
          image_url: uploadedImageUrl || null,
          is_public: postVisibility === 'public',
          tier_required: postVisibility === 'public' ? 'free' : postVisibility,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Post created successfully!');
        setNewPostTitle('');
        setNewPostContent('');
        setUploadedImageUrl('');
        setPostVisibility('public');
        if (user?.id) {
          const dashboardResponse = await fetch(`/api/creator/${user.id}/dashboard`);
          if (dashboardResponse.ok) {
            const data = await dashboardResponse.json();
            setDashboardData(data);
          }
        }
      } else {
        alert(result.error || 'Failed to create post.');
      }
    } catch (error) {
      console.error('Create post error:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner size="lg" className="h-64" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !userProfile) {
    return null;
  }

  if (!creatorProfile && !isRegistering) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Become a Creator
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Register as a creator to start posting content and receiving support from your audience
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio *
                </label>
                <Textarea
                  placeholder="Tell us about yourself and your creative work..."
                  value={registrationData.bio}
                  onChange={(e) => setRegistrationData({ ...registrationData, bio: e.target.value })}
                  rows={4}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={registrationData.category}
                  onChange={(e) => setRegistrationData({ ...registrationData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="">Select a category</option>
                  <option value="Art">Art</option>
                  <option value="Music">Music</option>
                  <option value="Photography">Photography</option>
                  <option value="Writing">Writing</option>
                  <option value="Cooking">Cooking</option>
                  <option value="Tech">Tech</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Travel">Travel</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Education">Education</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Crafts">Crafts</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleRegisterAsCreator}
                  disabled={registrationLoading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-600"
                >
                  {registrationLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Registering...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      Register as Creator
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const creatorStats = dashboardData?.stats || {
    monthlyEarnings: 0,
    totalEarnings: 0,
    supporters: 0,
    posts: 0,
    followers: 0
  };

  const recentPosts = dashboardData?.posts || [];
  const supporters = dashboardData?.supporters || [];

  const analyticsData = React.useMemo(() => {
    const totalLikes = recentPosts.reduce((sum: number, post: any) => sum + (post.likes_count || 0), 0);
    const totalComments = recentPosts.reduce((sum: number, post: any) => sum + (post.comments_count || 0), 0);
    const avgLikesPerPost = recentPosts.length > 0 ? Math.round(totalLikes / recentPosts.length) : 0;
    const avgCommentsPerPost = recentPosts.length > 0 ? Math.round(totalComments / recentPosts.length) : 0;
    const engagementRate = recentPosts.length > 0 && creatorStats.followers > 0 
      ? ((totalLikes + totalComments) / creatorStats.followers * 100).toFixed(1)
      : '0';

    return {
      totalLikes,
      totalComments,
      avgLikesPerPost,
      avgCommentsPerPost,
      engagementRate
    };
  }, [recentPosts, creatorStats.followers]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      
      <div className={common.pageContainer}>
        <motion.div
          {...animations.fadeIn}
          className={spacing.section}
        >
          <div className={common.pageHeader}>
            <div className={common.headerTitle}>
              <div className={cn(common.avatarContainer, effects.gradient.red)}>
                <Crown className={cn(responsive.iconMedium, 'text-white')} />
              </div>
              <div className={common.headerContent}>
                <h1 className={cn(typography.h1, typography.truncate)}>
                  Creator Dashboard
                </h1>
                <p className={cn(typography.body, typography.truncate)}>
                  Welcome back, {userProfile.display_name || userProfile.email?.split('@')[0] || 'Creator'}
                </p>
              </div>
            </div>
            
            <div className={common.buttonGroup}>
              <Button 
                variant="outline" 
                size="sm"
                className={common.iconButton}
                onClick={() => router.push('/dashboard')}
              >
                <Heart className={responsive.buttonIcon} />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className={common.iconButton}
                onClick={() => router.push('/profile')}
              >
                <Settings className={responsive.buttonIcon} />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Button 
                size="sm"
                className={cn(common.iconButton, effects.gradient.red)}
                onClick={() => {
                  setActiveTab('posts');
                  setTimeout(() => {
                    const postForm = document.getElementById('new-post-form');
                    if (postForm) {
                      postForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
              >
                <PlusCircle className={responsive.buttonIcon} />
                <span className="hidden sm:inline">New Post</span>
                <span className="sm:hidden">Post</span>
              </Button>
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className={common.tabsContainer}>
          <TabsList className={cn(responsive.tabList, 'overflow-x-auto sm:overflow-x-visible')}>
            <TabsTrigger value="overview" className={responsive.tab}>Overview</TabsTrigger>
            <TabsTrigger value="posts" className={responsive.tab}>Posts</TabsTrigger>
            <TabsTrigger value="supporters" className={responsive.tab}>Supporters</TabsTrigger>
            <TabsTrigger value="analytics" className={responsive.tab}>Analytics</TabsTrigger>
            <TabsTrigger value="goals" className={responsive.tab}>Goals</TabsTrigger>
            <TabsTrigger value="earnings" className={responsive.tab}>Earnings</TabsTrigger>
            <TabsTrigger value="payments" className={responsive.tab}>Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
            >
              {dataLoading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-8 w-32 mb-2" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="w-8 h-8 rounded-full" />
                      </div>
                    </Card>
                  ))}
                </>
              ) : (
                <>
                  <StatsCard
                    label="Monthly Earnings"
                    value={creatorStats.monthlyEarnings}
                    icon={DollarSign}
                    iconColor="text-green-600"
                    prefix="NPR"
                    useBauhaus={true}
                    accentColor="#10b981"
                  />
                  <StatsCard
                    label="Supporters"
                    value={creatorStats.supporters}
                    icon={Users}
                    iconColor="text-blue-600"
                    useBauhaus={true}
                    accentColor="#3b82f6"
                  />
                  <StatsCard
                    label="Total Posts"
                    value={creatorStats.posts}
                    icon={FileText}
                    iconColor="text-purple-600"
                    useBauhaus={true}
                    accentColor="#8b5cf6"
                  />
                  <StatsCard
                    label="Total Earnings"
                    value={creatorStats.totalEarnings}
                    icon={Target}
                    iconColor="text-red-500"
                    prefix="NPR"
                    useBauhaus={true}
                    accentColor="#ef4444"
                  />
                </>
              )}
            </motion.div>

            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">Earnings Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">This Month</span>
                  <span className="font-semibold text-lg">
                    NPR {creatorStats.monthlyEarnings.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">All Time</span>
                  <span className="font-semibold text-lg">
                    NPR {creatorStats.totalEarnings.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Posts</h3>
                  <Button variant="ghost" size="sm" className="text-xs sm:text-sm">View All</Button>
                </div>
                <div className="space-y-4">
                  {recentPosts.length > 0 ? recentPosts.slice(0, 3).map((post: any) => (
                    <PostListItem
                      key={post.id}
                      id={post.id}
                      title={post.title}
                      type={post.image_url ? 'image' : 'text'}
                      likes={post.likes_count || 0}
                      comments={post.comments_count || 0}
                      createdAt={post.created_at || post.createdAt}
                    />
                  )) : (
                    <EmptyState
                      icon={FileText}
                      title="No posts yet"
                      description="Create your first post to share with your supporters"
                      actionLabel="Create Post"
                      onActionClick={() => setActiveTab('posts')}
                    />
                  )}
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Top Supporters</h3>
                  <Button variant="ghost" size="sm" className="text-xs sm:text-sm">View All</Button>
                </div>
                <div className="space-y-4">
                  {supporters.length > 0 ? supporters.slice(0, 5).map((supporter: any) => (
                    <SupporterListItem
                      key={supporter.id}
                      id={supporter.id}
                      name={supporter.name}
                      avatar={supporter.avatar}
                      amount={supporter.amount}
                      tier="Basic"
                      joined={supporter.joined}
                    />
                  )) : (
                    <EmptyState
                      icon={Users}
                      title="No supporters yet"
                      description="Share your profile to get started!"
                    />
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="posts" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Posts</h2>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Button variant="outline" size="sm" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Filter</span>
                </Button>
                <Button 
                  size="sm"
                  className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                  onClick={() => {
                    setTimeout(() => {
                      const postForm = document.getElementById('new-post-form');
                      if (postForm) {
                        postForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }}
                >
                  <PlusCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>New Post</span>
                </Button>
              </div>
            </div>

            {/* Quick Post Creator */}
            <Card id="new-post-form" className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">Create New Post</h3>
              <div className="space-y-4">
                <Input
                  placeholder="Post title..."
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="text-sm sm:text-base"
                />
                <Textarea
                  placeholder="Share your thoughts with your supporters..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={4}
                  className="text-sm sm:text-base"
                />
                {uploadedImageUrl && (
                  <div className="relative">
                    <img src={uploadedImageUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadedImageUrl('')}
                      className="absolute top-2 right-2"
                    >
                      Remove
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      id="photo-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      disabled={isUploadingImage}
                      className="flex items-center space-x-2"
                    >
                      {isUploadingImage ? <Upload className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                      <span>{isUploadingImage ? 'Uploading...' : 'Photo'}</span>
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={postVisibility}
                      onChange={(e) => setPostVisibility(e.target.value)}
                      className="px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-xs sm:text-sm"
                    >
                      <option value="public">Public</option>
                      <option value="supporters">Supporters Only</option>
                    </select>
                    <Button onClick={handlePublishPost} disabled={isPublishing} size="sm" className="text-xs sm:text-sm">
                      {isPublishing ? 'Publishing...' : 'Publish'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <div className="space-y-4 sm:space-y-6">
              {recentPosts.length > 0 ? recentPosts.map((post: any) => (
                <EnhancedPostCard 
                  key={post.id} 
                  post={{
                    id: post.id,
                    title: post.title,
                    content: post.content,
                    image_url: post.image_url,
                    media_url: post.media_url,
                    tier_required: post.tier_required || 'free',
                    created_at: post.created_at,
                    creator: post.creator || {
                      id: user?.id || '',
                      display_name: userProfile?.display_name || 'You',
                      photo_url: userProfile?.photo_url,
                      role: 'creator'
                    },
                    creator_profile: post.creator_profile || {
                      category: creatorProfile?.category || null,
                      is_verified: creatorProfile?.is_verified || false
                    },
                    likes_count: post.likes_count || 0,
                    comments_count: post.comments_count || 0
                  }}
                  currentUserId={user?.id}
                  showActions={true}
                />
              )) : (
                <Card className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No Posts Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Create your first post to share with your supporters
                  </p>
                  <Button onClick={() => setActiveTab('posts')}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Post
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="supporters" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Supporters</h2>
              <div className="flex items-center space-x-3">
                <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800">
                  <option>All Supporters</option>
                  <option>Gold Tier</option>
                  <option>Silver Tier</option>
                  <option>Bronze Tier</option>
                </select>
                <Button className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {supporters.length > 0 ? supporters.map((supporter: any) => (
                <Card key={supporter.id} className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {supporter.name[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {supporter.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Joined {new Date(supporter.joined).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Support Level</span>
                      <Badge 
                        variant={
                          supporter.tier === 'gold' ? 'default' : 
                          supporter.tier === 'silver' ? 'secondary' : 'outline'
                        }
                      >
                        {supporter.tier}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Monthly Support</span>
                      <span className="font-semibold text-green-600">
                        NPR {supporter.amount}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Message
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              )) : (
                <div className="col-span-3">
                  <EmptyState
                    icon={Users}
                    title="No Supporters Yet"
                    description="Share your profile to start receiving support!"
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics & Insights</h2>
              <select className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 w-full sm:w-auto">
                <option>Last 6 Months</option>
                <option>Last 3 Months</option>
                <option>Last Month</option>
              </select>
            </div>

            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">Growth Overview</h3>
              <div className="h-48 sm:h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">Analytics chart will be displayed here</p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <Card className="p-4 sm:p-6">
                <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">Top Performing Posts</h4>
                <div className="space-y-3">
                  {recentPosts.length > 0 ? (() => {
                    const topPosts = [...recentPosts]
                      .sort((a: any, b: any) => (b.likes_count || 0) - (a.likes_count || 0))
                      .slice(0, 3);
                    return topPosts.map((post: any) => (
                      <div key={post.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">{post.title || 'Untitled Post'}</span>
                        <span className="text-green-600 font-medium whitespace-nowrap">{post.likes_count || 0} likes</span>
                      </div>
                    ));
                  })() : (
                    <EmptyState
                      icon={FileText}
                      title="No posts yet"
                      description="Create your first post to see analytics"
                      actionLabel="Create Post"
                      onActionClick={() => setActiveTab('posts')}
                    />
                  )}
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">Supporter Growth</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Supporters</span>
                    <span className="font-medium text-blue-600">{creatorStats.supporters}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Posts</span>
                    <span className="font-medium text-green-600">{creatorStats.posts}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Followers</span>
                    <span className="font-medium">{creatorStats.followers}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">Engagement Stats</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Likes</span>
                    <span className="font-medium text-red-600">{analyticsData.totalLikes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Comments</span>
                    <span className="font-medium text-blue-600">{analyticsData.totalComments.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Avg. Likes/Post</span>
                    <span className="font-medium text-green-600">{analyticsData.avgLikesPerPost}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Engagement Rate</span>
                    <span className="font-medium text-purple-600">{analyticsData.engagementRate}%</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Goals & Milestones</h2>
              <Button className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Set New Goal</span>
              </Button>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Earnings Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">This Month</span>
                  <span className="font-semibold text-2xl">NPR {creatorStats.monthlyEarnings.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">All Time</span>
                  <span className="font-semibold text-2xl">NPR {creatorStats.totalEarnings.toLocaleString()}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Your Progress</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Supporters</span>
                  <span className="font-semibold">{creatorStats.supporters}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Posts</span>
                  <span className="font-semibold">{creatorStats.posts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Earnings</span>
                  <span className="font-semibold">NPR {creatorStats.totalEarnings.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Earnings & Payouts</h2>
              <div className="flex items-center space-x-3">
                <Button variant="outline" className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Download Report</span>
                </Button>
                <Button className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Request Payout</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Balance</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      NPR {creatorStats.totalEarnings.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">All time earnings</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      NPR {creatorStats.monthlyEarnings.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">This month</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Payout</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {supporters.length}
                    </p>
                    <p className="text-sm text-gray-500">Active supporters</p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Supporters</h3>
              <div className="space-y-4">
                {supporters.length > 0 ? supporters.slice(0, 5).map((supporter: any) => (
                  <div key={supporter.id} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {supporter.name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {supporter.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {supporter.tier} • {new Date(supporter.joined).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        NPR {supporter.amount}
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                    No supporters yet
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Payment Configuration</h2>
              <Badge variant="outline" className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Secure</span>
              </Badge>
            </div>

            {/* eSewa Merchant Integration */}
            <Card className="p-6 border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">eS</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">eSewa Merchant Integration</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Direct payment processing through eSewa ePay</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Merchant Configuration */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Merchant Account Settings</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Product Code
                    </label>
                    <input
                      type="text"
                      defaultValue="EPAYTEST"
                      placeholder="Your eSewa merchant product code"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-green-500 focus:outline-none cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use EPAYTEST for testing</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Secret Key
                    </label>
                    <input
                      type="password"
                      defaultValue="8gBm/:&EnhH.1/q"
                      placeholder="Your eSewa merchant secret key"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-green-500 focus:outline-none cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">Test key: 8gBm/:&EnhH.1/q</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Success URL
                    </label>
                    <input
                      type="url"
                      defaultValue={typeof window !== 'undefined' ? `${window.location.origin}/payment/success` : '/payment/success'}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-green-500 focus:outline-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Failure URL
                    </label>
                    <input
                      type="url"
                      defaultValue={typeof window !== 'undefined' ? `${window.location.origin}/payment/failure` : '/payment/failure'}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-green-500 focus:outline-none cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="merchant-mode"
                      className="w-4 h-4 text-green-600 cursor-pointer"
                    />
                    <label htmlFor="merchant-mode" className="text-sm text-gray-700 dark:text-gray-300">
                      I have an eSewa merchant account
                    </label>
                  </div>
                </div>

                {/* Test Credentials & Instructions */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">eSewa Test Credentials</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">eSewa ID:</span>
                      <span className="font-mono">9806800001-5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Password:</span>
                      <span className="font-mono">Nepal@123</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">MPIN:</span>
                      <span className="font-mono">1122</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Token:</span>
                      <span className="font-mono">123456</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                    <p className="text-yellow-800 dark:text-yellow-200">
                      <strong>Note:</strong> Supporters will be redirected to eSewa for secure payment, then returned to your success page.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Personal eSewa & QR Code Option */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-2xl">📱</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Personal eSewa & QR Payments</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">For creators without merchant accounts</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Personal eSewa Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="98XXXXXXXX"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Your personal eSewa registered number</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      eSewa QR Code
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                      <Upload className="mx-auto w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Upload your eSewa QR code
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Get your QR code from eSewa app → Profile → QR Code</p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">How Personal eSewa Works</h4>
                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-600">1.</span>
                      <span>Supporters see your eSewa QR code</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-600">2.</span>
                      <span>They scan with eSewa app</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-600">3.</span>
                      <span>Payment goes directly to your eSewa wallet</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-600">4.</span>
                      <span>Manual verification needed for platform tracking</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Khalti Integration */}
            <Card className="p-6 border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-sm">Khalti</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Khalti Payment Integration</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Alternative digital wallet option</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Khalti Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="98XXXXXXXX"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Khalti QR Code
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer">
                      <Upload className="mx-auto w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Upload your Khalti QR code
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Merchant Key (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="For API integration"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Khalti Integration Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">API integration in development</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">QR code payments available</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Flow Demonstration */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Payment Flow Preview</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This is how supporters will experience the payment process
              </p>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6">
                <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {userProfile.display_name?.[0] || 'C'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        Support {userProfile.display_name || 'Creator'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Choose payment method & amount</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <button className="w-full p-3 border-2 border-green-200 rounded-lg text-center hover:bg-green-50 transition-colors cursor-pointer bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-xs font-bold">eS</span>
                        </div>
                        <span className="font-medium">eSewa (Recommended)</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Instant payment processing</p>
                    </button>
                    
                    <button className="w-full p-3 border border-purple-200 rounded-lg text-center hover:bg-purple-50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 text-xs font-bold">K</span>
                        </div>
                        <span className="font-medium">Khalti</span>
                      </div>
                    </button>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Support Amount (NPR)</label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {[100, 500, 1000].map((amount) => (
                        <button key={amount} className="py-2 px-3 bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors cursor-pointer">
                          {amount}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      placeholder="Custom amount"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm cursor-pointer"
                    />
                  </div>

                  <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                    Pay with eSewa
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center mt-2">
                    You'll be redirected to eSewa for secure payment
                  </p>
                </div>
              </div>
            </Card>

            {/* Technical Implementation */}
            <Card className="p-6 bg-gray-50 dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Technical Implementation</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">eSewa ePay Integration</h4>
                  <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 font-mono overflow-x-auto">
                    <div className="text-green-400">// Payment Form Submission</div>
                    <div className="text-blue-400">const</div> <div className="text-yellow-400">paymentData</div> = {`{`}<br/>
                    &nbsp;&nbsp;<div className="text-red-400">amount</div>: <div className="text-green-300">'100'</div>,<br/>
                    &nbsp;&nbsp;<div className="text-red-400">product_code</div>: <div className="text-green-300">'EPAYTEST'</div>,<br/>
                    &nbsp;&nbsp;<div className="text-red-400">signature</div>: <div className="text-green-300">'HMAC_SHA256'</div><br/>
                    {`}`};
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Status Verification</h4>
                  <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 font-mono overflow-x-auto">
                    <div className="text-green-400">// Transaction Verification</div>
                    <div className="text-blue-400">GET</div> <div className="text-yellow-400">/api/epay/transaction/status/</div><br/>
                    <div className="text-gray-400">?product_code=EPAYTEST</div><br/>
                    <div className="text-gray-400">&total_amount=100</div><br/>
                    <div className="text-gray-400">&transaction_uuid=123</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Bank Transfer (Optional)</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">For supporters without digital wallets</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Add Bank Details
                  </Button>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">All payment data is encrypted</span>
                </div>
                <Button className="flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Save Payment Settings</span>
                </Button>
              </div>
            </Card>

            {/* Integration Guide */}
            <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-sm">📚</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">eSewa Integration Guide</h4>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">For Merchant Accounts:</h5>
                        <ul className="space-y-1">
                          <li>• Instant payment processing</li>
                          <li>• Automatic transaction verification</li>
                          <li>• Real-time payment notifications</li>
                          <li>• Platform fee: 2-3% per transaction</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">For Personal Accounts:</h5>
                        <ul className="space-y-1">
                          <li>• QR code-based payments</li>
                          <li>• Manual payment verification</li>
                          <li>• No additional merchant fees</li>
                          <li>• Best for smaller creators</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                      <p className="text-yellow-800 dark:text-yellow-200 text-xs">
                        <strong>Note:</strong> Test credentials provided. For production, creators need to register for eSewa merchant accounts or use personal QR codes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 