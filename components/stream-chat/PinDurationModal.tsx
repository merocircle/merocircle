'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pin } from 'lucide-react';

export type PinDurationOption = '1d' | '7d' | '30d' | 'forever';

const DURATION_LABELS: Record<PinDurationOption, string> = {
  '1d': '1 day',
  '7d': '7 days',
  '30d': '30 days',
  forever: 'No expiry',
};

/** Returns expiration Date or null for "forever". */
export function getExpirationForOption(option: PinDurationOption): Date | null {
  if (option === 'forever') return null;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const days = option === '1d' ? 1 : option === '7d' ? 7 : 30;
  return new Date(now + days * day);
}

interface PinDurationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (expiration: Date | null) => void;
  isLoading?: boolean;
}

export function PinDurationModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: PinDurationModalProps) {
  const [selected, setSelected] = React.useState<PinDurationOption>('7d');

  const handleConfirm = () => {
    const expiration = getExpirationForOption(selected);
    onConfirm(expiration);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" showCloseButton>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Pin className="h-5 w-5 text-primary" />
            <DialogTitle>Pin message</DialogTitle>
          </div>
          <DialogDescription>
            How long should this message stay pinned?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          {(['1d', '7d', '30d', 'forever'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSelected(option)}
              className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50 ${
                selected === option
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
            >
              <span>{DURATION_LABELS[option]}</span>
              {selected === option && (
                <span className="text-primary text-xs font-medium">Selected</span>
              )}
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Pinning…' : 'Pin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
