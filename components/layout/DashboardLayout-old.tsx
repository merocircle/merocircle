'use client';

import { ReactNode, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityBar } from '@/components/navigation/ActivityBar';
import { BottomNav, MobileHeader } from '@/components/navigation/BottomNav';
import { RightPanel } from './RightPanel';
import { cn } from '@/lib/utils';
import { type DashboardView } from '@/contexts/dashboard-context';
import { LAYOUT } from './constants';

type ContextView = 'feed' | 'explore' | 'chat' | 'notifications' | 'creator-studio' | 'profile' | 'settings' | 'creator-profile';

const FULL_WIDTH_VIEWS: ContextView[] = ['chat', 'creator-studio', 'profile', 'settings', 'creator-profile'];

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
  onSettingsClick?: () => void;
  // Layout options
  hideRightPanel?: boolean;
  hideContextSidebar?: boolean;
  fullWidth?: boolean;
  mobileTitle?: string;
  showMobileTabs?: boolean;
  className?: string;
}

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
  onSettingsClick?: () => void;
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
  onSettingsClick,
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

  // Memoize computed layout values
  const layoutState = useMemo(() => {
    const shouldHideMobileHeader = contextView !== 'feed';
    const shouldShowRightPanel = shouldShowRightPanelUtil(hideRightPanel, contextView);
    const isFullWidth = isFullWidthView(contextView, fullWidth);

    return {
      shouldHideMobileHeader,
      shouldShowRightPanel,
      isFullWidth,
    };
  }, [contextView, hideRightPanel, fullWidth]);

  const toggleContextCollapse = useCallback(() => {
    setIsContextCollapsed((prev) => !prev);
  }, []);

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Mobile Header - Only show on feed view */}
      <MobileHeader
        title={mobileTitle}
        showTabs={showMobileTabs && contextView === 'feed'}
        activeTab={mobileTab}
        onTabChange={handleMobileTabChange}
        onSettingsClick={onSettingsClick}
        hideHeader={layoutState.shouldHideMobileHeader}
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
        />
      </div>

      {/* Context Sidebar - Large desktop only, hidden for chat/notifications (they have their own UI) */}
      {!hideContextSidebar && contextView === 'feed' && (
        <div className="hidden lg:block fixed left-16 top-0 z-40">
          <ContextSidebar
            view={contextView}
            isCollapsed={isContextCollapsed}
            onToggleCollapse={toggleContextCollapse}
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
        className={getMainContentClassName({
          contextView,
          shouldHideMobileHeader: layoutState.shouldHideMobileHeader,
          hideContextSidebar,
          isContextCollapsed,
          shouldShowRightPanel: layoutState.shouldShowRightPanel,
        })}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={contextView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={getContentWrapperClassName({
              isFullWidthView: layoutState.isFullWidth,
              contextView,
            })}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Right Panel - Show on medium screens and up, only for feed/explore */}
      {layoutState.shouldShowRightPanel && (
        <div className="hidden md:block fixed right-0 top-0 z-40">
          <RightPanel stories={stories} />
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
