'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface CreatorEarning {
  creatorId: string;
  displayName: string;
  email: string;
  unpaidAmount: number;
  transactionCount: number;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  createdAt: string;
  platformEarnings: {
    creatorShare: number;
  } | null;
}

interface PayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creators: CreatorEarning[];
  onComplete: () => void;
}

export function PayoutDialog({ open, onOpenChange, creators, onComplete }: PayoutDialogProps) {
  const [step, setStep] = useState(1);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [payoutMethod, setPayoutMethod] = useState('');
  const [payoutReference, setPayoutReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingTransactions, setFetchingTransactions] = useState(false);
  const { toast } = useToast();

  const selectedCreator = creators.find(c => c.creatorId === selectedCreatorId);
  const totalAmount = selectedTransactionIds.reduce((sum, txnId) => {
    const txn = transactions.find(t => t.id === txnId);
    return sum + (txn?.platformEarnings?.creatorShare || 0);
  }, 0);

  useEffect(() => {
    if (selectedCreatorId) {
      fetchCreatorTransactions();
    }
  }, [selectedCreatorId]);

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setStep(1);
      setSelectedCreatorId('');
      setTransactions([]);
      setSelectedTransactionIds([]);
      setPayoutMethod('');
      setPayoutReference('');
      setNotes('');
    }
  }, [open]);

  const fetchCreatorTransactions = async () => {
    try {
      setFetchingTransactions(true);
      const response = await fetch(
        `/api/admin/transactions?creator_id=${selectedCreatorId}&status=completed&payout_status=pending`
      );
      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions || []);
        // Auto-select all transactions
        setSelectedTransactionIds(data.transactions.map((t: Transaction) => t.id));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load transactions',
        variant: 'destructive'
      });
    } finally {
      setFetchingTransactions(false);
    }
  };

  const handleToggleTransaction = (txnId: string) => {
    setSelectedTransactionIds(prev =>
      prev.includes(txnId)
        ? prev.filter(id => id !== txnId)
        : [...prev, txnId]
    );
  };

  const handleToggleAll = () => {
    if (selectedTransactionIds.length === transactions.length) {
      setSelectedTransactionIds([]);
    } else {
      setSelectedTransactionIds(transactions.map(t => t.id));
    }
  };

  const handleNext = () => {
    if (step === 1 && !selectedCreatorId) {
      toast({
        title: 'Error',
        description: 'Please select a creator',
        variant: 'destructive'
      });
      return;
    }
    if (step === 2 && selectedTransactionIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one transaction',
        variant: 'destructive'
      });
      return;
    }
    if (step === 3 && !payoutMethod) {
      toast({
        title: 'Error',
        description: 'Please select a payout method',
        variant: 'destructive'
      });
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Get date range of selected transactions
      const txnDates = selectedTransactionIds.map(id => {
        const txn = transactions.find(t => t.id === id);
        return new Date(txn?.createdAt || '');
      });
      const periodStart = new Date(Math.min(...txnDates.map(d => d.getTime())));
      const periodEnd = new Date(Math.max(...txnDates.map(d => d.getTime())));

      const response = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: selectedCreatorId,
          transactionIds: selectedTransactionIds,
          amount: totalAmount,
          payoutMethod,
          payoutReference,
          notes,
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString()
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Payout created for ${selectedCreator?.displayName}`
        });
        onComplete();
        onOpenChange(false);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create payout',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create payout',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `NPR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Payout - Step {step} of 3</DialogTitle>
          <DialogDescription>
            {step === 1 && 'Select a creator to create a payout for'}
            {step === 2 && 'Select transactions to include in this payout'}
            {step === 3 && 'Enter payout details and confirm'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step 1: Select Creator */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="creator">Select Creator</Label>
                <Select value={selectedCreatorId} onValueChange={setSelectedCreatorId}>
                  <SelectTrigger id="creator">
                    <SelectValue placeholder="Choose a creator..." />
                  </SelectTrigger>
                  <SelectContent>
                    {creators.map(creator => (
                      <SelectItem key={creator.creatorId} value={creator.creatorId}>
                        {creator.displayName} - {formatCurrency(creator.unpaidAmount)} ({creator.transactionCount} transactions)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCreator && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">{selectedCreator.displayName}</p>
                  <p className="text-xs text-muted-foreground">{selectedCreator.email}</p>
                  <p className="text-lg font-bold mt-2">{formatCurrency(selectedCreator.unpaidAmount)}</p>
                  <p className="text-xs text-muted-foreground">{selectedCreator.transactionCount} unpaid transactions</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Transactions */}
          {step === 2 && (
            <div className="space-y-4">
              {fetchingTransactions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <Label>Select Transactions</Label>
                    <Button variant="outline" size="sm" onClick={handleToggleAll}>
                      {selectedTransactionIds.length === transactions.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>

                  <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                    {transactions.map(txn => (
                      <div key={txn.id} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                        <Checkbox
                          checked={selectedTransactionIds.includes(txn.id)}
                          onCheckedChange={() => handleToggleTransaction(txn.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{format(new Date(txn.createdAt), 'MMM d, yyyy')}</p>
                              <p className="text-xs text-muted-foreground">{txn.paymentMethod}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">
                                {formatCurrency(txn.platformEarnings?.creatorShare || 0)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                from {formatCurrency(txn.amount)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-primary/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Payout Amount:</span>
                      <span className="text-xl font-bold">{formatCurrency(totalAmount)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedTransactionIds.length} transactions selected
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Payout Details */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="payout-method">Payout Method *</Label>
                <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                  <SelectTrigger id="payout-method">
                    <SelectValue placeholder="Select method..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="esewa">eSewa</SelectItem>
                    <SelectItem value="khalti">Khalti</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="payout-reference">Payout Reference</Label>
                <Input
                  id="payout-reference"
                  placeholder="Transaction ID or reference number"
                  value={payoutReference}
                  onChange={(e) => setPayoutReference(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this payout"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Creator:</span>
                  <span className="text-sm font-medium">{selectedCreator?.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Transactions:</span>
                  <span className="text-sm font-medium">{selectedTransactionIds.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Method:</span>
                  <span className="text-sm font-medium">{payoutMethod || '-'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">Total Amount:</span>
                  <span className="text-lg font-bold">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} disabled={loading}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading || !payoutMethod}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Payout'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
