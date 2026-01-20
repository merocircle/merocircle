'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

type DashboardView = 'home' | 'chat' | 'notifications' | 'settings';

interface DashboardContextType {
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialView = (searchParams.get('view') as DashboardView) || 'home';
  const [activeView, setActiveViewState] = useState<DashboardView>(initialView);

  useEffect(() => {
    if (searchParams.get('view')) {
      router.replace('/dashboard', { scroll: false });
    }
  }, [searchParams, router]);

  const setActiveView = useCallback((view: DashboardView) => {
    setActiveViewState(view);
  }, []);
  
  useEffect(() => {
    const urlView = searchParams.get('view') as DashboardView;
    if (urlView && urlView !== activeView) {
      setActiveViewState(urlView);
    }
  }, [searchParams, activeView]);

  return (
    <DashboardContext.Provider value={{ activeView, setActiveView }}>
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
