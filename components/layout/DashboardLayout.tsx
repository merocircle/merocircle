'use client';

import { ReactNode, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityBar } from '@/components/navigation/ActivityBar';
import { BottomNav, MobileHeader } from '@/components/navigation/BottomNav';
import { RightPanel } from './RightPanel';
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
  // Dashboard view state
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

  // Layout computed values
  const shouldShowRightPanel = !hideRightPanel && contextView === 'explore';
  const isFullWidth = fullWidth || FULL_WIDTH_VIEWS.includes(contextView);
  const shouldHideMobileHeader = contextView !== 'explore';

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Mobile Header */}
      <MobileHeader
        title={mobileTitle}
        showTabs={false}
        onSettingsClick={onSettingsClick}
        hideHeader={shouldHideMobileHeader}
      />

      {/* Desktop Grid Layout: [ActivityBar | Content | RightPanel?] */}
      <div 
        className={cn(
          'grid min-h-screen',
          // Mobile: single column with header/bottom nav spacing
          shouldHideMobileHeader ? 'pt-4 pb-20' : 'pt-24 pb-20',
          // Desktop: 2 or 3 column grid
          'md:grid-cols-[64px_minmax(0,1fr)] md:pt-0 md:pb-0',
          shouldShowRightPanel && 'lg:grid-cols-[64px_minmax(0,1fr)_320px]'
        )}
      >
        {/* Activity Bar - Desktop only */}
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

        {/* Main Content Area */}
        <main className={cn(
          'min-h-screen overflow-x-hidden min-w-screen',
          contextView === 'chat' && 'h-[100vh] md:h-screen overflow-hidden'
        )}>
          <div className={cn(
            'h-full mx-auto',
            !isFullWidth && 'max-w-[830px] w-full pl-4 pr-4',
            contextView === 'chat' && 'overflow-hidden max-w-none'
          )}>
            <AnimatePresence mode="wait">
              <motion.div
                key={contextView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'h-full',
                  contextView !== 'chat' && 'py-4'
                )}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Right Panel - LG screens and above */}
        {/* {shouldShowRightPanel && (
          <aside className="hidden lg:block overflow-hidden">
            <RightPanel stories={stories} />
          </aside>
        )} */}
      </div>

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

// Page transition wrapper
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
