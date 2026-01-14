'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { SidebarNav } from '@/components/sidebar-nav';
import { useAuth } from '@/contexts/supabase-auth-context';
import { LoadingSpinner } from '@/components/dashboard/LoadingSpinner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EnhancedCreatorCard } from '@/components/social/EnhancedCreatorCard';
import { useDiscoveryFeed } from '@/hooks/useSocial';
import { 
  Search, 
  TrendingUp, 
  Sparkles,
  Music,
  Palette,
  Camera,
  Video,
  BookOpen,
  Utensils,
  Code,
  Dumbbell,
  Heart,
  Users,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  { name: 'All', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
  { name: 'Music', icon: Music, color: 'from-blue-500 to-cyan-500' },
  { name: 'Art', icon: Palette, color: 'from-red-500 to-orange-500' },
  { name: 'Photography', icon: Camera, color: 'from-green-500 to-emerald-500' },
  { name: 'Video', icon: Video, color: 'from-purple-500 to-violet-500' },
  { name: 'Writing', icon: BookOpen, color: 'from-yellow-500 to-orange-500' },
  { name: 'Cooking', icon: Utensils, color: 'from-red-500 to-pink-500' },
  { name: 'Tech', icon: Code, color: 'from-blue-500 to-indigo-500' },
  { name: 'Fitness', icon: Dumbbell, color: 'from-green-500 to-teal-500' },
];

export default function DashboardPage() {
  const { isAuthenticated, loading: authLoading, userProfile } = useAuth();
  const router = useRouter();
  const { feed, loading } = useDiscoveryFeed();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
        <SidebarNav />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Combine creators and deduplicate by user_id
  const allCreatorsMap = new Map();
  [...(feed?.trending_creators || []), ...(feed?.suggested_creators || [])].forEach(creator => {
    if (!allCreatorsMap.has(creator.user_id)) {
      allCreatorsMap.set(creator.user_id, creator);
    }
  });
  const allCreators = Array.from(allCreatorsMap.values());
  
  // Filter creators for "Creators for you" section - only show trending (exclude suggested)
  const creatorsForYou = (feed?.trending_creators || []).filter(creator => {
    const matchesCategory = selectedCategory === 'All' || 
      creator.creator_profile?.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery || 
      creator.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <SidebarNav />
      
      <main className="flex-1 overflow-y-auto">
        {/* Header with Search */}
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search creators or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 text-base bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>
              <Button variant="outline" size="icon" className="h-11 w-11">
                <Search className="w-5 h-5" />
              </Button>
            </div>

            {/* Category Filter Pills */}
            <div className="mt-4 flex overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide space-x-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.name;
                
                return (
                  <Button
                    key={category.name}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.name)}
                    className={cn(
                      'flex-shrink-0 gap-2 h-9',
                      isActive && `bg-gradient-to-r ${category.color} text-white border-0 hover:opacity-90`
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="p-6 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white border-0 overflow-hidden relative">
              <div className="relative z-10">
                <h1 className="text-2xl font-bold mb-2">
                  Welcome back, {userProfile?.display_name || 'Creator'}! 👋
                </h1>
                <p className="text-white/90 mb-4">
                  Discover amazing creators and support their work
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">{allCreators.length} Creators</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm font-medium">50K+ Supporters</span>
                  </div>
                </div>
              </div>
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
              <div className="absolute right-20 bottom-0 w-48 h-48 bg-white/10 rounded-full -mb-24" />
            </Card>
          </motion.div>

          {/* Recently Visited */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Recently Visited
              </h2>
              <Button variant="ghost" size="sm">
                See All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {allCreators.slice(0, 6).map((creator) => (
                <Link
                  key={creator.user_id}
                  href={`/creator/${creator.user_id}`}
                  className="group"
                >
                  <Card className="p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="aspect-square w-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg mb-3 overflow-hidden">
                      {creator.avatar_url ? (
                        <img 
                          src={creator.avatar_url} 
                          alt={creator.display_name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                          {creator.display_name?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate group-hover:text-red-500 transition-colors">
                      {creator.display_name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {creator.follower_count || 0} followers
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Based on your recent visits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Based on your recent visits
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Creators you might like
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {feed?.suggested_creators?.slice(0, 6).map((creator) => (
                <EnhancedCreatorCard key={creator.user_id} creator={creator} />
              ))}
            </div>
          </motion.div>

          {/* Creators for you */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Creators for you
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedCategory !== 'All' ? `${selectedCategory} creators` : 'Trending creators making waves'}
                </p>
              </div>
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {creatorsForYou.length === 0 ? (
              <Card className="p-12 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No creators found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search or filters
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {creatorsForYou.map((creator) => (
                  <EnhancedCreatorCard key={creator.user_id} creator={creator} />
                ))}
              </div>
            )}
          </motion.div>

          {/* CTA Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 mb-8"
          >
            <Card className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center border-0">
              <h2 className="text-2xl font-bold mb-2">
                Are you a creator?
              </h2>
              <p className="text-white/90 mb-6">
                Join thousands of creators earning on Creators Nepal
              </p>
              <Link href="/signup/creator">
                <Button size="lg" variant="secondary">
                  Start Creating
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
