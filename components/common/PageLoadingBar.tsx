'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

function LoadingBarContent() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Show loading bar on route change
    setIsLoading(true);
    
    // Shorter duration for faster perceived performance
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
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
              scaleX: [0, 0.6, 0.9, 1],
            }}
            exit={{ 
              scaleX: 1,
              opacity: 0
            }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1]
            }}
            style={{
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.6), 0 0 16px rgba(236, 72, 153, 0.4)'
            }}
          />
          
          {/* Animated flare effect */}
          <motion.div
            className="absolute top-0 h-full w-1/4"
            style={{
              filter: 'blur(4px)',
              background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.6), transparent)'
            }}
            initial={{ left: '-25%' }}
            animate={{ 
              left: ['-25%', '125%'],
            }}
            transition={{
              duration: 1,
              ease: 'easeInOut',
              repeat: Infinity
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PageLoadingBar() {
  return (
    <Suspense fallback={null}>
      <LoadingBarContent />
    </Suspense>
  );
}
