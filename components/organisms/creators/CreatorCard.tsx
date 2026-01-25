"use client";

import * as React from "react";
import { useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Users, FileText, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/atoms/avatars/UserAvatar";
import { VerifiedBadge } from "@/components/atoms/badges/VerifiedBadge";
import { CategoryBadge } from "@/components/atoms/badges/CategoryBadge";
import { BookmarkButton } from "@/components/atoms/buttons/BookmarkButton";
import { fadeInUp, cardHover, countUp } from "@/components/animations/variants";
import { useDashboardViewSafe } from "@/contexts/dashboard-context";

interface CreatorCardProps {
  id: string;
  displayName: string;
  bio?: string | null;
  photoUrl?: string | null;
  coverImageUrl?: string | null;
  category?: string;
  isVerified?: boolean;
  supportersCount: number;
  postsCount: number;
  isBookmarked?: boolean;
  onBookmark?: () => void;
  className?: string;
}

export function CreatorCard({
  id,
  displayName,
  bio,
  photoUrl,
  coverImageUrl,
  category,
  isVerified = false,
  supportersCount,
  postsCount,
  isBookmarked = false,
  onBookmark,
  className,
}: CreatorCardProps) {
  const { openCreatorProfile } = useDashboardViewSafe();

  const handleCreatorClick = useCallback(() => {
    openCreatorProfile(id);
  }, [openCreatorProfile, id]);

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <Card
        className={cn(
          "group overflow-hidden transition-all duration-300 hover:shadow-xl",
          className
        )}
      >
        {/* Cover image */}
        <div className="relative h-28 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
          {coverImageUrl && (
            <Image
              src={coverImageUrl}
              alt={`${displayName}'s cover`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

          {/* Bookmark button */}
          {onBookmark && (
            <div className="absolute top-2 right-2">
              <BookmarkButton
                isBookmarked={isBookmarked}
                onToggle={onBookmark}
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="relative px-4 pb-4">
          {/* Avatar */}
          <motion.div
            className="absolute -top-8 left-4 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={handleCreatorClick}
          >
            <UserAvatar
              src={photoUrl}
              alt={displayName}
              fallback={displayName}
              size="xl"
              showBorder
              borderColor="border-card"
            />
          </motion.div>

          {/* Info */}
          <div className="pt-10">
            <div className="flex items-start justify-between">
              <div>
                <div
                  onClick={handleCreatorClick}
                  className="flex items-center gap-1.5 group/name cursor-pointer"
                >
                  <h3 className="font-semibold text-lg group-hover/name:text-primary transition-colors">
                    {displayName}
                  </h3>
                  {isVerified && <VerifiedBadge size="md" />}
                </div>

                {category && (
                  <div className="mt-1">
                    <CategoryBadge category={category} size="sm" />
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                {bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="font-medium">{supportersCount.toLocaleString()}</span>
                <span className="hidden sm:inline">supporters</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="font-medium">{postsCount.toLocaleString()}</span>
                <span className="hidden sm:inline">posts</span>
              </div>
            </div>

            {/* Action */}
            <Button
              variant="outline"
              className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              onClick={handleCreatorClick}
            >
              View Profile
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
