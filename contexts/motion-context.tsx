'use client';

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';

interface MotionContextType {
  prefersReducedMotion: boolean;
}

const MotionContext = createContext<MotionContextType>({
  prefersReducedMotion: false,
});

/**
 * Provides reduced motion preference throughout the app
 * Respects user's accessibility settings
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check user's motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <MotionContext.Provider value={{ prefersReducedMotion }}>
      {children}
    </MotionContext.Provider>
  );
}

/**
 * Hook to access motion preferences
 * Returns true if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const { prefersReducedMotion } = useContext(MotionContext);
  return prefersReducedMotion;
}

/**
 * Get transition config respecting reduced motion
 */
export function getTransition(duration: number = 0.2, prefersReducedMotion: boolean = false) {
  return {
    duration: prefersReducedMotion ? 0 : duration,
    ease: prefersReducedMotion ? 'linear' : 'easeOut',
  };
}

/**
 * Get animation config respecting reduced motion
 */
export function getAnimationProps(prefersReducedMotion: boolean = false) {
  if (prefersReducedMotion) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 1 },
      transition: { duration: 0 },
    };
  }
  
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15, ease: 'easeOut' },
  };
}
