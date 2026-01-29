"use client";

import { motion } from "framer-motion";
import "./PostSkeleton.css";

interface PostSkeletonProps {
  count?: number;
}

export function PostSkeleton({ count = 3 }: PostSkeletonProps) {
  return (
    <div className="post-skeleton-container">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="post-skeleton"
        >
          <div className="post-skeleton-header">
            <div className="post-skeleton-avatar" />
            <div className="post-skeleton-header-text">
              <div className="post-skeleton-title" />
              <div className="post-skeleton-subtitle" />
            </div>
          </div>
          <div className="post-skeleton-content">
            <div className="post-skeleton-line" />
            <div className="post-skeleton-line post-skeleton-line-short" />
          </div>
          <div className="post-skeleton-media" />
          <div className="post-skeleton-actions">
            <div className="post-skeleton-button" />
            <div className="post-skeleton-button" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
