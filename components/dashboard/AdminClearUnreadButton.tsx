'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Shown only to admins on the home tab. One-time action to clear
 * message unread counts for all users (Stream Chat).
 */
export function AdminClearUnreadButton() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { isAdmin: false }))
      .then((data) => {
        if (!cancelled) setIsAdmin(data?.isAdmin ?? false);
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleClear = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stream/mark-all-read', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: 'Failed',
          description: data?.error ?? 'Could not clear unread for all users.',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'Done',
        description: data?.message ?? `Processed ${data?.usersProcessed ?? 0} users.`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Request failed.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isAdmin !== true) return null;

  return (
    <div className="flex justify-end px-1 py-2 border-b border-border/20">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClear}
        disabled={loading}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <MessageCircle className="h-3.5 w-3.5" />
        )}
        Clear unread for all users
      </Button>
    </div>
  );
}
