'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';

export function useLoadingBar() {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    startLoading,
    stopLoading,
  };
}

// Component for manual loading bar (for button clicks, etc.)
export function LoadingBar({ isLoading }: { isLoading: boolean }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
          style={{ height: '2px' }}
        >
          {/* Main loading bar with gradient */}
          <motion.div
            className="w-full h-full bg-gradient-to-r from-red-500 via-pink-500 to-purple-500"
            initial={{ scaleX: 0, transformOrigin: 'left' }}
            animate={{ 
              scaleX: [0, 0.5, 1],
            }}
            exit={{ 
              scaleX: [1, 0],
              transformOrigin: 'right'
            }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1]
            }}
            style={{
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.6), 0 0 20px rgba(236, 72, 153, 0.4)'
            }}
          />
          
          {/* Animated flare effect */}
          <motion.div
            className="absolute top-0 h-full w-1/3"
            style={{
              filter: 'blur(6px)',
              background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.7), transparent)'
            }}
            initial={{ left: '-33%' }}
            animate={{ 
              left: ['-33%', '133%'],
            }}
            transition={{
              duration: 0.8,
              ease: 'easeInOut',
              repeat: Infinity
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
