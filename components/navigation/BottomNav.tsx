'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  MessageCircle,
  User,
  Settings,
  BarChart3,
} from 'lucide-react';
import { BottomNavIcon } from './NavIcon';
import { cn } from '@/lib/utils';
import { type DashboardView } from '@/contexts/dashboard-context';
import { useAuth } from '@/contexts/auth-context';

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
  const { isCreator, creatorProfile } = useAuth();

  const getActiveViewFromPath = (): DashboardView => {
    if (pathname === '/home') return 'home';
    if (pathname === '/explore') return 'explore';
    if (pathname === '/chat') return 'chat';
    if (pathname === '/profile' || (pathname.startsWith('/creator/') && pathname.includes(creatorProfile?.vanity_username || '___never___'))) return 'profile';
    return 'home';
  };

  const currentActiveView = getActiveViewFromPath();

  const isCreatorStudioActive = pathname === '/creator-studio';
  const isSettingsActive = pathname === '/settings';

  return (
    <motion.nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'flex items-end justify-around gap-0',
        'h-[calc(3.5rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] px-2 sm:px-4',
        'border-t border-border/20',
        'bg-card/98 backdrop-blur-2xl',
        'md:hidden',
        'max-w-[100vw] overflow-hidden',
        className,
      )}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      <div className="flex flex-col items-center justify-end flex-1 min-w-0 py-2">
        <BottomNavIcon icon={Home} label="Home" isActive={currentActiveView === 'home'} href="/home" />
      </div>
      <div className="flex flex-col items-center justify-end flex-1 min-w-0 py-2">
        <BottomNavIcon icon={Search} label="Explore" isActive={currentActiveView === 'explore'} href="/explore" />
      </div>

      {/* Center: Creator Studio (creators) or Settings (non-creators) */}
      <div className="flex flex-col items-center justify-center flex-1 min-w-0 -mt-4">
        {isCreator ? (
          <Link
            href="/creator-studio"
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center shadow-lg shadow-primary/25 active:scale-95 transition-transform',
              isCreatorStudioActive
                ? 'bg-primary/90 text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-card'
                : 'bg-primary text-primary-foreground',
            )}
            aria-label="Creator Studio"
          >
            <BarChart3 className="w-5 h-5" strokeWidth={2.5} />
          </Link>
        ) : (
          <Link
            href="/settings"
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center shadow-lg shadow-primary/25 active:scale-95 transition-transform',
              isSettingsActive
                ? 'bg-primary/90 text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-card'
                : 'bg-muted text-foreground border border-border/60',
            )}
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" strokeWidth={2} />
          </Link>
        )}
      </div>

      <div className="flex flex-col items-center justify-end flex-1 min-w-0 py-2">
        <BottomNavIcon icon={MessageCircle} label="Chat" isActive={currentActiveView === 'chat'} badge={unreadMessages} href="/chat" />
      </div>
      <div className="flex flex-col items-center justify-end flex-1 min-w-0 py-2">
        <BottomNavIcon icon={User} label="Me" isActive={currentActiveView === 'profile'} href={isCreator && creatorProfile?.vanity_username ? `/creator/${creatorProfile.vanity_username}` : '/profile'} />
      </div>
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
