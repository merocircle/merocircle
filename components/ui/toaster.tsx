"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { useToastContext } from "@/contexts/toast-context";
import { cn } from "@/lib/utils";

const AUTO_DISMISS_MS = 4000;

function ToastItem({
  id,
  title,
  description,
  variant = "default",
  onDismiss,
}: {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [id, onDismiss]);

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg transition-opacity duration-200",
        "min-w-[280px] max-w-[360px]",
        variant === "destructive"
          ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100"
          : "border-border bg-card text-card-foreground"
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="shrink-0 rounded p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const { toasts, removeToast } = useToastContext();

  if (!toasts?.length) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      <div className="flex flex-col gap-2 pointer-events-auto">
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            id={t.id}
            title={t.title}
            description={t.description}
            variant={t.variant}
            onDismiss={removeToast}
          />
        ))}
      </div>
    </div>
  );
}
