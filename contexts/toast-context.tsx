"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (options: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((options: Omit<ToastItem, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { ...options, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx === undefined) {
    // Return a no-op when outside provider (e.g. SSR or wrong tree) so app doesn't crash
    return {
      toasts: [],
      addToast: () => {},
      removeToast: () => {},
    };
  }
  return ctx;
}
