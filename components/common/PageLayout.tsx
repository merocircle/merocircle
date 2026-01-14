import { ReactNode } from 'react';
import { SidebarNav } from '@/components/sidebar-nav';
import { LoadingSpinner } from '@/components/dashboard/LoadingSpinner';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: ReactNode;
  loading?: boolean;
  className?: string;
  contentClassName?: string;
  showSidebar?: boolean;
}

export function PageLayout({
  children,
  loading = false,
  className,
  contentClassName,
  showSidebar = true
}: PageLayoutProps) {
  if (loading) {
    return (
      <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-950 flex", className)}>
        {showSidebar && <SidebarNav />}
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-950 flex", className)}>
      {showSidebar && <SidebarNav />}
      <main className={cn("flex-1 overflow-y-auto", contentClassName)}>
        {children}
      </main>
    </div>
  );
}
