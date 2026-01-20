'use client';

import { Suspense, useMemo, memo, useTransition } from 'react';
import { useDashboardView } from '@/contexts/dashboard-context';
import { useNotificationsData, useCommunityChannels } from '@/hooks/useQueries';

import FeedSection from './sections/FeedSection';
import CommunitySection from './sections/CommunitySection';
import NotificationsSection from './sections/NotificationsSection';
import SettingsSection from './sections/SettingsSection';
import { FeedSkeleton, ChatSkeleton, NotificationsSkeleton, SettingsSkeleton } from './sections/LoadingSkeleton';

const UnifiedDashboard = memo(function UnifiedDashboard() {
  const { activeView } = useDashboardView();
  const [isPending, startTransition] = useTransition();
  
  const { data: notificationsData } = useNotificationsData();
  const { data: channelsData } = useCommunityChannels();

  const { component: renderView, skeleton } = useMemo(() => {
    switch (activeView) {
      case 'home':
        return { component: <FeedSection />, skeleton: <FeedSkeleton /> };
      case 'chat':
        return { component: <CommunitySection />, skeleton: <ChatSkeleton /> };
      case 'notifications':
        return { component: <NotificationsSection />, skeleton: <NotificationsSkeleton /> };
      case 'settings':
        return { component: <SettingsSection />, skeleton: <SettingsSkeleton /> };
      default:
        return { component: <FeedSection />, skeleton: <FeedSkeleton /> };
    }
  }, [activeView]);

  return (
    <div className="h-full flex flex-col">
      <Suspense fallback={skeleton}>
        <div className="flex-1 overflow-hidden">
          {renderView}
        </div>
      </Suspense>
    </div>
  );
});

export default UnifiedDashboard;
