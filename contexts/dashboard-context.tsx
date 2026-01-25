'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
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
  setActiveView: (view: DashboardView) => void;
  // Creator profile viewing (renders in main content area)
  viewingCreatorId: string | null;
  openCreatorProfile: (creatorId: string) => void;
  closeCreatorProfile: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeView, setActiveViewState] = useState<DashboardView>('home');
  const [viewingCreatorId, setViewingCreatorId] = useState<string | null>(null);
  const previousViewRef = useRef<DashboardView>('home');
  const initializedRef = useRef(false);

  // Handle initial URL params
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const view = searchParams.get('view') as DashboardView;
    const creator = searchParams.get('creator');

    if (creator) {
      // If there's a creator param, open their profile view
      setViewingCreatorId(creator);
      setActiveViewState('creator-profile');
      // Clean up URL
      router.replace('/dashboard', { scroll: false });
    } else if (view) {
      setActiveViewState(view);
      router.replace('/dashboard', { scroll: false });
    }
  }, [searchParams, router]);

  const setActiveView = useCallback((view: DashboardView) => {
    // If switching away from creator-profile, clear the creator
    if (view !== 'creator-profile') {
      setViewingCreatorId(null);
    }
    setActiveViewState(view);
  }, []);

  const openCreatorProfile = useCallback((creatorId: string) => {
    // Save current view to go back to
    previousViewRef.current = activeView !== 'creator-profile' ? activeView : previousViewRef.current;
    setViewingCreatorId(creatorId);
    setActiveViewState('creator-profile');
  }, [activeView]);

  const closeCreatorProfile = useCallback(() => {
    setViewingCreatorId(null);
    // Go back to previous view
    setActiveViewState(previousViewRef.current);
  }, []);

  return (
    <DashboardContext.Provider value={{
      activeView,
      setActiveView,
      viewingCreatorId,
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
      setActiveView: (() => {}) as (view: DashboardView) => void,
      viewingCreatorId: null as string | null,
      openCreatorProfile: (() => {}) as (creatorId: string) => void,
      closeCreatorProfile: (() => {}) as () => void,
      isWithinProvider: false
    };
  }
  return { ...context, isWithinProvider: true };
}
