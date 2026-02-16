'use client';

import React, { useState, useMemo } from 'react';
import { Send, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const FEEDBACK_QUESTIONS = [
  "What feature do you use the most?",
  "Is there anything that feels buggy right now?",
  "Do you find this platform genuinely helpful? Why?",
  "What's one thing you wish MeroCircle could do?",
  "How would you describe MeroCircle to a friend?",
  "What almost made you leave today?",
  "Which feature surprised you the most?",
  "What would make you recommend MeroCircle to someone?",
  "If you could change one thing about MeroCircle, what would it be?",
  "What do you enjoy the most about being here?",
];

interface FeedbackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  displayName?: string;
  isCreator?: boolean;
}

export function FeedbackSheet({ open, onOpenChange, userId, displayName, isCreator }: FeedbackSheetProps) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const question = useMemo(() => {
    return FEEDBACK_QUESTIONS[Math.floor(Math.random() * FEEDBACK_QUESTIONS.length)];
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          answer: answer.trim(),
          user_id: userId,
          display_name: displayName,
          is_creator: isCreator || false,
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" onClick={() => onOpenChange(false)}>
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
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Quick thought</span>
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
              {/* Question */}
              <p className="text-base font-medium text-foreground leading-snug mb-4">
                {question}
              </p>

              {/* Answer */}
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your thoughts..."
                rows={3}
                className={cn(
                  "w-full resize-none rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm",
                  "placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40",
                  "transition-all"
                )}
                autoFocus
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
}
