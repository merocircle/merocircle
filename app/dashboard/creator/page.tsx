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
  Camera,
  Video,
  FileText,
  Bell,
  CreditCard,
  Target,
  Upload,
  Play,
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
  Save
} from 'lucide-react';
import { useAuth } from '@/contexts/supabase-auth-context';

export default function CreatorDashboard() {
  const { user, userProfile, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  // CRITICAL SECURITY: Role-based access control
  React.useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        console.log('Not authenticated, redirecting to login');
        router.push('/login');
      } else if (userProfile) {
        // SECURITY CHECK: Only users with role 'creator' can access this page
        if (userProfile.role !== 'creator') {
          console.log('SECURITY VIOLATION: User with role', userProfile.role, 'trying to access creator dashboard');
          console.log('Redirecting to correct dashboard...');
          if (userProfile.role === 'user') {
            router.push('/dashboard/supporter');
          } else {
            router.push('/dashboard'); // Fallback to main dashboard for unknown roles
          }
          return;
        }
        console.log('Access granted: User has correct role (creator)');
      }
    }
  }, [loading, isAuthenticated, userProfile, router]);

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

  if (!isAuthenticated || !userProfile) {
    return null;
  }

  // Mock data - in real app, this would come from your database
  const creatorStats = {
    monthlyEarnings: 45000,
    totalEarnings: 320000,
    supporters: 1247,
    posts: 89,
    goals: {
      monthly: 50000,
      current: 32000
    },
    growth: {
      earnings: 12.5,
      supporters: 8.3,
      engagement: 15.7
    }
  };

  const recentPosts = [
    {
      id: 1,
      title: 'Behind the scenes of my latest artwork',
      content: 'Here\'s a glimpse into my creative process...',
      type: 'image',
      likes: 124,
      comments: 18,
      views: 856,
      createdAt: '2 hours ago',
      isPublic: true
    },
    {
      id: 2,
      title: 'New music track preview',
      content: 'Working on something special for you all...',
      type: 'audio',
      likes: 89,
      comments: 12,
      views: 432,
      createdAt: '1 day ago',
      isPublic: false
    },
    {
      id: 3,
      title: 'Photography workshop announcement',
      content: 'Excited to share my knowledge with the community...',
      type: 'text',
      likes: 67,
      comments: 23,
      views: 1234,
      createdAt: '3 days ago',
      isPublic: true
    },
  ];

  const supporters = [
    { name: 'Ramesh Sharma', amount: 1000, tier: 'Gold', joined: '2023-06', avatar: '/api/placeholder/32/32' },
    { name: 'Sita Maharjan', amount: 750, tier: 'Silver', joined: '2023-08', avatar: '/api/placeholder/32/32' },
    { name: 'Bikash Thapa', amount: 500, tier: 'Bronze', joined: '2023-09', avatar: '/api/placeholder/32/32' },
    { name: 'Maya Gurung', amount: 1200, tier: 'Gold', joined: '2023-07', avatar: '/api/placeholder/32/32' },
    { name: 'Arjun Nepal', amount: 300, tier: 'Bronze', joined: '2023-10', avatar: '/api/placeholder/32/32' },
  ];

  const monthlyData = [
    { month: 'Jan', earnings: 25000, supporters: 890 },
    { month: 'Feb', earnings: 28000, supporters: 920 },
    { month: 'Mar', earnings: 32000, supporters: 980 },
    { month: 'Apr', earnings: 35000, supporters: 1050 },
    { month: 'May', earnings: 38000, supporters: 1150 },
    { month: 'Jun', earnings: 42000, supporters: 1247 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Creator Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Creator Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Welcome back, {userProfile.display_name || userProfile.email?.split('@')[0] || 'Creator'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Button>
              <Button className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-600">
                <PlusCircle className="w-4 h-4" />
                <span>New Post</span>
              </Button>
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="supporters">Supporters</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Earnings</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      NPR {creatorStats.monthlyEarnings.toLocaleString()}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500">+{creatorStats.growth.earnings}%</span>
                    </div>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Supporters</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {creatorStats.supporters.toLocaleString()}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500">+{creatorStats.growth.supporters}%</span>
                    </div>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Posts</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {creatorStats.posts}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500">+{creatorStats.growth.engagement}%</span>
                    </div>
                  </div>
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Earnings</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      NPR {creatorStats.totalEarnings.toLocaleString()}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500">All time</span>
                    </div>
                  </div>
                  <Target className="w-8 h-8 text-red-500" />
                </div>
              </Card>
            </motion.div>

            {/* Goal Progress */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Goal Progress</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Current Progress</span>
                  <span className="font-medium">
                    NPR {creatorStats.goals.current.toLocaleString()} / {creatorStats.goals.monthly.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-pink-600 h-3 rounded-full"
                    style={{ width: `${(creatorStats.goals.current / creatorStats.goals.monthly) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {Math.round((creatorStats.goals.current / creatorStats.goals.monthly) * 100)}% complete • 
                  NPR {(creatorStats.goals.monthly - creatorStats.goals.current).toLocaleString()} remaining
                </p>
              </div>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Posts</h3>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
                <div className="space-y-4">
                  {recentPosts.slice(0, 3).map((post) => (
                    <div key={post.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        {post.type === 'image' && <Camera className="w-4 h-4 text-white" />}
                        {post.type === 'audio' && <Play className="w-4 h-4 text-white" />}
                        {post.type === 'text' && <FileText className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{post.title}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                          <span>{post.likes} likes</span>
                          <span>{post.comments} comments</span>
                          <span>{post.views} views</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Supporters</h3>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
                <div className="space-y-4">
                  {supporters.slice(0, 5).map((supporter, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {supporter.name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{supporter.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{supporter.tier} Supporter</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600 text-sm">NPR {supporter.amount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Posts</h2>
              <div className="flex items-center space-x-3">
                <Button variant="outline" className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </Button>
                <Button className="flex items-center space-x-2">
                  <PlusCircle className="w-4 h-4" />
                  <span>New Post</span>
                </Button>
              </div>
            </div>

            {/* Quick Post Creator */}
            <Card className="p-6">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <Camera className="w-4 h-4" />
                      <span>Photo</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <Video className="w-4 h-4" />
                      <span>Video</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Document</span>
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm">
                      <option>Public</option>
                      <option>Supporters Only</option>
                      <option>Premium Supporters</option>
                    </select>
                    <Button>Publish</Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Posts List */}
            <div className="space-y-6">
              {recentPosts.map((post) => (
                <Card key={post.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                        {post.type === 'image' && <Camera className="w-5 h-5 text-white" />}
                        {post.type === 'audio' && <Play className="w-5 h-5 text-white" />}
                        {post.type === 'text' && <FileText className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{post.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{post.createdAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={post.isPublic ? "default" : "secondary"}>
                        {post.isPublic ? "Public" : "Supporters Only"}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{post.content}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{post.likes} likes</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments} comments</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{post.views} views</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="flex items-center space-x-1">
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center space-x-1">
                        <Share2 className="w-3 h-3" />
                        <span>Share</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Supporters Tab */}
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
              {supporters.map((supporter, index) => (
                <Card key={index} className="p-6">
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
                        Joined {supporter.joined}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Support Level</span>
                      <Badge 
                        variant={
                          supporter.tier === 'Gold' ? 'default' : 
                          supporter.tier === 'Silver' ? 'secondary' : 'outline'
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
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics & Insights</h2>
              <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800">
                <option>Last 6 Months</option>
                <option>Last 3 Months</option>
                <option>Last Month</option>
              </select>
            </div>

            {/* Growth Chart Placeholder */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Growth Overview</h3>
              <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">Analytics chart will be displayed here</p>
                </div>
              </div>
            </Card>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Performing Posts</h4>
                <div className="space-y-3">
                  {recentPosts.slice(0, 3).map((post, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300 truncate">{post.title}</span>
                      <span className="text-green-600 font-medium">{post.views} views</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Supporter Growth</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">New This Month</span>
                    <span className="font-medium text-blue-600">+47</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Retention Rate</span>
                    <span className="font-medium text-green-600">94%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Avg. Support</span>
                    <span className="font-medium">NPR 680</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Engagement Stats</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Avg. Likes/Post</span>
                    <span className="font-medium">93</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Avg. Comments/Post</span>
                    <span className="font-medium">18</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Response Rate</span>
                    <span className="font-medium text-green-600">87%</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Goals & Milestones</h2>
              <Button className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Set New Goal</span>
              </Button>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Current Monthly Goal</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Target Amount</span>
                  <span className="font-semibold text-2xl">NPR {creatorStats.goals.monthly.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-pink-600 h-4 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${(creatorStats.goals.current / creatorStats.goals.monthly) * 100}%` }}
                  >
                    <span className="text-white text-xs font-medium">
                      {Math.round((creatorStats.goals.current / creatorStats.goals.monthly) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    NPR {creatorStats.goals.current.toLocaleString()} raised
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    NPR {(creatorStats.goals.monthly - creatorStats.goals.current).toLocaleString()} remaining
                  </span>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Milestone Progress</h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">First 100 Supporters</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Achieved 6 months ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">NPR 10,000 Monthly</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Achieved 4 months ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">⋯</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">1,000 Supporters</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">247 supporters to go</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Upcoming Rewards</h4>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="font-medium">Exclusive Workshop</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">At NPR 50,000 monthly</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(creatorStats.goals.current / 50000) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="font-medium">Premium Content Series</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">At 1,500 supporters</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${(creatorStats.supporters / 1500) * 100}%` }}
                      ></div>
                    </div>
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
                      NPR {(creatorStats.monthlyEarnings * 0.85).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">After platform fees</p>
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
                    <p className="text-sm text-green-500">+12.5% from last month</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Payout</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      NPR 38,250
                    </p>
                    <p className="text-sm text-gray-500">15 days ago</p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Transactions</h3>
              <div className="space-y-4">
                {[
                  { supporter: 'Ramesh Sharma', amount: 1000, date: '2024-01-15', type: 'Monthly Support' },
                  { supporter: 'Sita Maharjan', amount: 750, date: '2024-01-14', type: 'One-time Tip' },
                  { supporter: 'Bikash Thapa', amount: 500, date: '2024-01-13', type: 'Monthly Support' },
                  { supporter: 'Maya Gurung', amount: 1200, date: '2024-01-12', type: 'Premium Tier' },
                ].map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {transaction.supporter[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {transaction.supporter}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {transaction.type} • {transaction.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        +NPR {transaction.amount}
                      </p>
                    </div>
                  </div>
                ))}
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
                      defaultValue={`${window.location.origin}/payment/success`}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-green-500 focus:outline-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Failure URL
                    </label>
                    <input
                      type="url"
                      defaultValue={`${window.location.origin}/payment/failure`}
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