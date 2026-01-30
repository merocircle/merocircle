"use client";

import { useState, useEffect, useCallback, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, Users, FileText, Star, Bookmark, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Creator } from '@/hooks/useSocial';

interface EnhancedCreatorCardProps {
  creator: Creator;
}

export function EnhancedCreatorCard({ creator }: EnhancedCreatorCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [animatedSupporters, setAnimatedSupporters] = useState(0);
  const [animatedPosts, setAnimatedPosts] = useState(0);
  const supporterCount = creator.supporter_count || 0;

  const creatorLink = `/creator/${creator.user_id}`;

  // Prefetch on hover for instant navigation
  const handlePrefetch = useCallback(() => {
    router.prefetch(creatorLink);
  }, [router, creatorLink]);

  // Optimistic navigation
  const handleNavigate = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startTransition(() => {
      router.push(creatorLink);
    });
  }, [router, creatorLink, startTransition]);

  // Animate counters
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const stepDuration = duration / steps;

    const supportersIncrement = supporterCount / steps;
    const postsIncrement = (creator.posts_count || 0) / steps;

    let currentStep = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        currentStep++;
        setAnimatedSupporters(Math.min(Math.floor(supportersIncrement * currentStep), supporterCount));
        setAnimatedPosts(Math.min(Math.floor(postsIncrement * currentStep), creator.posts_count || 0));

        if (currentStep >= steps) {
          clearInterval(interval);
        }
      }, stepDuration);
      return () => clearInterval(interval);
    }, 300);

    return () => clearTimeout(timer);
  }, [supporterCount, creator.posts_count]);

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
            {creator.creator_profile?.is_verified && (
              <Badge className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-blue-500 border-2 border-card">
                <Star className="h-3 w-3 text-white fill-white" />
              </Badge>
            )}
          </div>

          {/* Name and Bio */}
          <Link 
            href={creatorLink}
            onMouseEnter={handlePrefetch}
            onFocus={handlePrefetch}
            onClick={handleNavigate}
          >
            <h3 className="text-xl font-bold text-foreground mb-1 hover:text-primary transition-colors cursor-pointer">
              {creator.display_name}
            </h3>
          </Link>
          {creator.bio && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
              {creator.bio}
            </p>
          )}

          {/* Category Badge */}
          {creator.creator_profile?.category && (
            <Badge variant="outline" className="mb-4">
              {creator.creator_profile.category}
            </Badge>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4 py-3 border-t border-b border-border">
            <div className="text-center">
              <div className="text-xl font-bold text-foreground mb-1">
                {formatNumber(animatedSupporters)}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Heart className="h-3 w-3" />
                Supporters
              </div>
            </div>
            <div className="text-center border-l border-border">
              <div className="text-xl font-bold text-foreground mb-1">
                {animatedPosts}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <FileText className="h-3 w-3" />
                Posts
              </div>
            </div>
          </div>

          {/* View Profile Button */}
          <Link 
            href={creatorLink}
            onMouseEnter={handlePrefetch}
            onFocus={handlePrefetch}
            onClick={handleNavigate}
          >
            <Button
              variant="default"
              className="w-full"
              size="sm"
            >
              View Profile
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}
