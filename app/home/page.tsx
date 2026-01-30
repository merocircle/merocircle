'use client';

import { PageLayout } from '@/components/common/PageLayout';
import FeedSection from '@/components/dashboard/sections/FeedSection';

export default function HomePage() {
  return (
    <PageLayout>
      <FeedSection />
    </PageLayout>
  );
}
