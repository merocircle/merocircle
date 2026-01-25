'use client';

import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home,
  Search,
  PlusCircle,
  MessageCircle,
  User,
  Settings
} from 'lucide-react';
import { BottomNavIcon } from './NavIcon';
import { cn } from '@/lib/utils';
import { type DashboardView } from '@/contexts/dashboard-context';

interface BottomNavProps {
  activeView?: DashboardView;
  onViewChange?: (view: DashboardView) => void;
  unreadMessages?: number;
  onCreateClick?: () => void;
  className?: string;
}

export function BottomNav({
  activeView = 'home',
  onViewChange,
  unreadMessages = 0,
  onCreateClick,
  className
}: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isOnDashboard = pathname === '/dashboard';

  const handleNavClick = (view: DashboardView) => {
    if (isOnDashboard) {
      onViewChange?.(view);
    } else {
      router.push(`/dashboard?view=${view}`);
    }
  };

  return (
    <motion.nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 border-t border-border/50 bg-background/80 backdrop-blur-xl pb-safe',
        'md:hidden', // Only show on mobile
        className
      )}
      initial={{ y: 64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Home */}
      <BottomNavIcon
        icon={Home}
        label="Home"
        isActive={isOnDashboard && activeView === 'home'}
        onClick={() => handleNavClick('home')}
      />

      {/* Explore */}
      <BottomNavIcon
        icon={Search}
        label="Explore"
        isActive={isOnDashboard && activeView === 'explore'}
        onClick={() => handleNavClick('explore')}
      />

      {/* Create (Center) */}
      <BottomNavIcon
        icon={PlusCircle}
        label="Create"
        isCenter
        onClick={onCreateClick}
      />

      {/* Messages */}
      <BottomNavIcon
        icon={MessageCircle}
        label="Chat"
        isActive={isOnDashboard && activeView === 'chat'}
        badge={unreadMessages}
        onClick={() => handleNavClick('chat')}
      />

      {/* Profile - now uses view */}
      <BottomNavIcon
        icon={User}
        label="Me"
        isActive={isOnDashboard && activeView === 'profile'}
        onClick={() => handleNavClick('profile')}
      />
    </motion.nav>
  );
}

// Mobile header component with hide-on-scroll behavior
interface MobileHeaderProps {
  title?: string;
  showTabs?: boolean;
  activeTab?: 'for-you' | 'following';
  onTabChange?: (tab: 'for-you' | 'following') => void;
  onSettingsClick?: () => void;
  hideHeader?: boolean;
  className?: string;
}

export function MobileHeader({
  title = 'MeroCircle',
  showTabs = false,
  activeTab = 'for-you',
  onTabChange,
  onSettingsClick,
  hideHeader = false,
  className
}: MobileHeaderProps) {
  // Don't render header at all when hidden
  if (hideHeader) return null;

  return (
    <motion.header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 flex flex-col border-b border-border/50 bg-background/80 backdrop-blur-xl pt-safe',
        'md:hidden', // Only show on mobile
        className
      )}
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>

        {/* Settings Button - Top Right */}
        <motion.button
          onClick={onSettingsClick}
          className="p-2 rounded-full hover:bg-muted/80 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      </div>

      {showTabs && (
        <div className="flex items-center gap-6 px-4 pb-2">
          <button
            onClick={() => onTabChange?.('for-you')}
            className={cn(
              'relative pb-2 text-sm font-medium transition-colors',
              activeTab === 'for-you' ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            For You
            {activeTab === 'for-you' && (
              <motion.div
                layoutId="mobile-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => onTabChange?.('following')}
            className={cn(
              'relative pb-2 text-sm font-medium transition-colors',
              activeTab === 'following' ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            Following
            {activeTab === 'following' && (
              <motion.div
                layoutId="mobile-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>
      )}
    </motion.header>
  );
}
