'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { useReducedMotion } from '@/contexts/motion-context';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Smooth page transition wrapper
 * Optimized to prevent layout shifts - only fades, no position changes
 * Respects prefers-reduced-motion accessibility setting
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: prefersReducedMotion ? 1 : 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.1,
        ease: 'easeOut'
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
