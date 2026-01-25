'use client';

import { memo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  FileText,
  Star,
  CheckCircle,
  Share2,
  MoreHorizontal
} from 'lucide-react';
import { fadeInUp, scaleIn } from '@/components/animations/variants';
import { cn } from '@/lib/utils';

interface CreatorHeroProps {
  displayName: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  bio?: string;
  category?: string;
  isVerified?: boolean;
  supporterCount: number;
  postsCount: number;
  isSupporter?: boolean;
  onShare?: () => void;
  onMore?: () => void;
  className?: string;
}

export const CreatorHero = memo(function CreatorHero({
  displayName,
  avatarUrl,
  coverImageUrl,
  bio,
  category,
  isVerified,
  supporterCount,
  postsCount,
  isSupporter,
  onShare,
  onMore,
  className,
}: CreatorHeroProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative h-64 bg-gradient-to-r from-primary/80 via-pink-600 to-red-500 overflow-hidden"
      >
        {coverImageUrl && (
          <Image
            src={coverImageUrl}
            alt={`${displayName} cover`}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />
      </motion.div>

      {/* Profile Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="relative -mt-20 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
            {/* Profile Avatar */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Avatar className="w-32 h-32 border-4 border-background shadow-xl ring-4 ring-background">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-primary-foreground text-4xl font-bold">
                  {displayName?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            </motion.div>

            {/* Profile Info */}
            <div className="flex-1 pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <motion.div
                    className="flex items-center gap-3 mb-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h1 className="text-3xl font-bold text-foreground">
                      {displayName}
                    </h1>
                    {isVerified && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, delay: 0.4 }}
                      >
                        <CheckCircle className="w-6 h-6 text-blue-500" />
                      </motion.div>
                    )}
                  </motion.div>

                  <motion.div
                    className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <motion.span
                        key={supporterCount}
                        initial={{ scale: 1.2, color: 'var(--primary)' }}
                        animate={{ scale: 1, color: 'inherit' }}
                      >
                        {supporterCount}
                      </motion.span>
                      {' '}supporters
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {postsCount} posts
                    </span>
                    {category && (
                      <Badge variant="outline" className="gap-1">
                        <Star className="w-3 h-3" />
                        {category}
                      </Badge>
                    )}
                  </motion.div>
                </div>

                {/* Action Buttons */}
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {isSupporter && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Badge variant="secondary" className="gap-1 px-3 py-1">
                        <CheckCircle className="w-3 h-3" />
                        Supporter
                      </Badge>
                    </motion.div>
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onShare}
                    className="hover:scale-110 transition-transform"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onMore}
                    className="hover:scale-110 transition-transform"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>

              {bio && (
                <motion.p
                  className="mt-4 text-muted-foreground max-w-3xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {bio}
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
});
