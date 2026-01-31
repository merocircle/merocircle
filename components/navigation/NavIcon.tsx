'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface NavIconProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  badge?: number;
  onClick?: () => void;
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  onMouseEnter?: () => void;
}

export function NavIcon({
  icon: Icon,
  label,
  isActive = false,
  badge,
  onClick,
  href,
  size = 'md',
  showLabel = false,
  className,
  onMouseEnter
}: NavIconProps) {
  const [isPressed, setIsPressed] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 18,
    md: 22,
    lg: 26
  };

  const content = (
    <>
      {/* Active indicator pill (left side for ActivityBar) */}
      {isActive && (
        <motion.div
          layoutId="nav-active-pill"
          className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-full"
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        />
      )}

      {/* Icon with fill animation */}
      <motion.div
        className="relative"
        animate={{
          scale: isActive ? 1.1 : 1
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        whileTap={{ scale: 0.95 }}
      >
        <Icon
          size={iconSizes[size]}
          className={cn(
            'transition-all duration-200',
            isActive ? 'stroke-[1.5]' : 'stroke-2'
          )}
          fill={isActive ? 'currentColor' : 'transparent'}
        />

        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <motion.span
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            <motion.span
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.8, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              {badge > 99 ? '99+' : badge}
            </motion.span>
          </motion.span>
        )}
      </motion.div>

      {/* Label */}
      {showLabel && (
        <span className={cn(
          'text-[10px] font-medium transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )}>
          {label}
        </span>
      )}
    </>
  );

  const baseClasses = cn(
    'relative flex flex-col items-center justify-center gap-1 rounded-xl transition-colors',
    sizeClasses[size],
    isActive
      ? 'text-primary'
      : 'text-muted-foreground hover:text-foreground',
    className
  );

  if (href) {
    return (
      <Link 
        href={href} 
        prefetch={true}
        onMouseEnter={onMouseEnter}
        onClick={() => setIsPressed(true)}
      >
        <motion.div
          className={baseClasses}
          animate={{
            scale: isPressed ? 0.92 : 1,
            opacity: isPressed ? 0.7 : 1
          }}
          whileHover={{ y: -2, scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {content}
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      className={baseClasses}
      whileHover={{ y: -2, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {content}
    </motion.button>
  );
}

// Specialized variant for bottom navigation
interface BottomNavIconProps extends Omit<NavIconProps, 'size'> {
  isCenter?: boolean;
}

export function BottomNavIcon({
  icon: Icon,
  label,
  isActive = false,
  badge,
  onClick,
  href,
  isCenter = false,
  className,
  onMouseEnter
}: BottomNavIconProps) {
  if (isCenter) {
    const centerButton = (
      <motion.div
        className={cn(
          'relative flex items-center justify-center w-14 h-14 -mt-6 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30',
          className
        )}
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <Icon size={28} strokeWidth={2} />
      </motion.div>
    );

    if (href) {
      return (
        <Link href={href} prefetch={true} className="block">
          {centerButton}
        </Link>
      );
    }
    return (
      <motion.button onClick={onClick} className="block">
        {centerButton}
      </motion.button>
    );
  }

  const bottomNavContent = (
    <>
      <motion.div
        className="relative"
        animate={{ scale: isActive ? 1.1 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Icon
          size={24}
          className={cn(
            'transition-all duration-200',
            isActive ? 'stroke-[1.5]' : 'stroke-2'
          )}
          fill={isActive ? 'currentColor' : 'transparent'}
        />

        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <motion.span
            className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 flex items-center justify-center text-[9px] font-bold text-white bg-red-500 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {badge > 99 ? '99+' : badge}
          </motion.span>
        )}
      </motion.div>

      <span className={cn(
        'text-[10px] font-medium',
        isActive ? 'text-primary' : 'text-muted-foreground'
      )}>
        {label}
      </span>

      {/* Active dot indicator */}
      {isActive && (
        <motion.div
          className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"
          layoutId="bottom-nav-indicator"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </>
  );

  const bottomNavClasses = cn(
    'relative flex flex-col items-center justify-center gap-0.5 py-2 flex-1',
    isActive ? 'text-primary' : 'text-muted-foreground',
    className
  );

  if (href) {
    return (
      <Link href={href} prefetch={true} onMouseEnter={onMouseEnter}>
        <motion.div
          className={bottomNavClasses}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {bottomNavContent}
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      className={bottomNavClasses}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {bottomNavContent}
    </motion.button>
  );
}
