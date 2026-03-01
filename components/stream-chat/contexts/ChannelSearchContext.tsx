'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

export interface ChannelSearchState {
  searchQuery: string;
  matchIds: string[];
  currentIndex: number;
}

interface ChannelSearchContextValue extends ChannelSearchState {
  setSearchResults: (query: string, matchIds: string[]) => void;
  setCurrentIndex: (index: number) => void;
  goNext: () => void;
  goPrev: () => void;
  clearSearch: () => void;
}

const defaultState: ChannelSearchState = {
  searchQuery: '',
  matchIds: [],
  currentIndex: 0,
};

const ChannelSearchContext = createContext<ChannelSearchContextValue | null>(null);

export function ChannelSearchProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ChannelSearchState>(defaultState);

  const setSearchResults = useCallback((query: string, matchIds: string[]) => {
    setState({ searchQuery: query, matchIds, currentIndex: matchIds.length > 0 ? 0 : 0 });
  }, []);

  const setCurrentIndex = useCallback((index: number) => {
    setState((prev) => ({ ...prev, currentIndex: index }));
  }, []);

  const goNext = useCallback(() => {
    setState((prev) => {
      if (prev.matchIds.length === 0) return prev;
      const next = (prev.currentIndex + 1) % prev.matchIds.length;
      return { ...prev, currentIndex: next };
    });
  }, []);

  const goPrev = useCallback(() => {
    setState((prev) => {
      if (prev.matchIds.length === 0) return prev;
      const prevIndex = prev.currentIndex - 1;
      const next = prevIndex < 0 ? prev.matchIds.length - 1 : prevIndex;
      return { ...prev, currentIndex: next };
    });
  }, []);

  const clearSearch = useCallback(() => {
    setState(defaultState);
  }, []);

  const value: ChannelSearchContextValue = {
    ...state,
    setSearchResults,
    setCurrentIndex,
    goNext,
    goPrev,
    clearSearch,
  };

  return (
    <ChannelSearchContext.Provider value={value}>
      {children}
    </ChannelSearchContext.Provider>
  );
}

export function useChannelSearch() {
  const ctx = useContext(ChannelSearchContext);
  return ctx;
}
