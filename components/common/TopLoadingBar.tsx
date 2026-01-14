'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TopLoadingBarProps {
  isLoading: boolean;
  color?: string;
  height?: number;
  className?: string;
}

export function TopLoadingBar({
  isLoading,
  color = 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
  height = 2,
  className
}: TopLoadingBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      // Complete the animation quickly when loading stops
      setProgress(100);
      const timer = setTimeout(() => setProgress(0), 200);
      return () => clearTimeout(timer);
    }

    // Simulate progress when loading starts
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // Stop at 90% until loading completes
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {(isLoading || progress > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed top-0 left-0 right-0 z-[9999] ${className || ''}`}
          style={{ height: `${height}px` }}
        >
          <motion.div
            className={`h-full ${color}`}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{
              type: 'tween',
              ease: 'easeOut',
              duration: 0.3
            }}
            style={{
              boxShadow: `0 0 10px ${color.includes('blue') ? '#3b82f6' : '#a855f7'}, 0 0 5px ${color.includes('blue') ? '#3b82f6' : '#a855f7'}`,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
