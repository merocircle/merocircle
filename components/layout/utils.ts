import { cn } from '@/lib/utils';

type ContextView = 'explore' | 'chat' | 'notifications' | 'creator-studio' | 'profile' | 'settings' | 'creator-profile';

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
    shouldHideMobileHeader ? 'pt-4 pb-20 px-4' : 'pt-24 pb-20 px-4',
    // Tablet: reduced gap after activity bar (64px bar + 4px gap = 68px)
    'md:pt-4 md:pb-4 md:pl-[68px]',
    // Tablet and up: account for right panel when visible
    shouldShowRightPanel ? 'md:pr-[328px]' : 'md:pr-4'
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
    // Wider max-width to better utilize available space
    !isFullWidthView && 'max-w-[700px] mx-auto',
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
  return !hideRightPanel && contextView === 'explore';
}
