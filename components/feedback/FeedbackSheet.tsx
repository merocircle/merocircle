'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Send, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FeedbackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  displayName?: string;
  isCreator?: boolean;
  onMount?: (ref: { focus: () => void }) => void;
}

export function FeedbackSheet({ open, onOpenChange, userId, displayName, isCreator, onMount }: FeedbackSheetProps) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (onMount) {
      onMount({
        focus: () => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }
      });
    }
  }, [onMount]);

  React.useEffect(() => {
    if (open && mounted && textareaRef.current) {
      // Longer delay to ensure the mobile sidebar is fully closed
      const timeout = setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [open, mounted]);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: null, // No question for user-initiated feedback
          answer: answer.trim(),
          user_id: userId,
          display_name: displayName,
          is_creator: isCreator || false,
          feedback_type: 'user_initiated',
        }),
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setAnswer('');
        onOpenChange(false);
      }, 1500);
    } catch {
      // Silently fail for feedback
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !mounted) return null;

  const content = (
    <div className="fixed inset-0 z-[9999]" onClick={() => onOpenChange(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 md:left-auto md:right-auto md:bottom-4 md:left-20 md:w-[380px] animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-card border border-border/60 rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Feedback</span>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {submitted ? (
            <div className="px-5 py-8 text-center">
              <div className="text-2xl mb-2">Thank you!</div>
              <p className="text-sm text-muted-foreground">Your feedback helps us improve.</p>
            </div>
          ) : (
            <div className="px-5 pb-5">
              {/* Header text - no question */}
              <p className="text-base font-medium text-foreground leading-snug mb-4">
                Any bug report, feature request, or few words is appreciated
              </p>

              {/* Answer */}
              <textarea
                ref={textareaRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Share your thoughts, report bugs, or suggest features..."
                rows={4}
                className={cn(
                  "w-full resize-none rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm",
                  "placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40",
                  "transition-all"
                )}
              />

              {/* Submit */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-[11px] text-muted-foreground/60">
                  {isCreator ? 'Creator' : 'Supporter'} {displayName ? `\u00B7 ${displayName}` : ''}
                </span>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!answer.trim() || submitting}
                  className="gap-1.5 rounded-lg px-4"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
