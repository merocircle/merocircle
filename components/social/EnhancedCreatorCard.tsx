"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Users, FileText, Star, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useFollow } from '@/hooks/useSocial';
import type { Creator } from '@/hooks/useSocial';

interface EnhancedCreatorCardProps {
  creator: Creator;
  onFollowChange?: (creatorId: string, isFollowing: boolean) => void;
}

export function EnhancedCreatorCard({ creator, onFollowChange }: EnhancedCreatorCardProps) {
  const [isFollowing, setIsFollowing] = useState(creator.isFollowing || false);
  const [followerCount, setFollowerCount] = useState(creator.follower_count || 0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [animatedFollowers, setAnimatedFollowers] = useState(0);
  const [animatedPosts, setAnimatedPosts] = useState(0);
  const { followCreator, unfollowCreator, loading } = useFollow();

  // Animate counters
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const stepDuration = duration / steps;

    const followersIncrement = followerCount / steps;
    const postsIncrement = (creator.posts_count || 0) / steps;

    let currentStep = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        currentStep++;
        setAnimatedFollowers(Math.min(Math.floor(followersIncrement * currentStep), followerCount));
        setAnimatedPosts(Math.min(Math.floor(postsIncrement * currentStep), creator.posts_count || 0));

        if (currentStep >= steps) {
          clearInterval(interval);
        }
      }, stepDuration);
      return () => clearInterval(interval);
    }, 300);

    return () => clearTimeout(timer);
  }, [followerCount, creator.posts_count]);

  const handleFollowToggle = async () => {
    const wasFollowing = isFollowing;
    const newFollowingState = !wasFollowing;
    const newFollowerCount = wasFollowing ? followerCount - 1 : followerCount + 1;
    
    setIsFollowing(newFollowingState);
    setFollowerCount(newFollowerCount);
    onFollowChange?.(creator.user_id, newFollowingState);
    
    try {
      if (wasFollowing) {
        await unfollowCreator(creator.user_id);
      } else {
        await followCreator(creator.user_id);
      }
    } catch {
      setIsFollowing(wasFollowing);
      setFollowerCount(followerCount);
      onFollowChange?.(creator.user_id, wasFollowing);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (!creator || !creator.user_id || !creator.display_name) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className="w-full"
    >
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Cover Image Background */}
        <div className="relative h-32 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        </div>

        {/* Bookmark Button */}
        <button
          onClick={() => setIsBookmarked(!isBookmarked)}
          className="absolute top-3 right-3 z-10 rounded-full bg-background/80 backdrop-blur-sm p-2 hover:bg-background transition-colors"
        >
          <Bookmark className={cn(
            'h-4 w-4 text-foreground transition-all',
            isBookmarked && 'fill-current text-yellow-500'
          )} />
        </button>

        <div className="relative px-6 pb-6 -mt-12">
          {/* Avatar */}
          <div className="relative w-20 h-20 mb-4">
            <div className="w-full h-full rounded-full border-4 border-card overflow-hidden bg-card shadow-lg">
              {creator.avatar_url ? (
                <Image
                  src={creator.avatar_url}
                  alt={creator.display_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-xl">
                  {creator.display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Name and Bio */}
          <Link href={`/creator/${creator.user_id}`}>
            <h3 className="text-xl font-bold text-foreground mb-1 hover:text-primary transition-colors cursor-pointer">
              {creator.display_name}
            </h3>
          </Link>
          {creator.bio && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
              {creator.bio}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4 py-3 border-t border-b border-border">
            <div className="text-center">
              <div className="text-xl font-bold text-foreground mb-1">
                {formatNumber(animatedFollowers)}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Users className="h-3 w-3" />
                Followers
              </div>
            </div>
            <div className="text-center border-l border-r border-border">
              <div className="text-xl font-bold text-foreground mb-1">
                {animatedPosts}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <FileText className="h-3 w-3" />
                Posts
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-foreground mb-1">
                4.8
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                Rating
              </div>
            </div>
          </div>

          {/* Follow Button */}
          <Button
            onClick={handleFollowToggle}
            disabled={loading[creator.user_id]}
            variant={isFollowing ? "outline" : "default"}
            className="w-full"
            size="sm"
          >
            <Heart className={cn(
              'h-4 w-4 mr-2 transition-all',
              isFollowing && 'fill-current'
            )} />
            {loading[creator.user_id] ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
