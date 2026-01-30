'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// All available dashboard views
export type DashboardView =
  | 'home'
  | 'explore'
  | 'chat'
  | 'notifications'
  | 'settings'
  | 'creator-studio'   // Creator's own dashboard (only for creators)
  | 'profile'          // User's own profile
  | 'creator-profile'; // Viewing another creator's profile

interface DashboardContextType {
  activeView: DashboardView;
  setActiveView: (view: DashboardView, postId?: string) => void;
  // Creator profile viewing (renders in main content area)
  viewingCreatorId: string | null;
  highlightedPostId: string | null;
  setHighlightedPostId: (postId: string | null) => void;
  openCreatorProfile: (creatorId: string, postId?: string) => void;
  closeCreatorProfile: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeView, setActiveViewState] = useState<DashboardView>('home');
  const [viewingCreatorId, setViewingCreatorId] = useState<string | null>(null);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
  const previousViewRef = useRef<DashboardView>('home');
  const initializedRef = useRef(false);

  // Handle initial URL params
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const view = searchParams.get('view') as DashboardView;
    const creator = searchParams.get('creator');
    const postId = searchParams.get('post');

    if (creator) {
      // If there's a creator param, open their profile view
      setViewingCreatorId(creator);
      setActiveViewState('creator-profile');
      // Clean up URL - navigate to creator profile page
      router.replace(`/creator/${creator}`, { scroll: false });
    } else if (view) {
      setActiveViewState(view);
      // If there's a post param, set the highlighted post
      if (postId) {
        setHighlightedPostId(postId);
      }
      // Map view to route
      const routeMap: Record<string, string> = {
        'home': '/home',
        'explore': '/explore',
        'chat': '/chat',
        'notifications': '/notifications',
        'settings': '/settings',
        'profile': '/profile',
        'creator-studio': '/creator-studio',
      };
      const route = routeMap[view] || '/home';
      router.replace(route, { scroll: false });
    }
  }, [searchParams, router]);

  const setActiveView = useCallback((view: DashboardView, postId?: string) => {
    // If switching away from creator-profile, clear the creator
    if (view !== 'creator-profile') {
      setViewingCreatorId(null);
    }
    // Set highlighted post if provided
    setHighlightedPostId(postId || null);
    setActiveViewState(view);
  }, []);

  const openCreatorProfile = useCallback((creatorId: string, postId?: string) => {
    // Use startTransition for smooth navigation
    startTransition(() => {
      // Navigate to creator's public profile page
      const url = postId ? `/creator/${creatorId}?post=${postId}` : `/creator/${creatorId}`;
      router.push(url);
    });
  }, [router, startTransition]);

  const closeCreatorProfile = useCallback(() => {
    setViewingCreatorId(null);
    setHighlightedPostId(null);
    // Go back to previous view
    setActiveViewState(previousViewRef.current);
  }, []);

  return (
    <DashboardContext.Provider value={{
      activeView,
      setActiveView,
      viewingCreatorId,
      highlightedPostId,
      setHighlightedPostId,
      openCreatorProfile,
      closeCreatorProfile
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardView() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardView must be used within DashboardProvider');
  }
  return context;
}

// Safe version that returns default values when used outside DashboardProvider
export function useDashboardViewSafe() {
  const context = useContext(DashboardContext);
  if (!context) {
    // Return default values for pages outside DashboardProvider
    return {
      activeView: 'home' as DashboardView,
      setActiveView: (() => {}) as (view: DashboardView, postId?: string) => void,
      viewingCreatorId: null as string | null,
      highlightedPostId: null as string | null,
      setHighlightedPostId: (() => {}) as (postId: string | null) => void,
      openCreatorProfile: (() => {}) as (creatorId: string, postId?: string) => void,
      closeCreatorProfile: (() => {}) as () => void,
      isWithinProvider: false
    };
  }
  return { ...context, isWithinProvider: true };
}
