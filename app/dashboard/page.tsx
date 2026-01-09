"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { 
  Heart, 
  History,
  Calendar,
  DollarSign,
  Users,
  Search,
  Settings,
  ArrowRight,
  TrendingUp,
  MessageCircle,
  Star,
  Crown,
  Sparkles,
  FileText,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/supabase-auth-context';
import { useSupportHistory, useSupportedCreators } from '@/hooks/useSupporterDashboard';
import CreatorSearch from '@/components/social/CreatorSearch';
import { EnhancedCreatorCard } from '@/components/social/EnhancedCreatorCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ActivityItem } from '@/components/dashboard/ActivityItem';
import { LoadingSpinner } from '@/components/dashboard/LoadingSpinner';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { SupportHistoryItem } from '@/components/dashboard/SupportHistoryItem';
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard';

function SupportJourneyStats({ 
  supportHistory, 
  supportedCreators, 
  totalSupported 
}: { 
  supportHistory: Array<{ date: string; creator?: { id: string; name: string }; amount?: number }>;
  supportedCreators: Array<{ category?: string | null }>;
  totalSupported: number;
}) {
  const calculateFirstSupport = () => {
    if (!supportHistory || supportHistory.length === 0) return null;
    const dates = supportHistory.map(s => new Date(s.date)).sort((a, b) => a.getTime() - b.getTime());
    return dates[0];
  };

  const calculateMostSupportedCreator = () => {
    if (!supportHistory || supportHistory.length === 0) return null;
    const creatorMap = new Map<string, { name: string; total: number }>();
    
    supportHistory.forEach(support => {
      const creatorId = support.creator?.id;
      const creatorName = support.creator?.name || 'Unknown';
      if (creatorId) {
        const existing = creatorMap.get(creatorId);
        if (existing) {
          existing.total += support.amount || 0;
        } else {
          creatorMap.set(creatorId, { name: creatorName, total: support.amount || 0 });
        }
      }
    });

    let maxCreator = null;
    let maxTotal = 0;
    creatorMap.forEach((value) => {
      if (value.total > maxTotal) {
        maxTotal = value.total;
        maxCreator = value.name;
      }
    });

    return maxCreator;
  };

  const calculateFavoriteCategory = () => {
    if (!supportedCreators || supportedCreators.length === 0) return null;
    const categoryMap = new Map<string, number>();
    
    supportedCreators.forEach(creator => {
      const category = creator.category;
      if (category) {
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      }
    });

    let maxCategory = null;
    let maxCount = 0;
    categoryMap.forEach((count, category) => {
      if (count > maxCount) {
        maxCount = count;
        maxCategory = category;
      }
    });

    return maxCategory;
  };

  const calculateCommunityRank = () => {
    if (totalSupported === 0) return { rank: 'New Supporter', icon: Star, color: 'text-gray-500' };
    if (totalSupported < 1000) return { rank: 'Bronze Supporter', icon: Star, color: 'text-amber-600' };
    if (totalSupported < 5000) return { rank: 'Silver Supporter', icon: Star, color: 'text-gray-400' };
    if (totalSupported < 10000) return { rank: 'Gold Supporter', icon: Star, color: 'text-yellow-500' };
    if (totalSupported < 50000) return { rank: 'Platinum Supporter', icon: Crown, color: 'text-purple-500' };
    return { rank: 'Diamond Supporter', icon: Crown, color: 'text-blue-500' };
  };

  const firstSupport = calculateFirstSupport();
  const mostSupportedCreator = calculateMostSupportedCreator();
  const favoriteCategory = calculateFavoriteCategory();
  const communityRank = calculateCommunityRank();
  const RankIcon = communityRank.icon;

  return (
    <div className="space-y-4">
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <span className="text-gray-600 dark:text-gray-400">First Support</span>
        <span className="font-medium">
          {firstSupport 
            ? new Date(firstSupport).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : 'No support yet'}
        </span>
      </motion.div>
      
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-gray-600 dark:text-gray-400">Most Supported Creator</span>
        <span className="font-medium">
          {mostSupportedCreator || 'None yet'}
        </span>
      </motion.div>
      
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <span className="text-gray-600 dark:text-gray-400">Favorite Category</span>
        <span className="font-medium">
          {favoriteCategory || 'None yet'}
        </span>
      </motion.div>
      
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <span className="text-gray-600 dark:text-gray-400">Community Rank</span>
        <div className="flex items-center space-x-2">
          <RankIcon className={cn("w-4 h-4", communityRank.color)} />
          <span className="font-medium">{communityRank.rank}</span>
        </div>
      </motion.div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, userProfile, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardData, setDashboardData] = useState<{
    stats?: { totalSupported: number; creatorsSupported: number; thisMonth: number; favoriteCreators: number };
    followingCreators?: Array<unknown>;
    recentActivity?: Array<unknown>;
    feedPosts?: Array<unknown>;
    trendingPosts?: Array<unknown>;
  } | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const { history: supportHistory, loading: historyLoading } = useSupportHistory(20);
  const { creators: supportedCreators } = useSupportedCreators();

  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [loading, isAuthenticated, router]);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      if (isAuthenticated && user) {
        try {
          const response = await fetch('/api/dashboard/feed');
          if (response.ok) {
            const data = await response.json();
            setDashboardData(data);
          }
        } catch (error) {
          console.error('Failed to fetch dashboard data:', error);
        } finally {
          setDataLoading(false);
        }
      } else if (!isAuthenticated) {
        setDataLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 100);

    const refreshInterval = setInterval(() => {
      if (isAuthenticated && user) {
        fetchDashboardData();
      }
    }, 30000);

    return () => {
      clearTimeout(timer);
      clearInterval(refreshInterval);
    };
  }, [isAuthenticated, user]);

  const [authTimeout, setAuthTimeout] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAuthTimeout(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading && !authTimeout) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner size="lg" className="h-64" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !loading) {
    return null;
  }

  const displayName = userProfile?.display_name || user?.email?.split('@')[0] || 'User';

  const supporterStats = dashboardData?.stats || {
    totalSupported: 0,
    creatorsSupported: 0,
    thisMonth: 0,
    favoriteCreators: 0
  };

  const followingCreators = Array.isArray(dashboardData?.followingCreators) ? dashboardData.followingCreators : [];
  const recentActivity = Array.isArray(dashboardData?.recentActivity) ? dashboardData.recentActivity : [];
  const feedPosts = Array.isArray(dashboardData?.feedPosts) ? dashboardData.feedPosts : [];
  const trendingPosts = Array.isArray(dashboardData?.trendingPosts) ? dashboardData.trendingPosts : [];

  return (
    <div className={cn("min-h-screen", colors.bg.page)}>
      <Header />
      
      <div className={common.pageContainer}>
        <motion.div
          {...animations.fadeIn}
          className={spacing.section}
        >
          <div className={common.pageHeader}>
            <div className={common.headerTitle}>
              <div className={common.avatarContainer}>
                <Heart className={cn(responsive.iconMedium, "text-white")} />
              </div>
              <div className={common.headerContent}>
                <h1 className={cn(typography.h1, typography.truncate)}>
                  Dashboard
                </h1>
                <p className={cn(typography.body, typography.truncate)}>
                  Welcome back, {displayName}
                </p>
              </div>
            </div>
            
            <div className={common.buttonGroup}>
              <Button variant="outline" size="sm" className={common.iconButton}>
                <Settings className={responsive.buttonIcon} />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/creator')}
                size="sm"
                className={cn(common.iconButton, effects.gradient.red)}
              >
                <Crown className={responsive.buttonIcon} />
                <span className="hidden md:inline">Creator Dashboard</span>
                <span className="md:hidden">Creator</span>
              </Button>
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className={common.tabsContainer}>
          <TabsList className={responsive.tabList}>
            <TabsTrigger value="feed" className={responsive.tab}>Feed</TabsTrigger>
            <TabsTrigger value="following" className={responsive.tab}>Following</TabsTrigger>
            <TabsTrigger value="discover" className={responsive.tab}>Discover</TabsTrigger>
            <TabsTrigger value="history" className={responsive.tab}>History</TabsTrigger>
            <TabsTrigger value="stats" className={cn(responsive.tab, "w-full sm:w-auto")}>Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-6">
            {dataLoading && <LoadingSpinner className="py-8" />}
            <motion.div
              {...animations.fadeInDelayed}
              className={layout.gridCols4}
            >
              <StatsCard
                label="Following"
                value={supporterStats.favoriteCreators}
                icon={Users}
                iconColor="text-blue-600"
                useBauhaus={true}
                accentColor="#3b82f6"
              />
              <StatsCard
                label="This Month"
                value={supporterStats.thisMonth}
                icon={DollarSign}
                iconColor="text-green-600"
                prefix="NPR"
                useBauhaus={true}
                accentColor="#10b981"
              />
              <StatsCard
                label="Total Supported"
                value={supporterStats.totalSupported}
                icon={Heart}
                iconColor="text-red-500"
                prefix="NPR"
                useBauhaus={true}
                accentColor="#ef4444"
              />
              <StatsCard
                label="Favorites"
                value={supporterStats.favoriteCreators}
                icon={Star}
                iconColor="text-yellow-500"
                useBauhaus={true}
                accentColor="#f59e0b"
              />
            </motion.div>

            <div className={layout.gapLarge}>
              <h3 className={typography.h3}>Posts from Creators You Follow</h3>
              {feedPosts && Array.isArray(feedPosts) && feedPosts.length > 0 ? (
                feedPosts.map((post: Record<string, unknown>) => {
                  if (!post || !post.id) return null;
                  return (
                    <motion.div
                      key={post.id}
                      {...animations.fadeIn}
                    >
                      <EnhancedPostCard 
                        post={{
                          id: post.id,
                          title: post.title || 'Untitled',
                          content: post.content || '',
                          image_url: post.image_url,
                          media_url: post.media_url,
                          tier_required: post.tier_required || 'free',
                          created_at: post.created_at || post.createdAt || new Date().toISOString(),
                          creator: post.creator || {
                            id: post.creator_id || '',
                            display_name: post.creator?.display_name || 'Unknown',
                            photo_url: post.creator?.photo_url,
                            role: 'creator'
                          },
                          creator_profile: post.creator_profile || {
                            category: post.category || null,
                            is_verified: post.is_verified || false
                          },
                          likes_count: post.likes_count || post.likes?.length || 0,
                          comments_count: post.comments_count || post.comments?.length || 0
                        }}
                        currentUserId={user?.id}
                        showActions={true}
                      />
                    </motion.div>
                  );
                })
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No posts yet"
                  description="Follow creators to see their public posts here"
                  actionLabel="Explore Creators"
                  actionHref="/explore"
                />
              )}
            </div>

            {/* Trending Posts Section */}
            {trendingPosts && trendingPosts.length > 0 && (
              <div className={layout.gapLarge}>
                <div className="flex items-center justify-between">
                  <h3 className={typography.h3}>Trending Posts</h3>
                  <Badge variant="outline" className="text-xs">
                    Discover new creators
                  </Badge>
                </div>
                {trendingPosts.map((post: Record<string, unknown>) => {
                  if (!post || !post.id) return null;
                  return (
                    <motion.div
                      key={post.id}
                      {...animations.fadeIn}
                    >
                      <EnhancedPostCard 
                        post={{
                          id: post.id,
                          title: post.title || 'Untitled',
                          content: post.content || '',
                          image_url: post.image_url,
                          media_url: post.media_url,
                          tier_required: post.tier_required || 'free',
                          created_at: post.created_at || post.createdAt || new Date().toISOString(),
                          creator: post.creator || {
                            id: post.creator_id || '',
                            display_name: post.creator?.display_name || 'Unknown',
                            photo_url: post.creator?.photo_url,
                            role: 'creator'
                          },
                          creator_profile: post.creator_profile || {
                            category: post.category || null,
                            is_verified: post.is_verified || false
                          },
                          likes_count: post.likes_count || post.likes?.length || 0,
                          comments_count: post.comments_count || post.comments?.length || 0
                        }}
                        currentUserId={user?.id}
                        showActions={true}
                      />
                    </motion.div>
                  );
                })}
              </div>
            )}

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h3>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </Button>
              </div>
              <div className="space-y-6">
                {recentActivity.length === 0 ? (
                  <EmptyState
                    icon={MessageCircle}
                    title="No recent activity"
                    description="Follow creators and support them to see activity here"
                  />
                ) : (
                  recentActivity && Array.isArray(recentActivity) && recentActivity.map((activity: Record<string, unknown>) => {
                    if (!activity) return null;
                    return (
                      <ActivityItem
                        key={activity.id || activity.date}
                        id={activity.id || activity.date}
                        creator={activity.creator}
                        creatorId={activity.creatorId}
                        action={activity.action}
                        title={activity.title}
                        time={activity.time}
                        type={activity.type}
                        amount={activity.amount}
                        content={activity.content}
                        likes={activity.likes}
                        comments={activity.comments}
                        imageUrl={activity.imageUrl}
                        postId={activity.postId}
                      />
                    );
                  })
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="following" className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Creators You Follow</h2>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search creators..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {followingCreators && Array.isArray(followingCreators) && followingCreators.length > 0 ? followingCreators.map((creator: Record<string, unknown>, index: number) => {
                if (!creator) return null;
                return (
                  <EnhancedCreatorCard
                    key={creator.id || creator.user_id || `creator-${index}`}
                    creator={{
                      user_id: creator.id || creator.user_id || '',
                      display_name: creator.name || creator.display_name || 'Unknown',
                      avatar_url: creator.avatar || creator.avatar_url,
                      bio: creator.category || creator.bio || null,
                      follower_count: creator.supporters || creator.follower_count || 0,
                      following_count: creator.following_count || 0,
                      posts_count: creator.posts_count || 0,
                      total_earned: creator.total_earned || 0,
                      created_at: creator.created_at || '',
                      isFollowing: true
                    }}
                  />
                );
              }) : (
                <div className="col-span-3">
                  <EmptyState
                    icon={Users}
                    title="No creators yet"
                    description="Start following creators to see them here"
                    actionLabel="Explore Creators"
                    actionHref="/explore"
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="discover" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Discover Creators</h2>
              <Button className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Trending</span>
              </Button>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Find New Creators
              </h3>
              <CreatorSearch placeholder="Search creators by name, category, or tags..." />
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Trending Creators
                </h3>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="col-span-3 text-center p-8">
                  <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Discover New Creators
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Explore trending creators and find new people to support
                  </p>
                  <Link href="/explore">
                    <Button>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Explore Now
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Browse by Category
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {['Art', 'Music', 'Photography', 'Writing', 'Cooking', 'Tech', 'Fashion', 'Travel'].map((category) => (
                  <Button key={category} variant="outline" className="justify-center">
                    {category}
                  </Button>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Success Stories
              </h3>
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Rajesh Thapa reached his monthly goal!
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Thanks to 47 supporters, Rajesh can now focus full-time on his digital art.
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Priya Sharma launched her photography workshop
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Community support helped her organize a workshop for 25 aspiring photographers.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Support History</h2>
              <Button className="flex items-center space-x-2">
                <History className="w-4 h-4" />
                <span>Download Report</span>
              </Button>
            </div>

            <Card className="p-6">
              {historyLoading ? (
                <LoadingSpinner className="py-8" />
              ) : supportHistory.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="No support history yet"
                  description="Support creators to see your history here"
                  actionLabel="Explore Creators"
                  actionHref="/explore"
                />
              ) : (
                <div className="space-y-4">
                  {supportHistory && Array.isArray(supportHistory) && supportHistory.map((support) => {
                    if (!support || !support.id) return null;
                    return (
                      <SupportHistoryItem
                        key={support.id}
                        id={support.id}
                        creator={support.creator}
                        amount={support.amount}
                        message={support.message}
                        date={support.date}
                        status={support.status}
                      />
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Impact</h2>
              <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800">
                <option>All Time</option>
                <option>This Year</option>
                <option>This Month</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Contributions</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      NPR {supporterStats.totalSupported.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Creators Supported</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {supporterStats.creatorsSupported}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Support</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      NPR 750
                    </p>
                  </div>
                  <Heart className="w-8 h-8 text-red-500" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Support Streak</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      3 months
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Your Support Journey
              </h3>
              <SupportJourneyStats 
                supportHistory={supportHistory}
                supportedCreators={supportedCreators}
                totalSupported={supporterStats.totalSupported}
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 
