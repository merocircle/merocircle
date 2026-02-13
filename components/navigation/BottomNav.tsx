'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Plus,
  MessageCircle,
  User,
  Settings,
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
  className,
}: BottomNavProps) {
  const pathname = usePathname();

  const getActiveViewFromPath = (): DashboardView => {
    if (pathname === '/home') return 'home';
    if (pathname === '/explore') return 'explore';
    if (pathname === '/chat') return 'chat';
    if (pathname === '/profile') return 'profile';
    return 'home';
  };

  const currentActiveView = getActiveViewFromPath();

  return (
    <motion.nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'flex items-center justify-around',
        'h-[calc(3.5rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]',
        'border-t border-border/20',
        'bg-card/98 backdrop-blur-2xl',
        'md:hidden',
        className,
      )}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      <BottomNavIcon icon={Home} label="Home" isActive={currentActiveView === 'home'} href="/home" />
      <BottomNavIcon icon={Search} label="Explore" isActive={currentActiveView === 'explore'} href="/explore" />
      
      {/* Center create button — elevated and prominent */}
      <div className="relative -mt-4">
        <motion.button
          onClick={onCreateClick}
          className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25 active:scale-95 transition-transform"
          whileTap={{ scale: 0.9 }}
          aria-label="Create"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </motion.button>
      </div>
      
      <BottomNavIcon icon={MessageCircle} label="Chat" isActive={currentActiveView === 'chat'} badge={unreadMessages} href="/chat" />
      <BottomNavIcon icon={User} label="Me" isActive={currentActiveView === 'profile'} href="/profile" />
    </motion.nav>
  );
}

// Mobile header
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
  className,
}: MobileHeaderProps) {
  if (hideHeader) return null;

  return (
    <motion.header
      className={cn(
        'fixed top-0 left-0 right-0 z-40',
        'flex flex-col',
        'border-b border-border/20',
        'bg-background/85 backdrop-blur-2xl',
        'pt-[env(safe-area-inset-top)]',
        'md:hidden',
        className,
      )}
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      <div className="flex items-center justify-between h-12 px-4">
        <h1 className="text-lg font-bold text-foreground tracking-tight">{title}</h1>
        <div className="flex items-center gap-1">
          <motion.button
            onClick={onSettingsClick}
            className="p-2 rounded-full hover:bg-muted/60 transition-colors"
            whileTap={{ scale: 0.95 }}
            aria-label="Settings"
          >
            <Settings className="w-4.5 h-4.5 text-muted-foreground" />
          </motion.button>
        </div>
      </div>

      {showTabs && (
        <div className="flex items-center gap-6 px-4 pb-2">
          <button
            onClick={() => onTabChange?.('for-you')}
            className={cn(
              'relative pb-2 text-sm font-medium transition-colors',
              activeTab === 'for-you' ? 'text-foreground' : 'text-muted-foreground',
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
              activeTab === 'following' ? 'text-foreground' : 'text-muted-foreground',
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
