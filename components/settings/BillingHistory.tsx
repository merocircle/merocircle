'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Receipt, AlertCircle, RefreshCw } from 'lucide-react';

interface BillingEntry {
  id: string;
  creator: { id: string; name: string; photo_url: string | null };
  amount: number;
  message: string | null;
  status: string;
  date: string;
}

export default function BillingHistory() {
  const [history, setHistory] = useState<BillingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/supporter/history?limit=50');
      if (!res.ok) throw new Error('Failed to load history');
      const data = await res.json();
      setHistory(data.history || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground py-8">Loading billing history...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-destructive">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
          <Button onClick={fetchHistory} variant="outline" className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>
        </div>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No payments yet</p>
          <p className="text-sm mt-1">Payment history will appear here when you support creators.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
        <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
          Billing History
        </h2>
        <Button onClick={fetchHistory} variant="ghost" size="sm" className="self-start sm:self-auto">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">All payments made within the app.</p>
      <ul className="space-y-3">
        {history.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b border-border/50 last:border-0"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarImage src={entry.creator.photo_url || undefined} />
                <AvatarFallback>{entry.creator.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm sm:text-base truncate">{entry.creator.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0 pl-13 sm:pl-0">
              <p className="font-medium text-sm sm:text-base">NPR {Number(entry.amount).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground capitalize">{entry.status}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
