"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CreatorCard } from "./CreatorCard";
import { CardSkeletonGrid } from "@/components/atoms/skeletons/CardSkeleton";
import { staggerContainer } from "@/components/animations/variants";
import { Users } from "lucide-react";

interface Creator {
  id: string;
  display_name: string;
  bio?: string | null;
  photo_url?: string | null;
  cover_image_url?: string | null;
  category?: string;
  is_verified?: boolean;
  supporters_count: number;
  posts_count: number;
  is_bookmarked?: boolean;
}

interface CreatorGridProps {
  creators: Creator[];
  isLoading?: boolean;
  columns?: 2 | 3 | 4;
  onBookmark?: (creatorId: string) => void;
  emptyMessage?: string;
  className?: string;
}

export function CreatorGrid({
  creators,
  isLoading = false,
  columns = 3,
  onBookmark,
  emptyMessage = "No creators found",
  className,
}: CreatorGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  if (isLoading) {
    return <CardSkeletonGrid count={6} variant="creator" />;
  }

  if (creators.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          className="p-4 rounded-full bg-muted mb-4"
        >
          <Users className="h-8 w-8 text-muted-foreground" />
        </motion.div>
        <h3 className="text-lg font-semibold mb-2">No creators yet</h3>
        <p className="text-muted-foreground max-w-sm">{emptyMessage}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={cn("grid gap-4", gridCols[columns], className)}
    >
      {creators.map((creator) => (
        <CreatorCard
          key={creator.id}
          id={creator.id}
          displayName={creator.display_name}
          bio={creator.bio}
          photoUrl={creator.photo_url}
          coverImageUrl={creator.cover_image_url}
          category={creator.category}
          isVerified={creator.is_verified}
          supportersCount={creator.supporters_count}
          postsCount={creator.posts_count}
          isBookmarked={creator.is_bookmarked}
          onBookmark={onBookmark ? () => onBookmark(creator.id) : undefined}
        />
      ))}
    </motion.div>
  );
}
