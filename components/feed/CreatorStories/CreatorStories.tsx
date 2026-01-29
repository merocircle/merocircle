"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import "./CreatorStories.css";

interface Creator {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

interface CreatorStoriesProps {
  creators: Creator[];
  loading?: boolean;
  currentUserId?: string;
}

export function CreatorStories({ creators, loading = false, currentUserId }: CreatorStoriesProps) {
  if (creators.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="creator-stories-container">
      <div className="creator-stories-header">
        <h3 className="creator-stories-title">Creators for you</h3>
      </div>
      <div className="creator-stories-scroll">
        {loading ? (
          // Skeleton loading state
          [...Array(6)].map((_, i) => (
            <div key={i} className="creator-stories-item">
              <div className="creator-stories-avatar-skeleton" />
              <div className="creator-stories-name-skeleton" />
            </div>
          ))
        ) : (
          creators
            .filter((creator) => creator.user_id !== currentUserId)
            .slice(0, 10)
            .map((creator, index) => (
              <motion.div
                key={creator.user_id}
                className="creator-stories-item"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href={`/creator/${creator.user_id}`} className="creator-stories-link">
                  {/* Gradient ring like Instagram stories */}
                  <div className="creator-stories-ring">
                    <div className="creator-stories-ring-inner">
                      <Avatar className="creator-stories-avatar">
                        <AvatarImage src={creator.avatar_url || undefined} />
                        <AvatarFallback className="creator-stories-avatar-fallback">
                          {creator.display_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <span className="creator-stories-name">
                    {creator.display_name.split(' ')[0]}
                  </span>
                </Link>
              </motion.div>
            ))
        )}
      </div>
    </div>
  );
}
