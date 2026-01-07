"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Wallet,
  BarChart3,
  Heart, 
  Eye,
  History,
  Calendar,
  DollarSign,
  Users,
  Search,
  User,
  Settings,
  ArrowRight,
  TrendingUp,
  MessageCircle,
  Star,
  Crown,
  Sparkles,
  Share2,
  Gift,
  Clock,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Plus,
  Filter,
  Bell,
  Bookmark,
  Trophy,
  Target,
  PieChart,
  Coins,
  CreditCard,
  Zap,
  Flame,
  Camera,
  Play,
  Music,
  Palette,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Minus,
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/supabase-auth-context';
import { useCreatorSearch } from '@/hooks/useSocial';
import CreatorSearch from '@/components/social/CreatorSearch';
import CreatorCard from '@/components/social/CreatorCard';

export default function DashboardPage() {
  const { user, userProfile, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Redirect to login if not authenticated (only after loading completes)
  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Fetch dashboard data
  React.useEffect(() => {
    const fetchDashboardData = async () => {
      if (isAuthenticated && userProfile) {
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
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, userProfile]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated after loading, don't render (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Use fallback display name if profile is still loading (auth context will create it)
  const displayName = userProfile?.display_name || user?.email?.split('@')[0] || 'User';

  // Get data from API (loaded via useEffect)
  const supporterStats = dashboardData?.stats || {
    totalSupported: 0,
    creatorsSupported: 0,
    thisMonth: 0,
    favoriteCreators: 0
  };

  const followingCreators = dashboardData?.followingCreators || [];
  const recentActivity = dashboardData?.recentActivity || [];
  
  const supportHistory = []; // TODO: Add support history API
  const discoverCreators = []; // Will be loaded from discover API

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Welcome back, {displayName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/creator')}
                className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-600"
              >
                <Crown className="w-4 h-4" />
                <span>Creator Dashboard</span>
              </Button>
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="feed">Activity Feed</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="history">Support History</TabsTrigger>
            <TabsTrigger value="stats">My Stats</TabsTrigger>
          </TabsList>

          {/* Activity Feed Tab */}
          <TabsContent value="feed" className="space-y-6">
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Following</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {supporterStats.creatorsSupported}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      NPR {supporterStats.thisMonth.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Supported</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      NPR {supporterStats.totalSupported.toLocaleString()}
                    </p>
                  </div>
                  <Heart className="w-8 h-8 text-red-500" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Favorites</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {supporterStats.favoriteCreators}
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-500" />
                </div>
              </Card>
            </motion.div>

            {/* Activity Feed */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h3>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </Button>
              </div>
              
              <div className="space-y-6">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4 pb-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <Link href={`/creator/${activity.creatorId}`}>
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                        <span className="text-white text-sm font-medium">
                          {activity.creator[0]}
                        </span>
                      </div>
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Link href={`/creator/${activity.creatorId}`}>
                          <span className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 cursor-pointer transition-colors">
                            {activity.creator}
                          </span>
                        </Link>
                        <span className="text-gray-600 dark:text-gray-400">
                          {activity.action}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-500">
                          {activity.time}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {activity.title}
                      </h4>
                      <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
                        {activity.type === 'image' && <Camera className="w-8 h-8 text-gray-400" />}
                        {activity.type === 'video' && <Play className="w-8 h-8 text-gray-400" />}
                        {activity.type === 'audio' && <FileText className="w-8 h-8 text-gray-400" />}
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{activity.likes}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{activity.comments}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="following" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Creators You Support</h2>
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
              {followingCreators.length > 0 ? followingCreators.map((creator: any, index: number) => (
                <Card key={creator.user_id || creator.id || `creator-${index}`} className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Link href={`/creator/${creator.user_id || creator.id}`}>
                      <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-red-500 transition-all">
                        <span className="text-white font-medium">
                          {creator.name[0]}
                        </span>
                      </div>
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Link href={`/creator/${creator.user_id || creator.id}`}>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 cursor-pointer transition-colors">
                            {creator.name}
                          </h3>
                        </Link>
                        {creator.isVerified && (
                          <Crown className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {creator.category} • {creator.supporters} supporters
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Monthly Goal</span>
                      <span className="font-medium">
                        NPR {creator.currentAmount.toLocaleString()} / {creator.monthlyGoal.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-pink-600 h-2 rounded-full"
                        style={{ width: `${(creator.currentAmount / creator.monthlyGoal) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {creator.posts_count || 0} posts
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <Link href={`/creator/${creator.user_id || creator.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center space-x-1">
                          <Gift className="w-3 h-3" />
                          <span>View Profile</span>
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm">
                        <Bookmark className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )) : (
                <Card className="p-8 col-span-3 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No creators yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Start following creators to see them here
                  </p>
                  <Link href="/explore">
                    <Button>
                      Explore Creators
                    </Button>
                  </Link>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Discover Creators</h2>
              <Button className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Trending</span>
              </Button>
            </div>

            {/* Creator Search */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Find New Creators
              </h3>
              <CreatorSearch placeholder="Search creators by name, category, or tags..." />
            </Card>

            {/* Trending Creators */}
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

            {/* Categories */}
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

            {/* Success Stories */}
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

          {/* Support History Tab */}
          <TabsContent value="history" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Support History</h2>
              <Button className="flex items-center space-x-2">
                <History className="w-4 h-4" />
                <span>Download Report</span>
              </Button>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                {supportHistory.map((support, index) => (
                  <div key={index} className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {support.creator[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {support.creator}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {support.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {support.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        NPR {support.amount}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* My Stats Tab */}
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">First Support</span>
                  <span className="font-medium">June 2023</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Most Supported Creator</span>
                  <span className="font-medium">Rajesh Thapa</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Favorite Category</span>
                  <span className="font-medium">Digital Art</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Community Rank</span>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">Gold Supporter</span>
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
