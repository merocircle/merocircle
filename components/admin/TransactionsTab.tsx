'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, TrendingUp, Clock, CheckCircle2, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { PayoutDialog } from './PayoutDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdminStats {
  pendingOnboardings: number;
  transactions: {
    allTime: { count: number; total: number };
    thisMonth: { count: number; total: number };
  };
  platformEarnings: {
    allTime: { platform: number; creators: number };
    thisMonth: { platform: number; creators: number };
  };
  pendingPayouts: { count: number; total: number };
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  payoutStatus: string;
  payoutId: string | null;
  tierLevel: number;
  message: string;
  createdAt: string;
  completedAt: string | null;
  supporter: { id: string; displayName: string; email: string } | null;
  creator: { id: string; displayName: string; email: string } | null;
  platformEarnings: {
    platformCut: number;
    creatorShare: number;
    platformCutPercentage: number;
  } | null;
}

interface CreatorEarning {
  creatorId: string;
  displayName: string;
  email: string;
  unpaidAmount: number;
  transactionCount: number;
}

export function TransactionsTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [unpaidByCreator, setUnpaidByCreator] = useState<CreatorEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<string>('all');
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
    fetchTransactions();
  }, [statusFilter, payoutStatusFilter]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        setUnpaidByCreator(data.unpaidByCreator || []);
      }
    } catch (error) {
      logger.error('Failed to fetch admin stats', 'TRANSACTIONS_TAB', { error: error instanceof Error ? error.message : String(error) });
      toast({ title: 'Error', description: 'Failed to load stats', variant: 'destructive' });
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (payoutStatusFilter !== 'all') params.append('payout_status', payoutStatusFilter);

      const response = await fetch(`/api/admin/transactions?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load transactions',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load transactions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutComplete = () => {
    fetchStats();
    fetchTransactions();
  };

  const formatCurrency = (amount: number, currency: string = 'NPR') => {
    return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
      case 'processing':
        return 'secondary';
      case 'failed':
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPayoutStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'paid_out':
        return 'default';
      case 'included_in_payout':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.transactions.thisMonth.total)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.transactions.thisMonth.count} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Earnings (5%)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.platformEarnings.thisMonth.platform)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.pendingPayouts.total)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingPayouts.count} payouts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Creator Unpaid Earnings */}
      {unpaidByCreator.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Creator Earnings (Unpaid)</CardTitle>
                <CardDescription>Creators waiting for payout</CardDescription>
              </div>
              <Button onClick={() => setShowPayoutDialog(true)}>
                Create Payout
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unpaidByCreator.slice(0, 5).map((creator) => (
                <div key={creator.creatorId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{creator.displayName}</p>
                    <p className="text-sm text-muted-foreground">{creator.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(creator.unpaidAmount)}</p>
                    <p className="text-xs text-muted-foreground">{creator.transactionCount} transactions</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>Complete transaction history with platform cuts</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={payoutStatusFilter} onValueChange={setPayoutStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Payout Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payout Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="included_in_payout">In Payout</SelectItem>
                  <SelectItem value="paid_out">Paid Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Supporter</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Platform (5%)</TableHead>
                    <TableHead className="text-right">Creator (95%)</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="text-sm">
                        {format(new Date(txn.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{txn.supporter?.displayName || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{txn.supporter?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{txn.creator?.displayName || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{txn.creator?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(txn.amount, txn.currency)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {txn.platformEarnings ? formatCurrency(txn.platformEarnings.platformCut, txn.currency) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {txn.platformEarnings ? formatCurrency(txn.platformEarnings.creatorShare, txn.currency) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {txn.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(txn.status)}>
                          {txn.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPayoutStatusBadgeVariant(txn.payoutStatus)}>
                          {txn.payoutStatus === 'paid_out' ? 'Paid' : 
                           txn.payoutStatus === 'included_in_payout' ? 'In Payout' : 
                           'Pending'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Dialog */}
      <PayoutDialog
        open={showPayoutDialog}
        onOpenChange={setShowPayoutDialog}
        creators={unpaidByCreator}
        onComplete={handlePayoutComplete}
      />
    </div>
  );
}
