import { cn } from '@/lib/utils';

type ContextView = 'feed' | 'explore' | 'chat' | 'notifications' | 'creator-studio' | 'profile' | 'settings' | 'creator-profile';

const FULL_WIDTH_VIEWS: ContextView[] = ['chat', 'creator-studio', 'profile', 'settings', 'creator-profile'];

/**
 * Computes the main content area className based on layout state
 */
export function getMainContentClassName({
  contextView,
  shouldHideMobileHeader,
  hideContextSidebar,
  isContextCollapsed,
  shouldShowRightPanel,
}: {
  contextView: ContextView;
  shouldHideMobileHeader: boolean;
  hideContextSidebar: boolean;
  isContextCollapsed: boolean;
  shouldShowRightPanel: boolean;
}): string {
  return cn(
    'transition-all duration-300',
    // Use fixed height for chat view, min-h-screen for others
    contextView === 'chat' ? 'h-screen box-border overflow-hidden' : 'min-h-screen',
    // Mobile: full width with padding for header and bottom nav
    shouldHideMobileHeader ? 'pt-4 pb-20 px-0' : 'pt-24 pb-20 px-4',
    // Tablet: left padding for activity bar
    'md:pt-4 md:pb-4 md:pl-20 md:pr-4',
    // Desktop: account for context sidebar (only shown for feed view)
    !hideContextSidebar && contextView === 'feed' && !isContextCollapsed && 'lg:pl-[calc(64px+240px+16px)]',
    !hideContextSidebar && contextView === 'feed' && isContextCollapsed && 'lg:pl-20',
    (hideContextSidebar || contextView !== 'feed') && 'lg:pl-20',
    // Large desktop: account for right panel (only for feed/explore)
    shouldShowRightPanel && 'xl:pr-[304px]'
  );
}

/**
 * Computes the content wrapper className based on view type
 */
export function getContentWrapperClassName({
  isFullWidthView,
  contextView,
}: {
  isFullWidthView: boolean;
  contextView: ContextView;
}): string {
  return cn(
    // Constrain width only for feed/explore views
    !isFullWidthView && 'max-w-2xl mx-auto',
    // Full height for chat view to enable internal scrolling
    contextView === 'chat' && 'h-full min-h-0 overflow-hidden'
  );
}

/**
 * Determines if a view should be full-width
 */
export function isFullWidthView(contextView: ContextView, fullWidth: boolean): boolean {
  return fullWidth || FULL_WIDTH_VIEWS.includes(contextView);
}

/**
 * Determines if right panel should be shown
 */
export function shouldShowRightPanel(
  hideRightPanel: boolean,
  contextView: ContextView
): boolean {
  return !hideRightPanel && (contextView === 'feed' || contextView === 'explore');
}
