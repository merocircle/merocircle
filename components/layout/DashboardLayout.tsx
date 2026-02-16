'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityBar } from '@/components/navigation/ActivityBar';
import { BottomNav, MobileHeader } from '@/components/navigation/BottomNav';
import { cn } from '@/lib/utils';
import { type DashboardView } from '@/contexts/dashboard-context';

type ContextView = 'explore' | 'chat' | 'notifications' | 'creator-studio' | 'profile' | 'settings' | 'creator-profile';

const FULL_WIDTH_VIEWS: ContextView[] = ['chat', 'creator-studio', 'profile', 'settings', 'creator-profile'];

interface DashboardLayoutProps {
  children: ReactNode;
  user?: {
    id: string;
    display_name: string;
    photo_url: string | null;
  } | null;
  activeView?: DashboardView;
  onViewChange?: (view: DashboardView) => void;
  contextView?: ContextView;
  unreadMessages?: number;
  unreadNotifications?: number;
  favoriteCreators?: Array<{
    id: string;
    display_name: string;
    photo_url: string | null;
  }>;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  suggestedCreators?: Array<{
    id: string;
    display_name: string;
    photo_url: string | null;
    supporter_count: number;
    category?: string;
  }>;
  trendingCreators?: Array<{
    id: string;
    display_name: string;
    photo_url: string | null;
    supporter_count: number;
  }>;
  stories?: Array<{
    id: string;
    display_name: string;
    photo_url: string | null;
    hasNewStory?: boolean;
  }>;
  onCreateClick?: () => void;
  onSettingsClick?: () => void;
  hideRightPanel?: boolean;
  hideContextSidebar?: boolean;
  fullWidth?: boolean;
  mobileTitle?: string;
  showMobileTabs?: boolean;
  className?: string;
}

export function DashboardLayout({
  children,
  user,
  activeView = 'home',
  onViewChange,
  contextView = 'explore',
  unreadMessages = 0,
  unreadNotifications = 0,
  favoriteCreators = [],
  stories = [],
  onCreateClick,
  onSettingsClick,
  hideRightPanel = false,
  fullWidth = false,
  mobileTitle = 'MeroCircle',
  showMobileTabs = true,
  className
}: DashboardLayoutProps) {
  const isFullWidth = fullWidth || FULL_WIDTH_VIEWS.includes(contextView);
  const shouldHideMobileHeader = contextView !== 'explore';

  return (
    <div className={cn('min-h-[100dvh] bg-background', className)}>
      {/* Mobile Header */}
      <MobileHeader
        title={mobileTitle}
        showTabs={false}
        onSettingsClick={onSettingsClick}
        hideHeader={shouldHideMobileHeader}
      />

      {/* Desktop Grid: [ActivityBar | Content] */}
      <div
        className={cn(
          'grid min-h-[100dvh]',
          // Mobile: single column (3.5rem nav + safe area)
          'pb-[calc(3.5rem+env(safe-area-inset-bottom))]',
          // Desktop: 2-column with activity bar
          'md:grid-cols-[64px_minmax(0,1fr)] md:pb-0',
        )}
      >
        {/* Activity Bar — desktop only */}
        <aside className="hidden md:block">
          <ActivityBar
            user={user}
            activeView={activeView}
            onViewChange={onViewChange}
            unreadMessages={unreadMessages}
            unreadNotifications={unreadNotifications}
            favoriteCreators={favoriteCreators}
          />
        </aside>

        {/* Main Content — safe area under mobile header when shown; scrollable except chat */}
        <main className={cn(
          'min-h-[100dvh] overflow-x-hidden w-full md:pt-0',
          !shouldHideMobileHeader && 'pt-[calc(3rem+env(safe-area-inset-top))]',
          contextView !== 'chat' && 'overflow-y-auto',
          contextView === 'chat' && 'h-[calc(100dvh-3.5rem)] md:h-[100dvh] overflow-hidden'
        )}>
          <div className={cn(
            'h-full min-h-0 mx-auto pb-[calc(3.5rem+1rem)] md:pb-0',
            !isFullWidth && 'max-w-[830px] w-full px-3 sm:px-4 md:px-6',
            contextView === 'chat' && 'overflow-hidden max-w-none px-0 sm:px-0'
          )}>
            <AnimatePresence mode="wait">
              <motion.div
                key={contextView}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Bottom Navigation — mobile only */}
      <BottomNav
        activeView={activeView}
        onViewChange={onViewChange}
        unreadMessages={unreadMessages}
        onCreateClick={onCreateClick}
      />
    </div>
  );
}

// Page transition wrapper
interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
