'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageSquare, User, Calendar, Mail, Copy, Check, CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FeedbackItem {
  id: string;
  question: string | null;
  answer: string;
  user_id: string | null;
  display_name: string;
  is_creator: boolean;
  email: string | null;
  feedback_type: 'periodic' | 'user_initiated';
  addressed: boolean;
  created_at: string;
}

export function FeedbackTab() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      console.log('[FeedbackTab] Fetching feedback...');
      const response = await fetch('/api/admin/feedback');
      const data = await response.json();

      console.log('[FeedbackTab] Received response:', {
        success: data.success,
        feedbackCount: data.feedback?.length || 0,
        total: data.total,
        feedback: data.feedback,
      });

      if (data.success) {
        setFeedback(data.feedback || []);
        setTotal(data.total || 0);
        console.log('[FeedbackTab] State updated:', {
          feedbackCount: data.feedback?.length || 0,
          total: data.total,
        });
      } else {
        console.error('[FeedbackTab] API returned error:', data);
        toast({
          title: 'Error',
          description: data.error || 'Failed to load feedback',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[FeedbackTab] Error fetching feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to load feedback',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      toast({
        title: 'Copied!',
        description: `Email address copied to clipboard`,
      });
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (error) {
      console.error('Failed to copy email:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy email address',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAddressed = async (feedbackId: string, currentAddressed: boolean) => {
    try {
      const response = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressed: !currentAddressed }),
      });

      if (!response.ok) {
        throw new Error('Failed to update feedback');
      }

      // Update local state - the sortedFeedback will automatically re-sort
      setFeedback((prev) =>
        prev.map((item) =>
          item.id === feedbackId ? { ...item, addressed: !currentAddressed } : item
        )
      );
    } catch (error) {
      console.error('Failed to update addressed status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update feedback status',
        variant: 'destructive',
      });
    }
  };

  // Sort feedback: unaddressed first, then addressed (both sorted by date descending)
  const sortedFeedback = useMemo(() => {
    return [...feedback].sort((a, b) => {
      // If one is addressed and the other isn't, unaddressed comes first
      if (a.addressed !== b.addressed) {
        return a.addressed ? 1 : -1;
      }
      // Otherwise, sort by created_at descending (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [feedback]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unaddressed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {feedback.filter((f) => !f.addressed).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">From Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedback.filter((f) => f.is_creator).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">From Supporters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedback.filter((f) => !f.is_creator).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>All Feedback</CardTitle>
          <CardDescription>User feedback and reviews</CardDescription>
        </CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No feedback yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedFeedback.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "p-4 rounded-lg border border-border/40 bg-card hover:bg-muted/30 transition-colors",
                    item.addressed && "opacity-60"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-2 pt-1">
                      <Checkbox
                        checked={item.addressed}
                        onCheckedChange={() => handleToggleAddressed(item.id, item.addressed)}
                        className="mt-1"
                      />
                      {item.addressed && (
                        <span className="text-[10px] text-muted-foreground">Addressed</span>
                      )}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={undefined} />
                      <AvatarFallback>
                        {item.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-semibold text-foreground">{item.display_name}</span>
                        <Badge variant={item.is_creator ? 'default' : 'secondary'}>
                          {item.is_creator ? 'Creator' : 'Supporter'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.feedback_type === 'user_initiated' ? 'User Initiated' : 'Periodic'}
                        </Badge>
                        {item.email && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <a
                              href={`mailto:${item.email}`}
                              className="flex items-center gap-1 text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Mail className="w-3 h-3" />
                              <span>{item.email}</span>
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyEmail(item.email!);
                              }}
                              className="p-1 rounded hover:bg-muted transition-colors"
                              title="Copy email"
                            >
                              {copiedEmail === item.email ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                              )}
                            </button>
                          </div>
                        )}
                        {item.user_id && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span className="font-mono">{item.user_id.slice(0, 8)}...</span>
                          </div>
                        )}
                      </div>
                      {item.question && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Question:</p>
                          <p className="text-sm text-foreground">{item.question}</p>
                        </div>
                      )}
                      <div className="mb-3">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Answer:</p>
                        <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md">
                          {item.answer}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(item.created_at), 'PPp')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
