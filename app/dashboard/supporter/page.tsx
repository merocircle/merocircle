"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';

export default function SupporterDashboard() {
  const router = useRouter();

  // Redirect to main dashboard
  React.useEffect(() => {
    if (!loading) {
      router.replace('/dashboard');
    }
  }, [loading, router]);

  // Show loading while redirecting
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

  // Mock data - in real app, this would come from your database
  const supporterStats = {
    totalSupported: 15000,
    creatorsSupported: 8,
    thisMonth: 3500,
    favoriteCreators: 12
  };

  const followingCreators = [
    { 
      id: 1,
      name: 'Rajesh Thapa', 
      category: 'Digital Art', 
      avatar: '/api/placeholder/48/48',
      supporters: 1247,
      monthlyGoal: 50000,
      currentAmount: 32000,
      lastPost: '2 hours ago',
      isVerified: true,
      tier: 'Gold Supporter'
    },
    { 
      id: 2,
      name: 'Priya Sharma', 
      category: 'Photography', 
      avatar: '/api/placeholder/48/48',
      supporters: 892,
      monthlyGoal: 30000,
      currentAmount: 18500,
      lastPost: '5 hours ago',
      isVerified: true,
      tier: 'Silver Supporter'
    },
    { 
      id: 3,
      name: 'Amit Nepal', 
      category: 'Music', 
      avatar: '/api/placeholder/48/48',
      supporters: 2103,
      monthlyGoal: 75000,
      currentAmount: 65000,
      lastPost: '1 day ago',
      isVerified: false,
      tier: 'Bronze Supporter'
    },
  ];

  const recentActivity = [
    {
      creator: 'Rajesh Thapa',
      action: 'posted new artwork',
      title: 'Mountain Landscape Series',
      time: '2 hours ago',
      type: 'image',
      likes: 124,
      comments: 18
    },
    {
      creator: 'Priya Sharma',
      action: 'shared behind the scenes',
      title: 'Photography Workshop Setup',
      time: '5 hours ago',
      type: 'video',
      likes: 89,
      comments: 12
    },
    {
      creator: 'Amit Nepal',
      action: 'released new track',
      title: 'Himalayan Dreams',
      time: '1 day ago',
      type: 'audio',
      likes: 256,
      comments: 34
    },
  ];

  const { history: supportHistory, loading: historyLoading } = useSupportHistory(20);

  const discoverCreators = [
    {
      name: 'Sita Rai',
      category: 'Writing',
      followers: 456,
      description: 'Storyteller sharing tales from rural Nepal',
      avatar: '/api/placeholder/48/48',
      isVerified: false,
      trending: true
    },
    {
      name: 'Bishal KC',
      category: 'Cooking',
      followers: 1234,
      description: 'Traditional Nepali cuisine and modern fusion',
      avatar: '/api/placeholder/48/48',
      isVerified: true,
      trending: true
    },
    {
      name: 'Maya Gurung',
      category: 'Crafts',
      followers: 789,
      description: 'Handmade traditional Nepali crafts and tutorials',
      avatar: '/api/placeholder/48/48',
      isVerified: false,
      trending: false
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Supporter Header */}
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
                  Supporter Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Welcome back, {userProfile.display_name}
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
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {activity.creator[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {activity.creator}
                        </span>
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
              {followingCreators.map((creator) => (
                <Card key={creator.id} className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {creator.name[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {creator.name}
                        </h3>
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
                      {creator.tier}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="flex items-center space-x-1">
                        <Gift className="w-3 h-3" />
                        <span>Support</span>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Bookmark className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
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
                {discoverCreators.map((creator, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {creator.name[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {creator.name}
                          </h4>
                          {creator.isVerified && (
                            <Crown className="w-4 h-4 text-blue-500" />
                          )}
                          {creator.trending && (
                            <Badge variant="secondary" className="text-xs">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Trending
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {creator.category} • {creator.followers} followers
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {creator.description}
                    </p>
                    
                    <div className="flex items-center space-x-2">
                      <Button size="sm" className="flex-1">
                        <Heart className="w-3 h-3 mr-1" />
                        Follow
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
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