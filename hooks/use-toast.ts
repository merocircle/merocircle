/**
 * Toast hook — shows a short non-blocking box in the top-right with a close button.
 * Use within ToastProvider (wrapped in root layout).
 */

import { useToastContext } from "@/contexts/toast-context";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const { addToast } = useToastContext();

  const toast = (options: ToastOptions) => {
    addToast({
      title: options.title,
      description: options.description,
      variant: options.variant ?? "default",
    });
  };

  return { toast };
}
