/**
 * Simple toast hook for admin dashboard
 * Uses native alerts for now - can be upgraded to a toast library later
 */

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const toast = (options: ToastOptions) => {
    const message = options.description 
      ? `${options.title}\n${options.description}`
      : options.title;
    
    if (options.variant === 'destructive') {
      alert(`❌ ${message}`);
    } else {
      alert(`✓ ${message}`);
    }
  };

  return { toast };
}
