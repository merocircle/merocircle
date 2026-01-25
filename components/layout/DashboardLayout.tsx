'use client';

import { ReactNode, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityBar } from '@/components/navigation/ActivityBar';
import { BottomNav, MobileHeader } from '@/components/navigation/BottomNav';
import { ContextSidebar } from '@/components/navigation/ContextSidebar';
import { RightPanel } from './RightPanel';
import { cn } from '@/lib/utils';
import { type DashboardView } from '@/contexts/dashboard-context';

type ContextView = 'feed' | 'explore' | 'chat' | 'notifications' | 'creator-studio' | 'profile' | 'settings' | 'creator-profile';

interface DashboardLayoutProps {
  children: ReactNode;
  user?: {
    id: string;
    display_name: string;
    photo_url: string | null;
  } | null;
  // Dashboard view state (single-page navigation)
  activeView?: DashboardView;
  onViewChange?: (view: DashboardView) => void;
  // Navigation state
  contextView?: ContextView;
  unreadMessages?: number;
  unreadNotifications?: number;
  favoriteCreators?: Array<{
    id: string;
    display_name: string;
    photo_url: string | null;
  }>;
  // Feed state
  feedFilter?: 'for-you' | 'following' | 'trending';
  onFeedFilterChange?: (filter: 'for-you' | 'following' | 'trending') => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  // Right panel data
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
  // Callbacks
  onCreateClick?: () => void;
  // Layout options
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
  contextView = 'feed',
  unreadMessages = 0,
  unreadNotifications = 0,
  favoriteCreators = [],
  feedFilter = 'for-you',
  onFeedFilterChange,
  selectedCategory = 'All',
  onCategoryChange,
  suggestedCreators = [],
  trendingCreators = [],
  stories = [],
  onCreateClick,
  hideRightPanel = false,
  hideContextSidebar = false,
  fullWidth = false,
  mobileTitle = 'MeroCircle',
  showMobileTabs = true,
  className
}: DashboardLayoutProps) {
  const [isContextCollapsed, setIsContextCollapsed] = useState(false);
  const [mobileTab, setMobileTab] = useState<'for-you' | 'following'>('for-you');

  const handleMobileTabChange = useCallback((tab: 'for-you' | 'following') => {
    setMobileTab(tab);
    if (tab === 'following') {
      onFeedFilterChange?.('following');
    } else {
      onFeedFilterChange?.('for-you');
    }
  }, [onFeedFilterChange]);

  // Hide mobile header and tabs for non-feed views
  const shouldHideMobileHeader = contextView !== 'feed';

  // Determine if we should show the right panel (only for feed/explore)
  const shouldShowRightPanel = !hideRightPanel && (contextView === 'feed' || contextView === 'explore');

  // Full-width views (no constrained width)
  const isFullWidthView = fullWidth || ['chat', 'creator-studio', 'profile', 'settings', 'creator-profile'].includes(contextView);

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Mobile Header - Only show on feed view */}
      <MobileHeader
        title={mobileTitle}
        showTabs={showMobileTabs && contextView === 'feed'}
        activeTab={mobileTab}
        onTabChange={handleMobileTabChange}
        hideHeader={shouldHideMobileHeader}
      />

      {/* Activity Bar - Desktop only */}
      <div className="hidden md:block">
        <ActivityBar
          user={user}
          activeView={activeView}
          onViewChange={onViewChange}
          unreadMessages={unreadMessages}
          unreadNotifications={unreadNotifications}
          favoriteCreators={favoriteCreators}
          onCreateClick={onCreateClick}
        />
      </div>

      {/* Context Sidebar - Large desktop only, hidden for chat/notifications (they have their own UI) */}
      {!hideContextSidebar && contextView === 'feed' && (
        <div className="hidden lg:block fixed left-16 top-0 z-40">
          <ContextSidebar
            view={contextView}
            isCollapsed={isContextCollapsed}
            onToggleCollapse={() => setIsContextCollapsed(!isContextCollapsed)}
            feedFilter={feedFilter}
            onFeedFilterChange={onFeedFilterChange}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            suggestedCreators={suggestedCreators}
          />
        </div>
      )}

      {/* Main Content Area */}
      <main
        className={cn(
          'transition-all duration-300',
          // Use fixed height for chat view, min-h-screen for others
          contextView === 'chat' ? 'h-screen box-border overflow-hidden' : 'min-h-screen',
          // Mobile: full width with padding for header and bottom nav
          // Reduce top padding when header is hidden (non-feed views)
          shouldHideMobileHeader ? 'pt-4 pb-20 px-0' : 'pt-24 pb-20 px-4',
          // Tablet: left padding for activity bar
          'md:pt-4 md:pb-4 md:pl-20 md:pr-4',
          // Desktop: account for context sidebar (only shown for feed view)
          !hideContextSidebar && contextView === 'feed' && !isContextCollapsed && 'lg:pl-[calc(64px+240px+16px)]',
          !hideContextSidebar && contextView === 'feed' && isContextCollapsed && 'lg:pl-20',
          (hideContextSidebar || contextView !== 'feed') && 'lg:pl-20',
          // Large desktop: account for right panel (only for feed/explore)
          shouldShowRightPanel && 'xl:pr-[304px]'
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={contextView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              // Constrain width only for feed/explore views
              !isFullWidthView && 'max-w-2xl mx-auto',
              // Full height for chat view to enable internal scrolling
              contextView === 'chat' && 'h-full min-h-0 overflow-hidden'
            )}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Right Panel - Extra large desktop only, only for feed/explore */}
      {shouldShowRightPanel && (
        <div className="hidden xl:block fixed right-0 top-0 z-40">
          <RightPanel
            stories={stories}
            trendingCreators={trendingCreators}
            suggestedCreators={suggestedCreators}
          />
        </div>
      )}

      {/* Bottom Navigation - Mobile only */}
      <BottomNav
        activeView={activeView}
        onViewChange={onViewChange}
        unreadMessages={unreadMessages}
        onCreateClick={onCreateClick}
      />
    </div>
  );
}

// Page transition wrapper for use inside DashboardLayout
interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
