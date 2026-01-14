"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SidebarNav } from '@/components/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
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
  Calendar,
  FileText,
  CreditCard,
  Target,
  Upload,
  Download,
  Filter,
  Shield,
  Phone,
  Save,
  Camera,
  MoreHorizontal,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/supabase-auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { LoadingSpinner } from '@/components/dashboard/LoadingSpinner';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PostListItem } from '@/components/dashboard/PostListItem';
import { SupporterListItem } from '@/components/dashboard/SupporterListItem';
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard';
import { cn } from '@/lib/utils';

export default function CreatorDashboard() {
  const { user, userProfile, creatorProfile, isAuthenticated, loading, createCreatorProfile, isCreator } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [postVisibility, setPostVisibility] = useState('public');
  const [registrationData, setRegistrationData] = useState({
    bio: '',
    category: ''
  });
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<{
    stats?: { monthlyEarnings: number; totalEarnings: number; supporters: number; posts: number };
    posts?: Array<{
      id: string;
      title: string;
      content: string;
      image_url?: string | null;
      media_url?: string | null;
      tier_required?: string;
      likes_count?: number;
      comments_count?: number;
      created_at?: string;
      createdAt?: string;
      creator?: { id: string; display_name: string; photo_url?: string | null; role?: string };
      creator_profile?: { category?: string | null; is_verified?: boolean };
    }>;
    supporters?: Array<{
      id: string;
      name: string;
      avatar?: string | null;
      amount: number;
      joined?: string;
      tier?: string;
    }>;
  } | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const creatorStats = dashboardData?.stats || {
    monthlyEarnings: 0,
    totalEarnings: 0,
    supporters: 0,
    posts: 0
  };

  const recentPosts = dashboardData?.posts || [];
  const supporters = dashboardData?.supporters || [];

  const analyticsData = React.useMemo(() => {
    const totalLikes = recentPosts.reduce((sum: number, post: { likes_count?: number }) => sum + (post.likes_count || 0), 0);
    const totalComments = recentPosts.reduce((sum: number, post: { comments_count?: number }) => sum + (post.comments_count || 0), 0);
    const avgLikesPerPost = recentPosts.length > 0 ? Math.round(totalLikes / recentPosts.length) : 0;
    const avgCommentsPerPost = recentPosts.length > 0 ? Math.round(totalComments / recentPosts.length) : 0;
    const engagementRate = recentPosts.length > 0 && creatorStats.supporters > 0 
      ? ((totalLikes + totalComments) / creatorStats.supporters * 100).toFixed(1)
      : '0';

    return {
      totalLikes,
      totalComments,
      avgLikesPerPost,
      avgCommentsPerPost,
      engagementRate
    };
  }, [recentPosts, creatorStats.supporters]);

  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [loading, isAuthenticated, router]);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      const isUserCreator = isCreator || userProfile?.role === 'creator';
      
      if (isAuthenticated && userProfile && isUserCreator && user?.id) {
        setDataLoading(true);
        try {
          const response = await fetch(`/api/creator/${user.id}/dashboard`);
          if (response.ok) {
            const data = await response.json();
            setDashboardData(data);
          } else {
            setDashboardData({
              stats: {
                monthlyEarnings: 0,
                totalEarnings: 0,
                supporters: 0,
                posts: 0
              },
              posts: [],
              supporters: []
            });
          }
        } catch (error) {
          console.error('Failed to fetch dashboard data:', error);
          setDashboardData({
            stats: {
              monthlyEarnings: 0,
              totalEarnings: 0,
              supporters: 0,
              posts: 0,
              followers: 0
            },
            posts: [],
            supporters: []
          });
        } finally {
          setDataLoading(false);
        }
      } else if (isAuthenticated && userProfile && !isUserCreator) {
        setDataLoading(false);
        setDashboardData(null);
      } else if (!isAuthenticated || !userProfile) {
        setDataLoading(true);
      }
    };

    fetchDashboardData();
    
    const refreshInterval = setInterval(() => {
      const isUserCreator = isCreator || userProfile?.role === 'creator';
      if (isAuthenticated && userProfile && isUserCreator && user?.id) {
        fetchDashboardData();
      }
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, userProfile, creatorProfile, isCreator, user?.id]);

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
        setRegistrationLoading(false);
      } else {
        setRegistrationData({ bio: '', category: '' });
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to register as creator:', error);
      alert('Failed to register as creator. Please try again.');
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

  if (loading || !isAuthenticated || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
        <SidebarNav />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  const isUserCreator = isCreator || userProfile?.role === 'creator';
  
  // Not a creator - show registration form
  if (!isUserCreator) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
        <SidebarNav />
        <main className="flex-1 overflow-y-auto flex items-center justify-center p-8">
          <Card className="max-w-2xl w-full p-8">
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

            <form onSubmit={(e) => {
              e.preventDefault();
              handleRegisterAsCreator();
            }} className="space-y-6">
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
                  required
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
                  required
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
                  type="submit"
                  disabled={registrationLoading || !registrationData.bio || !registrationData.category}
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
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </main>
      </div>
    );
  }

  // Creator Dashboard
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <SidebarNav />
      
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Creator Studio
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Welcome back, {userProfile.display_name || userProfile.email?.split('@')[0] || 'Creator'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/creator/${user?.id}`)}
                >
                  View Profile
                </Button>
                <Button 
                  size="sm"
                  className="bg-red-500 hover:bg-red-600"
                  onClick={() => setActiveTab('posts')}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="supporters">Supporters</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {dataLoading ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i} className="p-6">
                        <Skeleton className="h-20 w-full" />
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
                  </>
                )}
              </motion.div>

              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('posts')}
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span className="text-sm">Create Post</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('supporters')}
                  >
                    <Users className="w-5 h-5" />
                    <span className="text-sm">View Supporters</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span className="text-sm">Analytics</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('earnings')}
                  >
                    <DollarSign className="w-5 h-5" />
                    <span className="text-sm">Earnings</span>
                  </Button>
                </div>
              </Card>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Posts</h3>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('posts')}>
                      View All
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {recentPosts.length > 0 ? recentPosts.slice(0, 3).map((post) => (
                      <PostListItem
                        key={post.id}
                        id={post.id}
                        title={post.title}
                        type={post.image_url ? 'image' : 'text'}
                        likes={post.likes_count || 0}
                        comments={post.comments_count || 0}
                        createdAt={post.created_at || post.createdAt || ''}
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

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Supporters</h3>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('supporters')}>
                      View All
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {supporters.length > 0 ? supporters.slice(0, 5).map((supporter) => (
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

            {/* Posts Tab */}
            <TabsContent value="posts" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Posts</h2>
                <Button size="sm" onClick={() => {
                  setTimeout(() => {
                    document.getElementById('new-post-form')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              </div>

              {/* Quick Post Creator */}
              <Card id="new-post-form" className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Create New Post</h3>
                <div className="space-y-4">
                  <Input
                    placeholder="Post title..."
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="Share your thoughts with your supporters..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={4}
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
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                      >
                        <option value="public">Public</option>
                        <option value="supporters">Supporters Only</option>
                      </select>
                      <Button onClick={handlePublishPost} disabled={isPublishing} size="sm">
                        {isPublishing ? 'Publishing...' : 'Publish'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Posts List */}
              <div className="space-y-6">
                {recentPosts.length > 0 ? recentPosts.map((post) => (
                  <EnhancedPostCard 
                    key={post.id} 
                    post={{
                      id: post.id,
                      title: post.title,
                      content: post.content,
                      image_url: post.image_url || undefined,
                      media_url: post.media_url || undefined,
                      tier_required: post.tier_required || 'free',
                      created_at: post.created_at || '',
                      creator: {
                        id: post.creator?.id || user?.id || '',
                        display_name: post.creator?.display_name || userProfile?.display_name || 'You',
                        photo_url: post.creator?.photo_url || userProfile?.photo_url || undefined,
                        role: post.creator?.role || 'creator'
                      },
                      creator_profile: {
                        category: post.creator_profile?.category || creatorProfile?.category || undefined,
                        is_verified: post.creator_profile?.is_verified ?? creatorProfile?.is_verified ?? false
                      },
                      likes_count: post.likes_count || 0,
                      comments_count: post.comments_count || 0
                    }}
                    currentUserId={user?.id}
                    showActions={true}
                  />
                )) : (
                  <Card className="p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No Posts Yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Create your first post to share with your supporters
                    </p>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Supporters Tab */}
            <TabsContent value="supporters" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Supporters</h2>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {supporters.length > 0 ? supporters.map((supporter) => (
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
                          Joined {supporter.joined ? new Date(supporter.joined).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
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

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics & Insights</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Engagement Stats</h4>
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

                <Card className="p-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Growth Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Supporters</span>
                      <span className="font-medium text-blue-600">{creatorStats.supporters}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Posts</span>
                      <span className="font-medium text-green-600">{creatorStats.posts}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">This Month</span>
                      <span className="font-medium text-green-600">NPR {creatorStats.monthlyEarnings.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">All Time</span>
                      <span className="font-medium">NPR {creatorStats.totalEarnings.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Earnings Tab */}
            <TabsContent value="earnings" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Earnings & Payouts</h2>
                <div className="flex items-center space-x-3">
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                  <Button>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Request Payout
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Earnings</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        NPR {creatorStats.totalEarnings.toLocaleString()}
                      </p>
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
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Supporters</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {supporters.length}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                </Card>
              </div>
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

              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold text-lg">eS</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">eSewa Integration</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Configure your eSewa payment settings</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Payment integration settings will be available here. Contact support for merchant account setup.
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
