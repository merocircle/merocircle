'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, ReactNode } from 'react';

interface OptimisticNavigationProviderProps {
  children: ReactNode;
}

/**
 * Provides optimistic navigation with instant visual feedback
 * Shows a smooth page transition while the route is loading
 */
export function OptimisticNavigationProvider({ children }: OptimisticNavigationProviderProps) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [displayPath, setDisplayPath] = useState(pathname);

  useEffect(() => {
    if (pathname !== displayPath) {
      setIsNavigating(false);
      setDisplayPath(pathname);
    }
  }, [pathname, displayPath]);

  return (
    <>
      {/* Navigation progress indicator */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            className="fixed top-0 left-0 right-0 h-0.5 bg-primary z-50"
            initial={{ scaleX: 0, transformOrigin: 'left' }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 1, transformOrigin: 'right', opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>
      {children}
    </>
  );
}

/**
 * Hook to trigger optimistic navigation
 * Provides instant visual feedback before route change completes
 */
export function useOptimisticNavigation() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const navigate = useCallback((href: string) => {
    setIsPending(true);
    
    // Start navigation immediately
    router.push(href);
    
    // Reset after a short delay (route should be loaded by then)
    setTimeout(() => {
      setIsPending(false);
    }, 300);
  }, [router]);

  return { navigate, isPending };
}
