'use client';

import { Suspense, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import { useDashboardView } from '@/contexts/dashboard-context';
import { useAuth } from '@/contexts/auth-context';

// Eager-loaded sections (small, frequently used)
import ExploreSection from './sections/ExploreSection';
import StreamCommunitySection from './sections/StreamCommunitySection';
import NotificationsSection from './sections/NotificationsSection';
import SettingsSection from './sections/SettingsSection';
import { FeedSkeleton, ChatSkeleton, NotificationsSkeleton, SettingsSkeleton } from './sections/LoadingSkeleton';

// Lazy-loaded sections (heavy components)
const CreatorStudioSection = dynamic(() => import('./sections/CreatorStudioSection'), {
  loading: () => <SettingsSkeleton />,
  ssr: false
});

const ProfileSection = dynamic(() => import('./sections/ProfileSection'), {
  loading: () => <FeedSkeleton />,
  ssr: false
});

// Creator profile section (viewing another creator - renders in main content)
const CreatorProfileSection = dynamic(() => import('./sections/CreatorProfileSection'), {
  loading: () => <FeedSkeleton />,
  ssr: false
});

const UnifiedDashboard = memo(function UnifiedDashboard() {
  const { activeView, viewingCreatorId } = useDashboardView();
  const { isCreator } = useAuth();

  const { component: renderView, skeleton } = useMemo(() => {
    switch (activeView) {
      case 'home':
        return { component: <ExploreSection />, skeleton: <FeedSkeleton /> };
      case 'explore':
        return { component: <ExploreSection />, skeleton: <FeedSkeleton /> };
      case 'chat':
        return { component: <StreamCommunitySection />, skeleton: <ChatSkeleton /> };
      case 'notifications':
        return { component: <NotificationsSection />, skeleton: <NotificationsSkeleton /> };
      case 'settings':
        return { component: <SettingsSection />, skeleton: <SettingsSkeleton /> };
      case 'creator-studio':
        // Only render for creators
        if (!isCreator) {
          return { component: <ExploreSection />, skeleton: <FeedSkeleton /> };
        }
        return { component: <CreatorStudioSection />, skeleton: <SettingsSkeleton /> };
      case 'profile':
        return { component: <ProfileSection />, skeleton: <FeedSkeleton /> };
      case 'creator-profile':
        // Viewing another creator's profile
        if (!viewingCreatorId) {
          return { component: <ExploreSection />, skeleton: <FeedSkeleton /> };
        }
        return {
          component: <CreatorProfileSection creatorId={viewingCreatorId} />,
          skeleton: <FeedSkeleton />
        };
      default:
        return { component: <ExploreSection />, skeleton: <FeedSkeleton /> };
    }
  }, [activeView, isCreator, viewingCreatorId]);

  return (
    <div className="h-full flex flex-col relative">
      <Suspense fallback={skeleton}>
        <div className="flex-1 overflow-hidden">
          {renderView}
        </div>
      </Suspense>
    </div>
  );
});

export default UnifiedDashboard;
