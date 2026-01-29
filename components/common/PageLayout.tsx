'use client';

import { ReactNode, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { LoadingSpinner } from '@/components/dashboard/LoadingSpinner';
import { useAuth } from '@/contexts/supabase-auth-context';
import { DashboardProvider, type DashboardView } from '@/contexts/dashboard-context';
import { useNotificationsData } from '@/hooks/useQueries';
import { useSupportedCreators } from '@/hooks/useSupporterDashboard';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children?: ReactNode;
  loading?: boolean;
  className?: string;
  contentClassName?: string;
  showSidebar?: boolean;
  hideRightPanel?: boolean;
  hideContextSidebar?: boolean;
  fullWidth?: boolean;
}

export function PageLayout({
  children,
  loading = false,
  className,
  showSidebar = true,
  hideRightPanel = false,
  hideContextSidebar = false,
  fullWidth = false
}: PageLayoutProps) {
  // Handle loading and non-sidebar cases first (before hooks that require context)
  if (loading) {
    return (
      <div className={cn("min-h-screen bg-background flex items-center justify-center", className)}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!showSidebar) {
    // Simple layout without navigation (for auth pages, etc.)
    return (
      <div className={cn("min-h-screen bg-background", className)}>
        {children}
      </div>
    );
  }

  // When we need the full dashboard, render the inner component that uses context hooks
  // Wrap with DashboardProvider to ensure context is always available
  return (
    <DashboardProvider>
      <PageLayoutInner
        className={className}
        hideRightPanel={hideRightPanel}
        hideContextSidebar={hideContextSidebar}
        fullWidth={fullWidth}
      >
        {children}
      </PageLayoutInner>
    </DashboardProvider>
  );
}

// Inner component that uses hooks requiring DashboardProvider context
function PageLayoutInner({
  children,
  className,
  hideRightPanel,
  hideContextSidebar,
  fullWidth
}: {
  children?: ReactNode;
  className?: string;
  hideRightPanel: boolean;
  hideContextSidebar: boolean;
  fullWidth: boolean;
}) {
  const { userProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { data: notificationsData } = useNotificationsData();
  const { data: supportedCreatorsData } = useSupportedCreators();
  const supportedCreators = supportedCreatorsData?.creators || [];

  // Get active view from pathname
  const getActiveViewFromPath = (): DashboardView => {
    if (pathname === '/home') return 'home';
    if (pathname === '/explore') return 'explore';
    if (pathname === '/chat') return 'chat';
    if (pathname === '/notifications') return 'notifications';
    if (pathname === '/settings') return 'settings';
    if (pathname === '/profile') return 'profile';
    if (pathname === '/creator-studio') return 'creator-studio';
    return 'home';
  };

  const activeView = getActiveViewFromPath();

  const [feedFilter, setFeedFilter] = useState<'for-you' | 'following' | 'trending'>('for-you');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const handleCreateClick = useCallback(() => {
    // TODO: Open create post modal
    console.log('Create post clicked');
  }, []);

  // Settings navigation handled by Link components

  const mapViewToContext = (view: string) => {
    switch (view) {
      case 'home': return 'feed';
      case 'explore': return 'explore';
      case 'chat': return 'chat';
      case 'notifications': return 'notifications';
      case 'creator-studio': return 'creator-studio';
      case 'profile': return 'profile';
      case 'settings': return 'settings';
      case 'creator-profile': return 'creator-profile';
      default: return 'feed';
    }
  };

  // Map user profile to the format expected by DashboardLayout
  const user = userProfile ? {
    id: userProfile.id,
    display_name: userProfile.display_name,
    photo_url: userProfile.photo_url
  } : null;

  // Map supported creators to favorite creators format
  const favoriteCreators = (supportedCreators || [])
    .filter((c) => c.id !== userProfile?.id)
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      display_name: c.name,
      photo_url: c.photo_url
    }));

  // Determine layout options based on active view
  const shouldHideRightPanel = hideRightPanel || ['chat', 'creator-studio', 'profile', 'settings', 'creator-profile'].includes(activeView);
  const shouldHideContextSidebar = hideContextSidebar || activeView !== 'home';
  const shouldBeFullWidth = fullWidth || ['creator-studio', 'profile', 'settings', 'creator-profile'].includes(activeView);

  return (
    <DashboardLayout
      user={user}
      activeView={activeView}
      onViewChange={(view) => {
        // Map view to route and navigate
        const routeMap: Record<DashboardView, string> = {
          'home': '/home',
          'explore': '/explore',
          'chat': '/chat',
          'notifications': '/notifications',
          'settings': '/settings',
          'profile': '/profile',
          'creator-studio': '/creator-studio',
          'creator-profile': '/home', // Fallback to home for creator-profile
        };
        router.push(routeMap[view] || '/home');
      }}
      contextView={mapViewToContext(activeView) as any}
      unreadNotifications={notificationsData?.unreadCount || 0}
      unreadMessages={0}
      favoriteCreators={favoriteCreators}
      feedFilter={feedFilter}
      onFeedFilterChange={setFeedFilter}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      onCreateClick={handleCreateClick}
      onSettingsClick={() => router.push('/settings')}
      hideRightPanel={shouldHideRightPanel}
      hideContextSidebar={shouldHideContextSidebar}
      fullWidth={shouldBeFullWidth}
      className={className}
    >
      {children}
    </DashboardLayout>
  );
}
